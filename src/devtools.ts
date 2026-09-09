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
//
// Three things can go wrong, and the panel says which. The UI may not open.
// It may open and not listen. And — the one that used to be silent — the app
// may be unable to speak the protocol at all, because react-x11 loads the
// backend lazily and shrugs when it is not installed. That third one is a
// preflight rather than a failure: a demo that cannot work should not start,
// because a window that looks right with no bridge behind it is the hardest
// thing on this slide to diagnose in front of a room.
import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { backendRemedy, missingBackend } from './devtools-backend.js';
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
 *  run the presenter has already stopped is ignored. One counter per half,
 *  because the UI can be restarted under a running app — see `restartUi`. */
let uiGeneration = 0;
let appGeneration = 0;

/** Which of the backend's packages the demo would fail to import, if any.
 *  Resolved from the *demo's* own path, since that is the process that does
 *  the importing. */
export function missing(): string[] {
  return missingBackend(path.join(ROOT, EXAMPLE));
}

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
    if (run !== uiGeneration) return false;
    if (await probe()) return true;
    await sleep(250);
  }
  return false;
}

/** The other direction: a standalone we have just killed may still be
 *  holding 8097 when its replacement tries to bind it, and the replacement's
 *  failure to bind looks exactly like a restart that did nothing. */
async function waitForPortFree(run: number, seconds = 5): Promise<void> {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (run !== uiGeneration) return;
    if (!(await probe())) return;
    await sleep(150);
  }
}

/** The standalone, and the state it reports through. */
function spawnUi(run: number): void {
  ui = spawnDetached({
    ...uiCommand(),
    cwd: ROOT,
    onStderr: (note) => run === uiGeneration && store.set({ note }),
    onError: (detail) => {
      ui = null;
      if (run === uiGeneration) store.set({ ui: { status: 'failed', detail } });
    },
    onExit: (detail) => {
      ui = null;
      if (run === uiGeneration) store.set({ ui: { status: 'exited', detail } });
    },
  });
}

/** Both halves, in order: the UI, then the port, then the app. */
export async function start(): Promise<void> {
  if (isRunning()) return;

  // Preflight. react-x11 imports the backend lazily and only warns when the
  // import throws, so without this the button starts two processes that
  // cannot ever talk to each other and look for all the world like they are
  // about to.
  const absent = missing();
  if (absent.length) {
    store.set({
      ui: { status: 'idle', detail: 'not started — nothing could talk to it' },
      app: { status: 'failed', detail: backendRemedy(absent) },
      note:
        'react-x11 imports these lazily, so the demo would have come up with no bridge at all.',
    });
    return;
  }

  const uiRun = ++uiGeneration;
  const appRun = ++appGeneration;
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
    spawnUi(uiRun);

    const ready = await waitForPort(uiRun);
    if (uiRun !== uiGeneration) return;
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
    onStderr: (note) => appRun === appGeneration && store.set({ note }),
    onError: (detail) => {
      app = null;
      if (appRun === appGeneration) store.set({ app: { status: 'failed', detail } });
    },
    onExit: (detail) => {
      app = null;
      if (appRun === appGeneration) store.set({ app: { status: 'exited', detail } });
    },
  });
  if (appRun !== appGeneration) return;
  store.set({
    app: { status: 'running', detail: `pid ${app.pid} — REACT_X11_DEVTOOLS=1` },
  });
}

/**
 * The DevTools window again, without touching the app.
 *
 * Selecting a component in the tree can take the standalone's renderer down
 * (SIGTRAP, a second or two later; deterministic with ⚙ → Components →
 * "always parse hook names for the selected element" on, and a coin flip
 * with it off). Electron leaves an empty window behind and the tree, the
 * props panel and the connection go with it.
 *
 * The app survives that, and react-devtools-core's backend retries its
 * connection on a timer — so the recovery is to restart *this* half and wait
 * a couple of seconds, and the thing not to do is stop the demo and start it
 * again, which throws away the state the audience was just looking at.
 */
export async function restartUi(): Promise<void> {
  const run = ++uiGeneration;
  const owned = ui !== null;
  killGroup(ui);
  ui = null;
  store.set({
    note: '',
    ui: { status: 'starting', detail: 'restarting the DevTools window…' },
  });

  if (owned) {
    await waitForPortFree(run);
  } else if (await probe()) {
    // Not ours and still up — the presenter's own `npx react-devtools`. A
    // second one cannot bind the port, and this one is what the app is
    // talking to; ours is not the process to restart.
    store.set({
      ui: {
        status: 'running',
        detail: `already listening on ${HOST}:${PORT} — started outside the deck`,
      },
    });
    return;
  }
  if (run !== uiGeneration) return;

  spawnUi(run);
  const ready = await waitForPort(run);
  if (run !== uiGeneration) return;
  if (!ready) {
    if (!['failed', 'exited'].includes(store.get().ui.status)) {
      store.set({ ui: { status: 'failed', detail: `no listener on ${HOST}:${PORT}` } });
    }
    return;
  }
  store.set({
    ui: {
      status: 'running',
      detail: `listening on ${HOST}:${PORT} — the app reconnects on its own`,
    },
  });
}

/** Both of them down, and the slide back to where it started. */
export function stop(): void {
  uiGeneration++;
  appGeneration++;
  killGroup(app);
  killGroup(ui);
  app = null;
  ui = null;
  store.set({ ui: IDLE, app: IDLE, note: '' });
}
