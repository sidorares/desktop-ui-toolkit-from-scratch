// `bunx @react-x11/workbench dev` — the workshop for the deck's components.
//
// The slides name these through `<Markdown>`'s `components` map, which means
// a broken one shows up as a broken *slide*, mid-talk, with no way to poke
// at it. The workbench is where they get poked at instead: each on its own,
// every variant at once, props editable while it runs.
//
// The decorator is what makes that a fair preview. A story renders a
// component bare, and a react-x11 tree with no `<ThemeProvider>` above it
// follows the **desktop** — so on a Mac whose accent is orange, a button that
// is `#58a6ff` on the projector comes up orange here, and the menu a
// `<Select>` drops comes up in the library's own defaults rather than the
// deck's. Planting the deck's palette once, outside every story, is the
// difference between a workshop and a lookalike.
import { createElement } from 'react';
import { ThemeProvider } from 'react-x11';

import { DECK_THEME } from './src/theme.js';

export default {
  stories: ['stories/**/*.story.tsx'],
  decorators: [
    (_story: unknown, node: unknown) =>
      createElement(
        ThemeProvider,
        { value: DECK_THEME, colorScheme: 'dark' },
        node as never,
      ),
  ],
};
