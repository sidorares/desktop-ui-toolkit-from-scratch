// A series, a sequence and a graph — three ways of drawing data, one per
// step, each with the whole slide to itself.
//
// They were one row of three columns, and three columns is the wrong size for
// any of them: a chart that has to prove decimation wants the width, a
// timeline is a column and wants two of them, and the architecture graph is
// unreadable in a third of a screen. `panel` is which one a step is showing;
// `'all'` is the row they came from, kept because the workbench is where the
// three get compared and a slide is not.
//
// All three are `@react-x11/components`, and the first and third exist for
// the same reason: pan, zoom and a thousand marks are not something you
// compose out of boxes in a renderer with no CSS transform, so each is one
// element drawing itself. The timeline is the exception, and deliberately
// shown between them: it registers no element at all — it is `<box>` and
// `<text>`, and the line down its gutter is one absolutely-positioned pixel.
// This deck rolled its own before the package had one
// (`src/components/timeline.tsx`, still what slide 27 uses); this is the one
// that shipped.
import type { ReactElement } from 'react';

import {
  AreaChart,
  AreaSeries,
  CartesianGrid,
  ChartContainer,
  LineSeries,
  XAxis,
  YAxis,
} from '@react-x11/components/charts';
import type { ChartConfig } from '@react-x11/components/charts';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@react-x11/components/timeline';

import { Architecture } from './architecture.js';
import { Caption, fill } from './panel.js';
import { HISTORY, TIMELINE } from '../data.js';
import type { Milestone } from '../data.js';

const CONFIG = {
  commits: { label: 'commits', color: '$accent' },
} satisfies ChartConfig;

/** The same numbers as slide 28's bar chart — one dataset, another chart. */
const SERIES = HISTORY.map((d) => ({ ...d }));

const CHARTS_CAPTION = 'charts — one element, a million points is a normal input';
const TIMELINE_CAPTION = 'timeline — box, text, and one absolute pixel';

/** The fifteen years, and then the seven weeks. Two runs, two columns. */
const FOUNDED = TIMELINE.filter((m) => !m.burst);
const BURST = TIMELINE.filter((m) => m.burst);

export type Panel = 'charts' | 'timeline' | 'flow' | 'all';

function Series({ height }: { height?: number }): ReactElement {
  return (
    <ChartContainer config={CONFIG} style={fill(height)}>
      <AreaChart data={SERIES}>
        <CartesianGrid />
        <XAxis dataKey="year" />
        <YAxis width={44} />
        <AreaSeries dataKey="commits" curve="monotone" fillOpacity={0.25} />
        <LineSeries dataKey="commits" curve="monotone" dot={3} />
      </AreaChart>
    </ChartContainer>
  );
}

function Run({
  rows,
  from,
  size = 'md',
  height,
}: {
  rows: readonly Milestone[];
  /** Where the numbering starts, so two columns read as one sequence. */
  from: number;
  /** The package's own metric: `'md'` with a slide to itself, `'sm'` in a
   *  column shared with two other demos. */
  size?: 'sm' | 'md' | 'lg';
  height?: number;
}): ReactElement {
  return (
    <Timeline size={size} variant="subtle" style={fill(height)}>
      {rows.map((m, i) => (
        <TimelineItem key={m.date}>
          <TimelineConnector>
            <TimelineSeparator />
            <TimelineIndicator variant={m.born ? 'solid' : 'outline'}>
              {`${from + i}`}
            </TimelineIndicator>
          </TimelineConnector>
          <TimelineContent>
            <TimelineTitle>{m.what}</TimelineTitle>
            <TimelineDescription>{m.date}</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

function Sequence({ height }: { height?: number }): ReactElement {
  return (
    <box style={{ flexDirection: 'row', gap: 60, ...fill(height) }}>
      <box style={{ width: 320, gap: 10 }}>
        <text style={{ fontSize: 13, color: '$textMuted' }}>
          2011 – 2015 · three first commits
        </text>
        <Run rows={FOUNDED} from={1} />
      </box>
      <box style={{ width: 340, gap: 10 }}>
        <text style={{ fontSize: 13, color: '$accent' }}>
          2026 · seven weeks
        </text>
        <Run rows={BURST} from={FOUNDED.length + 1} />
      </box>
    </box>
  );
}

export interface DataVizProps {
  /** Pinned, for a story. A slide leaves it out and the panel takes the
   *  space the slide has — which is the whole window, minus its chrome,
   *  at whatever size the desktop has made it. */
  height?: number;
  /** Which of the three a step is showing. `'all'` is the three-up row. */
  panel?: Panel;
}

export function DataViz({
  height,
  panel = 'all',
}: DataVizProps): ReactElement {
  if (panel === 'charts') {
    return (
      <box style={{ gap: 8, ...fill(height) }}>
        <Caption>{CHARTS_CAPTION}</Caption>
        <Series />
      </box>
    );
  }

  if (panel === 'timeline') {
    return (
      <box style={{ gap: 8, ...fill(height) }}>
        <Caption>{TIMELINE_CAPTION}</Caption>
        <Sequence />
      </box>
    );
  }

  if (panel === 'flow') return <Architecture height={height} />;

  // `'all'`: the three side by side, at the size a column can carry.
  return (
    <box style={{ flexDirection: 'row', gap: 20, ...fill(height) }}>
      <box style={{ flexGrow: 1.1, flexBasis: 0, minHeight: 0, gap: 6 }}>
        <Caption size={13}>{CHARTS_CAPTION}</Caption>
        <Series />
      </box>
      <box style={{ width: 250, minHeight: 0, gap: 6 }}>
        <Caption size={13}>{TIMELINE_CAPTION}</Caption>
        <Run rows={BURST} from={FOUNDED.length + 1} size="sm" />
      </box>
      <box style={{ flexGrow: 1.2, flexBasis: 0, minHeight: 0 }}>
        <Architecture />
      </box>
    </box>
  );
}
