// `<Wire>` — a node-x11 example, and the button that runs it through x11vis.
//
// One story per example, which is also the cheapest check that every file in
// `examples/x11` still reads correctly: the listing is `<SourceCode>` reading
// the file off disk, so a rename or a stray edit shows up here rather than
// mid-talk.
//
// The stories pin a height. On a slide the listing fills what is left, which
// is the right answer there and no answer at all in a workbench viewport.
import { story } from '@react-x11/workbench/story';

import { Wire } from '../src/components/wire.js';

export default { title: 'Wire', size: { width: 1000, height: 560 } };

/** Slide "The smallest thing you can see". */
export const window = () => <Wire example="window" height={460} />;

/** Slide "One bit more, and it answers back". */
export const mousedown = () => <Wire example="mousedown" height={460} />;

/** Slide "Three shapes, and every byte accounted for". */
export const title = () => <Wire example="title" height={460} />;

/** A file that is not there: the source area says so instead of throwing. */
export const missing = () => <Wire example="not-an-example" height={460} />;

export const playground = story(
  (args: { example: string; height: number }) => <Wire {...args} />,
  {
    args: { example: 'window', height: 460 },
    controls: {
      example: 'text',
      height: { type: 'number', min: 200, max: 700, step: 20 },
    },
  },
);
