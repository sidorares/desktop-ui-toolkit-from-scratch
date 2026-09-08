// `<Documents>` — markdown, maths and HTML behind one strip of tabs.
//
// A tab is a story: the panel a slide opens on is a prop, so each engine gets
// looked at on its own here rather than by clicking through the deck. The
// point of doing that in a workshop rather than on the slide is the third
// one — the HTML panel mounts real widgets for its form controls, and a
// `<select>` that drops its menu in the wrong place is the sort of thing you
// find by opening it twenty times, not once, on stage.
import { story } from '@react-x11/workbench/story';

import { Documents } from '../src/components/documents.js';

export default { title: 'Documents', size: { width: 1120, height: 560 } };

/** `<Markdown>` inside the `<Markdown>` that drew the slide. */
export const markdown = () => <Documents height={480} defaultValue="markdown" />;

/** KaTeX's layout, not a picture of it. */
export const maths = () => <Documents height={480} defaultValue="maths" />;

/** The panel where the `<select>` is a real menu. */
export const html = () => <Documents height={480} defaultValue="html" />;

export const playground = story(
  (args: { defaultValue: string; height: number }) => <Documents {...args} />,
  {
    args: { defaultValue: 'markdown', height: 480 },
    controls: {
      defaultValue: ['markdown', 'maths', 'html'],
      height: { type: 'number', min: 260, max: 620, step: 20 },
    },
  },
);
