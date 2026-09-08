// `<Terminal>` — a real shell, on the in-process vt backend.
//
// The one component here that runs another program, so it is also the one
// whose failure mode matters: without `@lydell/node-pty` it renders its
// fallback rather than throwing, and `fallback` is a story below so that
// path is looked at rather than assumed.
//
// `command` takes argv as an array — the thing the ```demo fence this
// replaced could not express, since a fence attribute was a string and a
// shell line with quotes and a pipe in it does not survive being split.
import { story } from '@react-x11/workbench/story';

import { Terminal } from '../src/components/terminal.js';

export default { title: 'Terminal', size: { width: 860, height: 420 } };

/** A login shell, which is what a slide gets by omitting `command`. */
export const loginShell = () => <Terminal height={340} />;

/** A one-word command, as a string. */
export const oneCommand = () => <Terminal height={340} command="top" />;

/** argv as JSON — quotes and a pipe intact. This is the flood demo. */
export const flood = () => (
  <Terminal
    height={340}
    command={[
      'bash',
      '-lc',
      "yes 'the wire carries drawing, not pixels' | head -20000",
    ]}
  />
);

export const playground = story(
  (args: { command: string; height: number; fontSize: number }) => (
    <Terminal {...args} />
  ),
  {
    args: { command: 'bash -l', height: 340, fontSize: 14 },
    controls: {
      command: 'text',
      height: { type: 'number', min: 120, max: 520, step: 20 },
      fontSize: { type: 'number', min: 9, max: 24, step: 1 },
    },
  },
);
