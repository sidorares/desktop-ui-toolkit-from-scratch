// One number, said loudly.
//
// The stats slide is four of these and the timeline slide is none, which is
// the whole reason it is a component rather than a paragraph: a number the
// room is supposed to react to should not be the same size as the sentence
// explaining it.
import type { ReactElement } from 'react';

export interface MetricProps {
  /** The number, or anything that reads as one. */
  value?: string | number;
  /** What it counts. Small, muted, beside the value. */
  label?: string;
  /** Bigger, for the one number a slide is actually about. */
  emphasis?: boolean;
}

export function Metric({
  value = '',
  label = '',
  emphasis = false,
}: MetricProps): ReactElement {
  return (
    <box
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 10,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 14,
        paddingRight: 14,
        borderRadius: 8,
        backgroundColor: '$surface',
        borderWidth: 1,
        borderColor: '$border',
      }}
    >
      <text
        style={{
          fontSize: emphasis ? 44 : 30,
          fontWeight: 700,
          color: '$accent',
        }}
      >
        {String(value)}
      </text>
      <text style={{ fontSize: emphasis ? 15 : 13, color: '$textMuted' }}>
        {label}
      </text>
    </box>
  );
}
