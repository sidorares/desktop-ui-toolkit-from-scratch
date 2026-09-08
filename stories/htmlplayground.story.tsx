// `<HtmlPlayground>` — the editor and the document, side by side.
//
// Worth poking at here rather than on the slide, because two of its parts
// are new: the split is a live layout that has to survive a drag, and the
// editor's HTML mode is `src/html-language.ts`, written for this deck. The
// stories below are the mode's awkward cases — a comment, an unquoted
// attribute, an entity, a `<style>` body that is not markup — which is
// where a hand-written tokenizer goes wrong.
import { story } from '@react-x11/workbench/story';

import { HtmlPlayground } from '../src/components/htmlplayground.js';

export default { title: 'HtmlPlayground', size: { width: 1100, height: 520 } };

/** What a slide opens with. */
export const sample = () => <HtmlPlayground height={440} />;

/** The tokenizer's awkward corners, all in one document. */
export const tokenizer = () => (
  <HtmlPlayground
    height={440}
    source={`<!doctype html>
<!-- a comment, <with> markup in it -->
<div id=unquoted class="two words" data-empty>
  &amp; &#8212; &nbsp; a bare & and a < that opens nothing
  <input type="checkbox" checked>
</div>
<style>
  /* not markup: a raw text element */
  div::after { content: "</div>" }
</style>
`}
  />
);

/** A narrow editor, for a slide that gives the document the room. */
export const documentFirst = () => <HtmlPlayground height={440} split={300} />;

export const playground = story(
  (args: { height: number; split: number }) => <HtmlPlayground {...args} />,
  {
    args: { height: 420, split: 520 },
    controls: {
      height: { type: 'number', min: 200, max: 700, step: 20 },
      split: { type: 'number', min: 220, max: 900, step: 20 },
    },
  },
);
