// The four totals, in a row.
//
// Four `<Metric/>` tags on four lines would be four *blocks*, and blocks
// stack — which is both too tall for the slide and the wrong reading, since
// the four numbers are one fact rather than four. A `<Row>` wrapper would be
// the general answer, and cannot be written today: `<Markdown>` hands a
// component its children already wrapped in a column box, so a component
// cannot lay its own children out sideways. Worth an upstream issue; for one
// slide, a component that owns all four is simpler and reads better anyway.
import type { ReactElement } from 'react';

import { STATS } from '../data.js';
import { Metric } from './metric.js';

export interface StatsProps {
  /** Which of the four to show, in order. Default: all. */
  only?: readonly string[];
}

const ROWS = [
  { key: 'commits', value: STATS.commits, label: 'commits', emphasis: true },
  { key: 'prs', value: STATS.prs, label: 'merged pull requests' },
  { key: 'repos', value: STATS.newRepos, label: 'new repositories' },
  { key: 'revived', value: STATS.revivedRepos, label: 'revived' },
] as const;

export function Stats({ only }: StatsProps): ReactElement {
  const rows = only ? ROWS.filter((r) => only.includes(r.key)) : ROWS;
  return (
    <box style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      {rows.map((r) => (
        <Metric
          key={r.key}
          value={r.value}
          label={r.label}
          emphasis={'emphasis' in r ? r.emphasis : false}
        />
      ))}
    </box>
  );
}
