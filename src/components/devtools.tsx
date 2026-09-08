// The DevTools demo: one button, two processes.
//
// The button exists because the demo is two commands in a fixed order with a
// wait in the middle (see `src/devtools.ts`), and a presenter typing that
// into a terminal on stage is thirty seconds of nothing happening. What the
// slide shows while it works is both processes and what each is doing, so a
// failure is legible from the back of the room rather than being a button
// that did not appear to do anything.
import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import { Button } from 'react-x11';

import {
  COMMANDS,
  EXAMPLE,
  getState,
  isRunning,
  start,
  stop,
  subscribe,
} from '../devtools.js';
import { Command, Note, Panel, ProcessRow } from './launcher.js';

export interface DevToolsProps {
  height?: number;
}

export function DevTools({ height }: DevToolsProps): ReactElement {
  // The store is module-scope, so the processes survive `↓`: the deck keys
  // `<Prose>` on `slide:step` and remounts everything on every keypress.
  const state = useSyncExternalStore(subscribe, getState);
  const running = isRunning(state);
  return (
    <Panel height={height}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Button primary onPress={running ? stop : () => void start()}>
          {running ? 'Stop both' : 'Start DevTools, then the app'}
        </Button>
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          the UI first — the app connects to it, so it has to be listening
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
