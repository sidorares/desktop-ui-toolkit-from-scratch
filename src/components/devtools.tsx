// The DevTools demo: one button, two processes — and a second button for
// when half of it dies.
//
// The first button exists because the demo is two commands in a fixed order
// with a wait in the middle (see `src/devtools.ts`), and a presenter typing
// that into a terminal on stage is thirty seconds of nothing happening. What
// the slide shows while it works is both processes and what each is doing, so
// a failure is legible from the back of the room rather than being a button
// that did not appear to do anything.
//
// The second button is the recovery. Selecting a component in the tree can
// take the standalone's renderer down mid-demo, and the reflex — stop, start
// again — throws away the app the audience was looking at when restarting
// the *frontend* alone is enough. Better a labelled button on the slide than
// a decision made live.
//
// The panel is split from the store on purpose: `<DevToolsPanel>` is a view
// of a `DevToolsState`, so the workbench can render the states this slide
// only reaches by failing without any process having to fail to get there.
import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import { Button } from 'react-x11';

import {
  COMMANDS,
  EXAMPLE,
  getState,
  isRunning,
  restartUi,
  start,
  stop,
  subscribe,
} from '../devtools.js';
import type { DevToolsState } from '../devtools.js';
import { Command, Note, Panel, ProcessRow } from './launcher.js';

export interface DevToolsProps {
  height?: number;
}

export interface DevToolsPanelProps extends DevToolsProps {
  state: DevToolsState;
  onStart: () => void;
  onStop: () => void;
  onRestartUi: () => void;
}

export function DevToolsPanel({
  height,
  state,
  onStart,
  onStop,
  onRestartUi,
}: DevToolsPanelProps): ReactElement {
  const running = isRunning(state);
  return (
    <Panel height={height}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Button primary onPress={running ? onStop : onStart}>
          {running ? 'Stop both' : 'Start DevTools, then the app'}
        </Button>
        {running ? (
          <Button size="small" onPress={onRestartUi}>
            Restart DevTools
          </Button>
        ) : null}
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          {running
            ? 'if the DevTools window dies, restart it — the app stays up and reconnects'
            : 'the UI first — the app connects to it, so it has to be listening'}
        </text>
      </box>
      <ProcessRow label="react-devtools" state={state.ui} />
      <ProcessRow label={EXAMPLE} state={state.app} />
      <box style={{ gap: 2 }}>
        {COMMANDS.map((command) => (
          <Command key={command}>{command}</Command>
        ))}
      </box>
      <Note>{state.note}</Note>
    </Panel>
  );
}

export function DevTools({ height }: DevToolsProps): ReactElement {
  // The store is module-scope, so the processes survive `↓`: the deck keys
  // `<Prose>` on `slide:step` and remounts everything on every keypress.
  const state = useSyncExternalStore(subscribe, getState);
  return (
    <DevToolsPanel
      height={height}
      state={state}
      onStart={() => void start()}
      onStop={stop}
      onRestartUi={() => void restartUi()}
    />
  );
}
