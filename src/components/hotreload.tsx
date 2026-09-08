// The hot-reload demo: start the example under the refresh loader, then edit
// the file it is running from.
//
// Two buttons, and the second one is the demo. Editing in an editor on a
// second screen is the better version of this — it is what the loop actually
// looks like — but it needs a second screen, and this slide has to work on a
// projector with one. So the slide makes the edit: it rewrites two marked
// lines in the example and lets the file watcher do the rest, which is the
// same event a save is.
import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import { Button } from 'react-x11';

import {
  applyEdit,
  COMMAND,
  EDITED,
  EDITS,
  EXAMPLE,
  getState,
  isRunning,
  start,
  stop,
  subscribe,
} from '../hotreload.js';
import { Command, Note, Panel, ProcessRow } from './launcher.js';

export interface HotReloadProps {
  height?: number;
}

export function HotReload({ height }: HotReloadProps): ReactElement {
  const state = useSyncExternalStore(subscribe, getState);
  const running = isRunning(state);
  return (
    <Panel height={height}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Button primary onPress={running ? stop : start}>
          {running ? 'Stop' : 'Start it'}
        </Button>
        <Button
          variant="outline"
          disabled={!running}
          onPress={() => void applyEdit()}
        >
          Edit the file
        </Button>
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          {running
            ? `${EDITED} · variant ${state.edit + 1} of ${EDITS.length} — nothing on screen moves`
            : `or open ${EDITED} in your editor and save it`}
        </text>
      </box>
      <ProcessRow label={EXAMPLE} state={state.app} />
      <Command>{COMMAND}</Command>
      <Note>{state.note}</Note>
    </Panel>
  );
}
