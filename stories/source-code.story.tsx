// `<SourceCode>` — a file off disk, highlighted.
//
// Two things to look at, and neither is the highlighting. The **anchors**:
// `from`/`to` are text rather than line numbers, so the slice survives an
// edit above it — the story below asks for the same function two ways to
// make that visible. And the **failure**: a path that is not there renders
// as a comment rather than throwing, because a slide whose demo has been
// renamed should say so, not take the deck down mid-talk.
import { story } from '@react-x11/workbench/story';

import { SourceCode } from '../src/components/source-code.js';

export default { title: 'SourceCode', size: { width: 900, height: 520 } };

/** What the scene tab shows: the demo, from its animation loop down. */
export const theSceneDemo = () => (
  <SourceCode
    file="src/components/scene3d.tsx"
    from="function Rig({"
    height={440}
  />
);

/** A slice with both ends named. */
export const oneFunction = () => (
  <SourceCode
    file="src/components/source-code.tsx"
    from="function langOf"
    to="export interface"
    height={440}
  />
);

/** A whole file, header comment and all. */
export const wholeFile = () => (
  <SourceCode file="src/components/caption.tsx" height={440} />
);

/** A path that is not there. */
export const missing = () => (
  <SourceCode file="src/components/nope.tsx" height={140} />
);

export const playground = story(
  (args: { file: string; from: string; fontSize: number; height: number }) => (
    <SourceCode {...args} />
  ),
  {
    args: {
      file: 'src/components/scene3d.tsx',
      from: 'function Rig({',
      fontSize: 14,
      height: 440,
    },
    controls: {
      file: 'text',
      from: 'text',
      fontSize: { type: 'number', min: 9, max: 22, step: 1 },
      height: { type: 'number', min: 120, max: 520, step: 20 },
    },
  },
);
