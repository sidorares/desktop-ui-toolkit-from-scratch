// `<Widgets>` — core's controls, a variable font and a vector, on one wire.
//
// This is the component the workbench earns its keep on. It reads a font off
// the machine it is running on, so what it can demonstrate is not the same on
// every laptop: the number of sliders is the number of axes the file has, and
// the `noFont` story below is the shape a machine with no variable font gets.
// Looking at that path in a workshop is the only way to see it without
// uninstalling a system font.
//
// The specimen is a `<textinput>`, so the story is also where the focus
// behaviour gets poked at away from a deck that reads every key.
import { story } from '@react-x11/workbench/story';

import { Widgets } from '../src/components/widgets.js';

export default { title: 'Widgets', size: { width: 1120, height: 560 } };

/** What the slide opens on. */
export const asOnTheSlide = () => <Widgets height={480} />;

/** A longer specimen: the field wraps nothing, the type just gets wider. */
export const longSpecimen = () => (
  <Widgets height={480} specimen="the quick brown fox" />
);

/** Short enough to watch one glyph change as the axes move. */
export const oneWord = () => <Widgets height={480} specimen="R" />;

export const playground = story(
  (args: { specimen: string; height: number }) => <Widgets {...args} />,
  {
    args: { specimen: 'Handgloves', height: 480 },
    controls: {
      specimen: 'text',
      height: { type: 'number', min: 260, max: 620, step: 20 },
    },
  },
);
