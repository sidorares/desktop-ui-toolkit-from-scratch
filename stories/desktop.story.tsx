// `<Desktop>` — one menu array, mounted into every system surface this
// machine has.
//
// The reason this has a story is that **the demo is not in the window.** On
// the slide the interesting half is the macOS menu bar, a status item and the
// Dock icon, none of which a slide screenshot contains and none of which the
// deck can assert about. The workbench is where you can watch them appear and
// disappear as the story mounts and unmounts — which is the argument the
// component is making, performed rather than described.
//
// **The menu items do nothing here, and that is correct.** `useNav()` is a
// context with an inert default (`src/nav.tsx`), so outside a `<Deck>` there
// is no talk to advance. Driving the deck from the menu is what
// `npm run check:menu` covers; this is for looking at.
import { story } from '@react-x11/workbench/story';

import { Desktop } from '../src/components/desktop.js';

export default { title: 'Desktop', size: { width: 1180, height: 460 } };

/** What the slide shows, at the height a slide gives it. */
export const asOnTheSlide = () => <Desktop />;

/**
 * Pinned, which is the only thing `height` is for: on the slide this panel
 * deliberately does **not** grow — six status rows stretched down a slide
 * read as a table with the middle missing — so a story is where you find out
 * what it does when something else decides its size.
 */
export const pinned = story(
  (args: { height: number }) => <Desktop {...args} />,
  {
    args: { height: 420 },
    controls: { height: { type: 'number', min: 280, max: 620, step: 20 } },
  },
);
