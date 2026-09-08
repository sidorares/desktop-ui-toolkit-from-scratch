// One button, and the command it runs.
//
// Same shape as the other launchers on this deck: the command is on the slide
// because what the room should leave with is the line they would type, and a
// button whose label agrees with a command nobody can see is a magic trick
// rather than a demo.
import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import { Button } from 'react-x11';

import {
  COMMAND,
  EXAMPLE,
  getState,
  isRunning,
  start,
  stop,
  subscribe,
} from '../chartsdemo.js';
import { Command, Note, Panel, ProcessRow } from './launcher.js';

export interface ChartsDemoProps {
  height?: number;
}

export function ChartsDemo({ height }: ChartsDemoProps): ReactElement {
  const state = useSyncExternalStore(subscribe, getState);
  const running = isRunning(state);
  return (
    <Panel height={height}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Button primary onPress={running ? stop : start}>
          {running ? 'Stop' : 'A million points'}
        </Button>
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          {running
            ? 'zoom the million and watch the wire bytes stay put'
            : 'opens its own window — streaming, a million points, and a HUD'}
        </text>
      </box>
      <ProcessRow label={EXAMPLE} state={state.app} />
      <Command>{COMMAND}</Command>
      <Note>{state.note}</Note>
    </Panel>
  );
}
