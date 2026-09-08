// `<Ecosystem>` — the packages, and which two of them had to be built.
//
// The reveal is the behaviour worth watching here: on step 1 everything
// written in JavaScript steps back and the two compiled nodes stay lit. That
// is a colour change across thirteen nodes and it is exactly the sort of
// thing that breaks quietly, so both halves are stories rather than one
// playground with a slider.
//
// `size` is deliberately generous. The graph is fitted to its pane, and a
// story viewport smaller than the deck's would frame it at a zoom the slide
// never uses — `<Flow>` stops mounting node bodies below 0.6, so a cramped
// story is a story that lies about legibility.
import { story } from '@react-x11/workbench/story';

import { Ecosystem } from '../src/components/ecosystem.js';
import { StepProvider } from '../src/steps.js';

export default { title: 'Ecosystem', size: { width: 1100, height: 720 } };

const atStep = (step: number, node: React.ReactNode) => (
  <StepProvider value={{ step, steps: 2 }}>{node}</StepProvider>
);

/** The whole graph, before the speaker presses down. */
export const theGraph = () => atStep(0, <Ecosystem revealAt={1} />);

/** And after: only `yoga-layout` and `@windowkit/appkit` are still lit. */
export const compiledOnly = () => atStep(1, <Ecosystem revealAt={1} />);

/** `revealAt={0}` opts out of the step machinery — every node at full
 *  strength, which is how to read the labels. */
export const noReveal = () => <Ecosystem revealAt={0} />;

export const playground = story(
  (args: { step: number }) => atStep(args.step, <Ecosystem revealAt={1} />),
  {
    args: { step: 0 },
    controls: { step: { type: 'number', min: 0, max: 1, step: 1 } },
  },
);
