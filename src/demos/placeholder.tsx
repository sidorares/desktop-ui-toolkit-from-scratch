// What a ```demo fence renders while its demo is still an outline: a box of
// the height the finished demo will take, named, so the slide it sits on can
// be timed and rehearsed before it exists.
import type { ReactElement } from 'react';

import type { DemoProps } from './index.js';

export function Placeholder({ options }: DemoProps): ReactElement {
  const height = Number(options.height ?? 240);
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
        {options.name ? `demo: ${options.name}` : 'demo: (unnamed)'}
      </text>
      {options.note ? (
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          {options.note}
        </text>
      ) : null}
    </box>
  );
}
