// The protocol-visualizer demo: x11vis on a port of its own, and a node-x11
// example pointed at it.
//
// x11vis is a man-in-the-middle X11 proxy — it listens on a TCP port, decodes
// everything both ways, and forwards to the real `$DISPLAY`. So "run this
// example through the visualizer" is nothing more than an environment
// variable: the example connects to `127.0.0.1:1` instead of the display it
// would otherwise have used, and every byte it sends is on screen next to
// the code that sent it.
//
// The visualizer is a sibling checkout rather than a dependency (it is not
// published), so it is *looked for* rather than imported — `X11VIS` names it
// outright, and failing that the ancestors of this repo are searched. A demo
// that cannot find it says so on the slide instead of failing silently.
import type { ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createStore,
  IDLE,
  isLive,
  killGroup,
  spawnDetached,
} from './processes.js';
import type { ProcessState } from './processes.js';
import { runScript } from './runtime.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** x11vis listens here; display N is TCP port 6000 + N. */
export const PORT = Number(process.env.X11VIS_PORT) || 6001;
export const DISPLAY = `127.0.0.1:${PORT - 6000}`;

/** Where the examples live, relative to the root. */
const EXAMPLES = 'examples/x11';

export function examplePath(name: string): string {
  return `${EXAMPLES}/${name}.js`;
}

export interface WireState {
  /** The proxy, with its own window. */
  vis: ProcessState;
  /** The example, talking to the proxy. */
  client: ProcessState;
  /** Which example is running, or ''. */
  example: string;
  note: string;
}

const store = createStore<WireState>({
  vis: IDLE,
  client: IDLE,
  example: '',
  note: '',
});

export const subscribe = store.subscribe;
export const getState = store.get;

export function isRunning(state: WireState = store.get()): boolean {
  return isLive(state.vis, state.client);
}

let vis: ChildProcess | null = null;
let client: ChildProcess | null = null;
let generation = 0;

/**
 * Where x11vis is. `X11VIS` may name the launcher or the checkout that holds
 * it; otherwise a `node_modules` install wins, and failing that the repo's
 * ancestors are searched for a sibling checkout — which is what a machine
 * with all seven repositories side by side looks like.
 */
export function findVisualizer(): string | null {
  const named = process.env.X11VIS;
  if (named) {
    for (const candidate of [named, path.join(named, 'bin', 'x11vis.mjs')]) {
      if (existsSync(candidate)) return candidate;
    }
  }
  const installed = path.join(ROOT, 'node_modules', '.bin', 'x11vis');
  if (existsSync(installed)) return installed;
  let dir = ROOT;
  for (let up = 0; up < 6; up++) {
    const candidate = path.join(
      dir,
      'x11-protocol-visualizer',
      'bin',
      'x11vis.mjs',
    );
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function probe(timeoutMs = 400): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: PORT });
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

/** The visualizer, then the example — and the visualizer stays up between
 *  examples, because three slides in a row run against the same window. */
export async function run(example: string): Promise<void> {
  const attempt = ++generation;
  store.set({ note: '', example });

  // The proxy forwards to a real server. Without one there is nothing
  // downstream of it, and the example's window has nowhere to appear.
  if (!process.env.DISPLAY) {
    store.set({
      vis: { status: 'failed', detail: 'no $DISPLAY — start XQuartz first' },
      client: IDLE,
    });
    return;
  }

  if (await probe()) {
    store.set({ vis: { status: 'running', detail: `proxying ${DISPLAY}` } });
  } else {
    const launcher = findVisualizer();
    if (!launcher) {
      store.set({
        vis: {
          status: 'failed',
          detail: 'x11-protocol-visualizer not found — set X11VIS',
        },
        client: IDLE,
      });
      return;
    }
    store.set({ vis: { status: 'starting', detail: 'x11vis, and its window…' } });
    // The visualizer's own launcher, run with whatever is running this deck.
    const visRun = runScript(launcher, ['--port', String(PORT)]);
    vis = spawnDetached({
      command: visRun.command,
      args: visRun.args,
      cwd: path.dirname(path.dirname(launcher)),
      onStderr: (note) => attempt === generation && store.set({ note }),
      onError: (detail) => {
        vis = null;
        if (attempt === generation) store.set({ vis: { status: 'failed', detail } });
      },
      onExit: (detail) => {
        vis = null;
        if (attempt === generation) store.set({ vis: { status: 'exited', detail } });
      },
    });
    if (!(await waitForPort(attempt))) {
      if (attempt !== generation) return;
      if (!['failed', 'exited'].includes(store.get().vis.status)) {
        store.set({ vis: { status: 'failed', detail: `nothing on port ${PORT}` } });
      }
      return;
    }
    if (attempt !== generation) return;
    store.set({ vis: { status: 'running', detail: `proxying ${DISPLAY}` } });
  }

  // One client at a time: the last example's window is not the one being
  // talked about, and its traffic is in the way of the traffic that is.
  killGroup(client);
  const clientRun = runScript(examplePath(example));
  client = spawnDetached({
    command: clientRun.command,
    args: clientRun.args,
    cwd: ROOT,
    env: { DISPLAY },
    onStderr: (note) => attempt === generation && store.set({ note }),
    onError: (detail) => {
      client = null;
      if (attempt === generation) store.set({ client: { status: 'failed', detail } });
    },
    onExit: (detail) => {
      client = null;
      if (attempt === generation) store.set({ client: { status: 'exited', detail } });
    },
  });
  if (attempt !== generation) return;
  store.set({
    client: { status: 'running', detail: `pid ${client.pid} — DISPLAY=${DISPLAY}` },
  });
}

/** Both of them: the example, and the window watching it. */
export function stop(): void {
  generation++;
  killGroup(client);
  killGroup(vis);
  client = null;
  vis = null;
  store.set({ vis: IDLE, client: IDLE, example: '', note: '' });
}
