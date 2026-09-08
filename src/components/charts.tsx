// The commit histogram behind the "15 years and 48 days" slide, drawn by
// `@react-x11/components/charts` — so the chart making the argument is drawn
// by the toolkit the argument is about.
//
// It reads `useStep()`, which is what makes the reveal work from one
// component: before the slide's second step the spike is not merely hidden,
// it is not in the data, so the y-axis is scaled to eleven quiet years and
// 371 arrives as a rescale rather than as a bar that was always there.
// `revealAt={0}` opts out, which is what the workbench and any slide that
// wants the finished chart pass.
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

import { HISTORY } from '../data.js';
import { useStep } from '../steps.js';

const CONFIG = {
  commits: { label: 'commits to react-x11', color: '$accent' },
} satisfies ChartConfig;

export interface ChartsProps {
  height?: number;
  /** The step that adds the last year. 0 shows the whole series at once. */
  revealAt?: number;
}

export function Charts({
  height = 300,
  revealAt = 1,
}: ChartsProps): ReactElement {
  const { step } = useStep();
  const full = revealAt === 0 || step >= revealAt;
  const data = (full ? HISTORY : HISTORY.slice(0, -1)).map((d) => ({ ...d }));
  return (
    <ChartContainer config={CONFIG} style={{ height }}>
      <BarChart data={data}>
        <CartesianGrid />
        <XAxis dataKey="year" />
        <YAxis width={44} />
        <BarSeries dataKey="commits" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}
