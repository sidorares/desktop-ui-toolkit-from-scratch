// The charts example, as a child process.
//
// The panel on the slide is a `<Charts>` drawing this deck's own commit
// history — a few dozen points, which is the right size for a slide and the
// wrong size for the claim. "Cost follows pixels, not points" is only
// interesting at a scale a slide cannot hold, and it is only *believable*
// with a frame counter and a byte count next to it.
//
// So the button starts `@react-x11/components`' own charts example in its own
// window: a million-point series, a streaming section appending sixty points
// a second, small multiples at 90px, and a HUD under each chart printing what
// the last painted frame actually cost — mode, span, command count, estimated
// wire bytes. Zoom in and out of the million and watch the byte count stay
// where it is.
//
// A separate process rather than a panel, for two reasons. It needs its own
// connection and its own frame clock for the HUD to mean anything — a chart
// sharing this deck's would be reporting the deck's frames. And a demo that
// can wedge itself on a million points should not be able to take the talk
// down with it.
import type { ChildProcess } from 'node:child_process';

import { ROOT, runScript } from './runtime.js';
import {
  createStore,
  IDLE,
  isLive,
  killGroup,
  spawnDetached,
} from './processes.js';
import type { ProcessState } from './processes.js';

export const EXAMPLE = 'examples/charts.tsx';

// Derived, not written out: the command on the slide is the command that
// runs, and under bun that is `bun examples/charts.tsx` with no loader —
// see `runtime.ts`.
const RUN = runScript(EXAMPLE);
export const COMMAND = RUN.display;

export interface ChartsDemoState {
  app: ProcessState;
  note: string;
}

const store = createStore<ChartsDemoState>({ app: IDLE, note: '' });
export const subscribe = store.subscribe;
export const getState = store.get;

export function isRunning(state: ChartsDemoState = store.get()): boolean {
  return isLive(state.app);
}

let app: ChildProcess | null = null;
// Bumped on every start and stop, so a callback from a child we have already
// replaced cannot write over the state of the one now running.
let generation = 0;

export function start(): void {
  if (isRunning()) return;
  const run = ++generation;
  store.set({ note: '', app: { status: 'starting', detail: EXAMPLE } });
  app = spawnDetached({
    command: RUN.command,
    args: RUN.args,
    cwd: ROOT,
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
    app: { status: 'running', detail: `pid ${app.pid} — its own window` },
  });
}

export function stop(): void {
  generation++;
  killGroup(app);
  app = null;
  store.set({ app: IDLE, note: '' });
}
