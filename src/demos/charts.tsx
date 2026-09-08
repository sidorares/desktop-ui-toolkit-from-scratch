// The commit histogram behind the "15 years and 47 days" slide, drawn by
// `@react-x11/components/charts` — so the chart making the argument is drawn
// by the toolkit the argument is about.
//
// Two steps: the first shows the eleven years react-x11 spent at 32 commits,
// the second adds 2026 and rescales the axis under it. Revealing the spike
// rather than opening on it is the whole joke, so the step split is the
// content, not decoration.
import type { ReactElement } from 'react';

import {
  BarChart,
  BarSeries,
  CartesianGrid,
  ChartContainer,
  XAxis,
  YAxis,
} from '@react-x11/components/charts';
import type { ChartConfig } from '@react-x11/components/charts';

import { at, useStep } from '../steps.js';
import type { DemoProps } from './index.js';

/** `git log --format=%ad --date=format:%Y | sort | uniq -c`, per repo. */
const HISTORY = [
  { year: '2015', commits: 8 },
  { year: '2016', commits: 2 },
  { year: '2017', commits: 20 },
  { year: '2018', commits: 1 },
  { year: '2022', commits: 1 },
  { year: '2026', commits: 371 },
];

const CONFIG = {
  commits: { label: 'commits to react-x11', color: '$accent' },
} satisfies ChartConfig;

export function Charts({ options }: DemoProps): ReactElement {
  const { step } = useStep();
  // Before the reveal the spike is not merely hidden — it is not in the
  // data, so the y-axis is scaled to the quiet years and 371 arrives as a
  // rescale rather than as a bar that was always there.
  const data = at(step, HISTORY.slice(0, -1), HISTORY).map((d) => ({ ...d }));
  return (
    <ChartContainer
      config={CONFIG}
      style={{ height: Number(options.height ?? 300) }}
    >
      <BarChart data={data}>
        <CartesianGrid />
        <XAxis dataKey="year" />
        <YAxis width={44} />
        <BarSeries dataKey="commits" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}
