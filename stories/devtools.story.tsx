// `<DevTools>` — the launcher for the standalone UI and the app it inspects.
//
// The stories are the panel; pressing the button here starts the same two
// processes it starts on the slide, which is the point. What the workbench
// is for is the *other* states — the ones a slide only reaches by failing —
// so the last story drives the store directly and asks for a UI that is not
// there, which is what a talk on a machine without Electron looks like.
import { story } from '@react-x11/workbench/story';

import { DevTools } from '../src/components/devtools.js';

export default { title: 'DevTools', size: { width: 900, height: 320 } };

/** As a slide has it: idle, until somebody presses the button. */
export const idle = () => <DevTools />;

/** A panel with a fixed height, for a slide that wants the space reserved. */
export const fixedHeight = () => <DevTools height={220} />;

export const playground = story(
  (args: { height: number }) => <DevTools {...args} />,
  {
    args: { height: 200 },
    controls: { height: { type: 'number', min: 140, max: 400, step: 20 } },
  },
);
