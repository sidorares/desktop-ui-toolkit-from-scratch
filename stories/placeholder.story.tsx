// `<Placeholder>` — what a slide shows where a demo will go.
//
// The whole job is being the right *size*, so a slide can be laid out and
// rehearsed before its demo exists. Which makes the workbench the right place
// to look at it: the sizes are the variants.
import { story } from '@react-x11/workbench/story';

import { Placeholder } from '../src/components/placeholder.js';

export default { title: 'Placeholder', size: { width: 720, height: 460 } };

export const named = () => <Placeholder name="flow" height={240} />;

/** The note is for the author, on screen, deliberately. */
export const withNote = () => (
  <Placeholder
    name="three"
    height={240}
    note="glarea over indirect GLX — one CallList per frame"
  />
);

/** No name is still a box of the right height, which is the point. */
export const unnamed = () => <Placeholder height={160} />;

export const playground = story(
  (args: { name: string; note: string; height: number }) => (
    <Placeholder {...args} />
  ),
  {
    args: { name: 'flow', note: 'pan and zoom', height: 240 },
    controls: {
      name: 'text',
      note: 'text',
      height: { type: 'number', min: 80, max: 420, step: 20 },
    },
  },
);
