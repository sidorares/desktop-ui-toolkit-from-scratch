// `<Architecture>` — react-x11's own pipeline, as a graph with three nodes
// that are forms.
//
// The workbench is the only place the interactive half can be checked
// properly, because what the controls do is change the *graph*: a backend
// swaps a branch in place, the paint switch re-labels and animates an edge,
// and the checkboxes build or remove the D-Bus wing. On a slide that is one
// pass at rehearsal speed; here it is a knob.
//
// The narrow story is the one worth keeping. `<Flow>` does not mount a node
// body below zoom 0.6 — a mounted React subtree per card is what an overview
// cannot afford — so a pane too small to fit this graph above that threshold
// is a graph whose three forms quietly become plain cards. That is correct
// behaviour and exactly the sort of thing to meet here rather than on stage.
import { story } from '@react-x11/workbench/story';

import { Architecture } from '../src/components/architecture.js';

export default { title: 'Architecture', size: { width: 1180, height: 560 } };

/** What the slide shows. */
export const asOnTheSlide = () => <Architecture height={480} />;

/** Fitted below zoom 0.6: the forms stop mounting, the cards remain. */
export const tooSmallForForms = () => <Architecture height={200} />;

export const playground = story(
  (args: { height: number }) => <Architecture {...args} />,
  {
    args: { height: 480 },
    controls: { height: { type: 'number', min: 160, max: 620, step: 20 } },
  },
);
