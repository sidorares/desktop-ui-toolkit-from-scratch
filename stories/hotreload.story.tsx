// `<HotReload>` — start the example under the refresh loader, then edit it.
//
// The one component here that writes to the repository: "Edit the file"
// rewrites two marked lines in `examples/hot-demo-app.jsx`. The variants
// cycle and the third press restores the committed text, so a story left
// halfway through is a working tree with one edited example in it — check
// `git diff` if you have been poking at this.
import { story } from '@react-x11/workbench/story';

import { HotReload } from '../src/components/hotreload.js';

export default { title: 'HotReload', size: { width: 900, height: 260 } };

/** Idle: the edit button is disabled until something is running. */
export const idle = () => <HotReload />;

export const playground = story(
  (args: { height: number }) => <HotReload {...args} />,
  {
    args: { height: 160 },
    controls: { height: { type: 'number', min: 120, max: 320, step: 20 } },
  },
);
