// `<DevTools>` — the launcher for the standalone UI and the app it inspects.
//
// The first stories are the panel wired to the real store; pressing the
// button here starts the same two processes it starts on the slide, which is
// the point. What the workbench is for is the *other* states — the ones a
// slide only reaches by failing — so the rest render `<DevToolsPanel>`
// directly with a state handed to it, and no process has to fail to get
// there.
import { story } from '@react-x11/workbench/story';

import { DevTools, DevToolsPanel } from '../src/components/devtools.js';
import { backendRemedy, BACKEND_PACKAGES } from '../src/devtools-backend.js';
import { EXAMPLE, HOST, PORT } from '../src/devtools.js';
import type { DevToolsState } from '../src/devtools.js';

export default { title: 'DevTools', size: { width: 900, height: 320 } };

/** As a slide has it: idle, until somebody presses the button. */
export const idle = () => <DevTools />;

/** A panel with a fixed height, for a slide that wants the space reserved. */
export const fixedHeight = () => <DevTools height={220} />;

/** A state, and the three no-op handlers a state on its own needs. */
const shown = (state: DevToolsState) => (
  <DevToolsPanel
    state={state}
    onStart={() => {}}
    onStop={() => {}}
    onRestartUi={() => {}}
  />
);

/**
 * The install this repo used to ship: `react-devtools-core` and `ws` absent,
 * so react-x11's lazy import would fail and the demo would come up with no
 * bridge at all. The launcher preflights for it and refuses to start rather
 * than putting two healthy-looking windows on the projector.
 */
export const backendMissing = () =>
  shown({
    ui: { status: 'idle', detail: 'not started — nothing could talk to it' },
    app: { status: 'failed', detail: backendRemedy([...BACKEND_PACKAGES]) },
    note:
      'react-x11 imports these lazily, so the demo would have come up with no bridge at all.',
  });

/** Both halves up — which is also the only state with a Restart button, the
 *  recovery for a standalone whose renderer died on a tree selection. */
export const running = () =>
  shown({
    ui: { status: 'running', detail: `listening on ${HOST}:${PORT}` },
    app: { status: 'running', detail: 'pid 41234 — REACT_X11_DEVTOOLS=1' },
    note: '',
  });

/** The standalone gone, the app still up: what the crash looks like once the
 *  window has been closed, and what Restart is for. */
export const uiDied = () =>
  shown({
    ui: { status: 'exited', detail: 'stopped (SIGTRAP)' },
    app: { status: 'running', detail: 'pid 41234 — REACT_X11_DEVTOOLS=1' },
    note: `${EXAMPLE}: bridge on — talking to ${HOST}:${PORT}`,
  });

export const playground = story(
  (args: { height: number }) => <DevTools {...args} />,
  {
    args: { height: 200 },
    controls: { height: { type: 'number', min: 140, max: 400, step: 20 } },
  },
);
