// `<ChartsDemo>` — the button that opens the charts example in its own window.
//
// The launcher's states live in a module-scope store rather than in component
// state, because the child has to outlive a step change: `<Prose>` is keyed on
// `slide:step`, and a demo owning its process in `useState` would kill and
// respawn it on every `↓`. That is also why there is nothing to pin here — the
// story shows the idle panel, and pressing the button really does start the
// example. Press Stop before leaving the story.
import { story } from '@react-x11/workbench/story';

import { ChartsDemo } from '../src/components/chartsdemo.js';

export default { title: 'ChartsDemo', size: { width: 900, height: 260 } };

/** What the slide shows before anybody presses anything. */
export const idle = () => <ChartsDemo />;

/** Pinned, which is what a fixed story viewport wants. */
export const pinned = story(
  (args: { height: number }) => <ChartsDemo height={args.height} />,
  {
    args: { height: 140 },
    controls: { height: { type: 'number', min: 100, max: 400, step: 10 } },
  },
);
