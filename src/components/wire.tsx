// A node-x11 example, and a button that runs it through the visualizer.
//
// The listing is `<SourceCode>`, so the code on the slide is the file that
// gets run — a slide showing one program and running another is the worst
// thing a live demo can do, and it is what happens to every deck that pastes
// a snippet. `from` skips each example's header comment, which is the slide's
// prose in the file: on screen it would be the same words twice.
//
// The example is small on purpose. What the visualizer has to show is a
// conversation short enough to read all of — a handshake and four requests —
// so that the next slide's version of it, which adds one bit to a value
// list, is visibly the same conversation plus one thing.
import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import { Button } from 'react-x11';

import {
  DISPLAY,
  examplePath,
  getState,
  isRunning,
  run,
  stop,
  subscribe,
} from '../x11vis.js';
import { Command, Note, Panel, ProcessRow } from './launcher.js';
import { fill } from './panel.js';
import { SourceCode } from './source-code.js';

export interface WireProps {
  /** A file in `examples/x11`, without its extension. Optional so the map
   *  in `prose.tsx` stays a map of components a slide may name with no
   *  props at all — every slide passes one. */
  example?: string;
  /** Pinned, for a story. Left out, the listing fills the slide. */
  height?: number;
}

export function Wire({ example = 'window', height }: WireProps): ReactElement {
  const state = useSyncExternalStore(subscribe, getState);
  const running = isRunning(state);
  const mine = state.example === example;
  return (
    <box style={{ gap: 12, ...fill(height) }}>
      <SourceCode file={examplePath(example)} from="import x11" />
      <Panel>
        <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Button primary onPress={() => void run(example)}>
            {running && mine ? 'Run it again' : 'Run it'}
          </Button>
          <Button variant="outline" disabled={!running} onPress={stop}>
            Stop
          </Button>
          <Command>{`DISPLAY=${DISPLAY} node ${examplePath(example)}`}</Command>
        </box>
        <ProcessRow label="x11vis" state={state.vis} />
        <ProcessRow
          label={examplePath(state.example || example)}
          state={state.client}
        />
        <Note>{state.note}</Note>
      </Panel>
    </box>
  );
}
