// A slide's words: `<Markdown>` with the deck's typography, plus the two
// fences that make a slide more than words.
//
// Live demos arrive through the `fences` seam rather than through any deck
// syntax of its own — the same seam that already turns a ```math fence into
// a `<Formula>`. That is the whole reason the slides can stay plain
// CommonMark: the one thing a deck needs that markdown lacks is an escape
// into components, and the component already has one.
import type { ReactElement } from 'react';

import { Formula, Markdown } from '@react-x11/components';
import type { FenceInfo } from '@react-x11/components';

import { DemoSlot, parseOptions } from './demos/index.js';

// Module scope, so the map keeps one identity: a new object per render
// defeats `<Markdown>`'s per-block cache.
const FENCES = {
  demo: ({ text }: FenceInfo) => <DemoSlot options={parseOptions(text)} />,
  math: ({ text, partial }: FenceInfo) => (
    <Formula tex={text} display partial={partial} />
  ),
};

export interface ProseProps {
  source: string;
  /** Base size. Headings scale from it, so this is the deck's one dial. */
  fontSize?: number;
  /**
   * Fill the slide (default). A centred slide passes false: a document that
   * grows to the full height has already consumed the free space its parent
   * would otherwise have distributed, so `justifyContent` does nothing.
   */
  grow?: boolean;
}

export function Prose({
  source,
  fontSize = 22,
  grow = true,
}: ProseProps): ReactElement {
  return (
    <Markdown
      source={source}
      partial={false}
      fences={FENCES}
      fontSize={fontSize}
      style={grow ? { flexGrow: 1 } : {}}
    />
  );
}
