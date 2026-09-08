// The dates, as something you can see the shape of.
//
// As a bullet list this slide was ten lines that all looked alike, which is
// the wrong picture: the point is that three of them are spread over fifteen
// years and seven are inside seven weeks. Drawn, the gap is the argument and
// the speaker does not have to make it twice.
//
// `since` reveals the second half on a later step, so the fifteen years can
// be read before the seven weeks arrive.
import type { ReactElement } from 'react';

import { TIMELINE } from '../data.js';
import { useStep } from '../steps.js';

export interface TimelineProps {
  /** The step that reveals the burst. 0 shows everything at once. */
  revealAt?: number;
  fontSize?: number;
}

export function Timeline({
  revealAt = 1,
  fontSize = 18,
}: TimelineProps): ReactElement {
  const { step } = useStep();
  const showBurst = revealAt === 0 || step >= revealAt;
  const rows = TIMELINE.filter((m) => showBurst || !m.burst);
  return (
    <box style={{ gap: 2 }}>
      {rows.map((m) => (
        <box
          key={`${m.date} ${m.what}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingTop: 5,
            paddingBottom: 5,
          }}
        >
          <box
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: m.burst ? '$accent' : '$textMuted',
            }}
          />
          <text
            style={{
              fontSize,
              width: 140,
              color: m.burst ? '$text' : '$textMuted',
              fontWeight: m.burst ? 700 : 400,
            }}
          >
            {m.date}
          </text>
          <text
            style={{
              fontSize,
              color: m.burst ? '$text' : '$textMuted',
            }}
          >
            {m.what}
          </text>
          {m.born ? (
            <text style={{ fontSize: fontSize - 6, color: '$textMuted' }}>
              first commit
            </text>
          ) : null}
        </box>
      ))}
      {showBurst ? null : (
        <text
          style={{ fontSize: fontSize - 3, color: '$textMuted', marginTop: 10 }}
        >
          …and then, mostly, nothing. For eleven years.
        </text>
      )}
    </box>
  );
}
