// What a slide shows where a demo will go.
//
// A talk is rehearsed before it is finished, and a slide whose demo does not
// exist yet still has to be the right height or the rehearsal teaches the
// wrong timing. So this is a box of the size the real thing will take, named,
// and obviously unfinished.
import type { ReactElement } from 'react';

export interface PlaceholderProps {
  /** What is going to live here. */
  name?: string;
  /** A line for the author, on screen, deliberately. */
  note?: string;
  height?: number;
}

export function Placeholder({
  name = '',
  note = '',
  height = 240,
}: PlaceholderProps): ReactElement {
  return (
    <box
      style={{
        height,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '$border',
        borderRadius: 8,
        backgroundColor: '$surface',
      }}
    >
      <text style={{ fontSize: 15, color: '$textMuted' }}>
        {name ? `demo: ${name}` : 'demo: (unnamed)'}
      </text>
      {note ? (
        <text style={{ fontSize: 12, color: '$textMuted' }}>{note}</text>
      ) : null}
    </box>
  );
}
