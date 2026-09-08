// `<Timeline>` — the dates, as a shape rather than a list.
//
// It reads `useStep()`, so the interesting thing to see is both halves of
// the reveal. Outside the deck there is no `StepProvider`, and the context's
// default (`step: 0`) is the pre-reveal state — which is why `atStep` wraps
// one, and why the first story below is what a slide shows before the
// speaker presses down.
import { story } from '@react-x11/workbench/story';

import { Timeline } from '../src/components/timeline.js';
import { StepProvider } from '../src/steps.js';

export default { title: 'Timeline', size: { width: 720, height: 520 } };

/** A story at a given step, which is what the deck would be showing. */
const atStep = (step: number, node: React.ReactNode) => (
  <StepProvider value={{ step, steps: 2 }}>{node}</StepProvider>
);

/** Fifteen years, before the seven weeks arrive. */
export const beforeTheReveal = () => atStep(0, <Timeline revealAt={1} />);

/** And after: the dot colour is the whole slide. */
export const afterTheReveal = () => atStep(1, <Timeline revealAt={1} />);

/** `revealAt={0}` opts out of the step machinery entirely. */
export const wholeThing = () => <Timeline revealAt={0} />;

export const playground = story(
  (args: { step: number; fontSize: number }) =>
    atStep(args.step, <Timeline revealAt={1} fontSize={args.fontSize} />),
  {
    args: { step: 0, fontSize: 18 },
    controls: {
      step: { type: 'number', min: 0, max: 1, step: 1 },
      fontSize: { type: 'number', min: 11, max: 30, step: 1 },
    },
  },
);
