// A slide's words: `<Markdown>` with the deck's typography, the components a
// slide may name, and the numbers it may read.
//
// Both are opt-ins on the same element, and they say different things.
// `components` decides what a slide may *reach* — `<Charts/>` is a component
// because `Charts` is a key below, and `<Anything/>` else is the literal text
// it looks like. `scope` decides whether a slide may *compute*, which is what
// lets the stats slide write `{stats.prs}` instead of a number that can
// disagree with the chart beside it.
//
// Passing `scope` is safe here for a reason worth saying out loud: these
// slides are ours. The same prop pointed at a document somebody else wrote —
// a model's output, say — would be handing it `new Function`.
import type { ReactElement } from 'react';

import { Formula, Markdown } from '@react-x11/components';
import type { FenceInfo } from '@react-x11/components';

import {
  Booking,
  Charts,
  ChartsDemo,
  DataViz,
  Desktop,
  DevTools,
  Ecosystem,
  Documents,
  HotReload,
  HtmlPlayground,
  Metric,
  Placeholder,
  Scenes,
  SourceCode,
  Stats,
  Terminal,
  Timeline,
  Widgets,
  Wire,
} from './components/index.js';
import { STATS } from './data.js';

// Module scope, all three: a new object per render re-parses every slide and
// defeats `<Markdown>`'s per-block cache.
const COMPONENTS = {
  Booking,
  Charts,
  ChartsDemo,
  DataViz,
  Desktop,
  DevTools,
  Ecosystem,
  Documents,
  HotReload,
  HtmlPlayground,
  Metric,
  Placeholder,
  Scenes,
  SourceCode,
  Stats,
  Terminal,
  Timeline,
  Widgets,
  Wire,
};

const SCOPE = { stats: STATS };

// A fence is still the right shape for a *language*, which is what maths is.
const FENCES = {
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
      components={COMPONENTS}
      scope={SCOPE}
      fences={FENCES}
      fontSize={fontSize}
      style={grow ? { flexGrow: 1 } : {}}
    />
  );
}
