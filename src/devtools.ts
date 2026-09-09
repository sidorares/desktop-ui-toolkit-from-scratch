// The two processes behind the DevTools slide: the standalone UI, and the
// example run with the bridge on.
//
// The order is the only reason this is a launcher rather than a shell alias.
// The backend `REACT_X11_DEVTOOLS=1` installs *connects* to a socket, so the
// frontend has to be listening before the app starts; and the flag is read
// before the first commit, so an app cannot be handed DevTools once it is
// up. That second half is also why the deck cannot inspect itself: `npm
// start` did not set the flag, and nothing at runtime can. Hence a second
// process, and hence this file.
import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createStore,
  IDLE,
  killGroup,
  spawnDetached,
  isLive,
} from './processes.js';
import { runScript } from './runtime.js';
import type { ProcessState } from './processes.js';

/** Where the backend looks for the frontend — react-x11's own defaults. */
export const HOST = process.env.REACT_X11_DEVTOOLS_HOST || 'localhost';
export const PORT = Number(process.env.REACT_X11_DEVTOOLS_PORT) || 8097;

/** The repo root: this file is one level down. */
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** The app the demo inspects, relative to the root — named on the slide. */
export const EXAMPLE = 'examples/devtools-demo.tsx';

/** What the button does, in the form a presenter would type. On the slide,
 *  because the button is the convenience and these are the point. */
const RUN = runScript(EXAMPLE);
export const COMMANDS = [
  'npx react-devtools',
  `REACT_X11_DEVTOOLS=1 ${RUN.display}`,
] as const;

export interface DevToolsState {
  /** The standalone DevTools window. */
  ui: ProcessState;
  /** The example, with the bridge on. */
  app: ProcessState;
  /** The last thing either child said on stderr, if anything. */
  note: string;
}

const store = createStore<DevToolsState>({ ui: IDLE, app: IDLE, note: '' });

export const subscribe = store.subscribe;
export const getState = store.get;

export function isRunning(state: DevToolsState = store.get()): boolean {
  return isLive(state.ui, state.app);
}

let ui: ChildProcess | null = null;
let app: ChildProcess | null = null;

/** Bumped by every start and stop, so a port wait or an exit belonging to a
 *  run the presenter has already stopped is ignored. */
let generation = 0;

/**
 * The standalone UI. A local install is preferred over `npx` deliberately: a
 * talk is given on the wifi in the room, and `npx react-devtools` on a cold
 * cache is a hundred megabytes of Electron between the button and the demo.
 * The repo root goes along as a project root, which is what lets DevTools'
 * source view open a file in the editor.
 */
function uiCommand(): { command: string; args: string[] } {
  const local = path.join(ROOT, 'node_modules', '.bin', 'react-devtools');
  if (existsSync(local)) return { command: local, args: [ROOT] };
  return { command: 'npx', args: ['--yes', 'react-devtools', ROOT] };
}

/** Is anything accepting connections on the bridge's port? */
function probe(timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: HOST, port: PORT });
    const done = (ok: boolean): void => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref?.();
  });
}

async function waitForPort(run: number, seconds = 30): Promise<boolean> {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (run !== generation) return false;
    if (await probe()) return true;
    await sleep(250);
  }
  return false;
}

/** Both halves, in order: the UI, then the port, then the app. */
export async function start(): Promise<void> {
  if (isRunning()) return;
  const run = ++generation;
  store.set({ note: '', app: { status: 'idle', detail: `waiting for ${HOST}:${PORT}` } });

  // Something already on the port is a DevTools the presenter opened by
  // hand. Use it: a second one cannot bind, and would sit there looking
  // like the demo while the app talked to the first.
  if (await probe()) {
    store.set({
      ui: { status: 'running', detail: `already listening on ${HOST}:${PORT}` },
    });
  } else {
    store.set({ ui: { status: 'starting', detail: 'opening the DevTools window…' } });
    ui = spawnDetached({
      ...uiCommand(),
      cwd: ROOT,
      onStderr: (note) => run === generation && store.set({ note }),
      onError: (detail) => {
        ui = null;
        if (run === generation) store.set({ ui: { status: 'failed', detail } });
      },
      onExit: (detail) => {
        ui = null;
        if (run === generation) store.set({ ui: { status: 'exited', detail } });
      },
    });

    const ready = await waitForPort(run);
    if (run !== generation) return;
    if (!ready) {
      // Either it never started — in which case its own status already says
      // so — or it is up and not listening, which is worth saying.
      if (!['failed', 'exited'].includes(store.get().ui.status)) {
        store.set({ ui: { status: 'failed', detail: `no listener on ${HOST}:${PORT}` } });
      }
      store.set({ app: { status: 'idle', detail: 'not started — nothing to talk to' } });
      return;
    }
    store.set({ ui: { status: 'running', detail: `listening on ${HOST}:${PORT}` } });
  }

  store.set({ app: { status: 'starting', detail: `${EXAMPLE}, bridge on` } });
  app = spawnDetached({
    // The deck's own runtime, with a loader only if it needs one — bun
    // transpiles this file itself. See `runtime.ts`.
    command: RUN.command,
    args: RUN.args,
    cwd: ROOT,
    env: { REACT_X11_DEVTOOLS: '1' },
    onStderr: (note) => run === generation && store.set({ note }),
    onError: (detail) => {
      app = null;
      if (run === generation) store.set({ app: { status: 'failed', detail } });
    },
    onExit: (detail) => {
      app = null;
      if (run === generation) store.set({ app: { status: 'exited', detail } });
    },
  });
  if (run !== generation) return;
  store.set({
    app: { status: 'running', detail: `pid ${app.pid} — REACT_X11_DEVTOOLS=1` },
  });
}

/** Both of them down, and the slide back to where it started. */
export function stop(): void {
  generation++;
  killGroup(app);
  killGroup(ui);
  app = null;
  ui = null;
  store.set({ ui: IDLE, app: IDLE, note: '' });
}
