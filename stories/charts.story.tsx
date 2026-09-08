// `<Charts>` — react-x11's own commit history, drawn by react-x11.
//
// The reveal is the point and it is worth seeing side by side: before the
// slide's second step the last year is not hidden, it is *not in the data*,
// so the axis is scaled to eleven quiet years and 371 arrives as a rescale.
// A story per step is the cheapest way to check that still works.
import { story } from '@react-x11/workbench/story';

import { Charts } from '../src/components/charts.js';
import { StepProvider } from '../src/steps.js';

export default { title: 'Charts', size: { width: 860, height: 380 } };

const atStep = (step: number, node: React.ReactNode) => (
  <StepProvider value={{ step, steps: 2 }}>{node}</StepProvider>
);

/** Eleven years, and an axis that tops out at 20. */
export const quietYears = () => atStep(0, <Charts revealAt={1} />);

/** The same component, one step later. */
export const theSpike = () => atStep(1, <Charts revealAt={1} />);

/** What a slide that does not want the reveal asks for. */
export const wholeSeries = () => <Charts revealAt={0} />;

export const playground = story(
  (args: { step: number; height: number }) =>
    atStep(args.step, <Charts revealAt={1} height={args.height} />),
  {
    args: { step: 0, height: 300 },
    controls: {
      step: { type: 'number', min: 0, max: 1, step: 1 },
      height: { type: 'number', min: 160, max: 520, step: 20 },
    },
  },
);
