// `<Stats>` — the four totals, in a row.
//
// It exists because four `<Metric/>` tags in a slide are four *blocks*, and
// blocks stack: too tall, and the wrong reading, since the four numbers are
// one fact. Seeing it beside `metric.story.tsx` is the argument.
import { story } from '@react-x11/workbench/story';

import { Stats } from '../src/components/stats.js';

export default { title: 'Stats', size: { width: 900, height: 180 } };

export const all = () => <Stats />;

/** `only` narrows it — the same component on a slide with less room. */
export const twoOfThem = () => <Stats only={['commits', 'prs']} />;

export const pick = story(
  (args: { commits: boolean; prs: boolean; repos: boolean; revived: boolean }) => (
    <Stats
      only={(Object.keys(args) as Array<keyof typeof args>).filter(
        (k) => args[k],
      )}
    />
  ),
  {
    args: { commits: true, prs: true, repos: false, revived: false },
    controls: {
      commits: 'boolean',
      prs: 'boolean',
      repos: 'boolean',
      revived: 'boolean',
    },
  },
);
