// The talk's numbers, in one place.
//
// They appear on three slides and inside two components, and a number that
// disagrees with itself on stage is the kind of thing an audience notices
// and a speaker cannot fix mid-sentence. Slides read them as `{stats.prs}`
// through `<Markdown>`'s `scope`; components import them directly.
//
// Counted 2026-09-08 with `git log` across the seven repositories. Merged
// PRs come from squash-merge subjects matching `(#N)`, so they are a close
// approximation rather than an API count — say so if anyone asks.

/** 23 July 2026, when node-x11 woke up, to the day of the talk. */
export const STATS = {
  days: 47,
  commits: 983,
  prs: 586,
  newRepos: 4,
  revivedRepos: 3,
  /** react-x11's first eleven years, and then its next seven weeks. */
  quietYears: 32,
  burst: 371,
} as const;

/** `git log --format=%ad --date=format:%Y | sort | uniq -c`, for react-x11. */
export const HISTORY: ReadonlyArray<{ year: string; commits: number }> = [
  { year: '2015', commits: 8 },
  { year: '2016', commits: 2 },
  { year: '2017', commits: 20 },
  { year: '2018', commits: 1 },
  { year: '2022', commits: 1 },
  { year: '2026', commits: 371 },
];

export interface Milestone {
  date: string;
  what: string;
  /** True for the seven weeks; false for the fifteen years before them. */
  burst?: boolean;
  /** A repository that did not exist before this date. */
  born?: boolean;
}

export const TIMELINE: readonly Milestone[] = [
  { date: '7 Jun 2011', what: 'node-x11', born: true },
  { date: '19 Dec 2012', what: 'ntk', born: true },
  { date: '11 Nov 2015', what: 'react-x11', born: true },
  { date: '23 Jul 2026', what: 'node-x11 wakes up', burst: true },
  { date: '25 Jul', what: 'ntk', burst: true },
  { date: '26 Jul', what: 'react-x11', burst: true },
  { date: '8 Aug', what: 'node-x11-dri', burst: true, born: true },
  { date: '9 Aug', what: 'react-x11-components', burst: true, born: true },
  { date: '16 Aug', what: 'the workbench', burst: true, born: true },
  { date: '22 Aug', what: 'the protocol visualizer', burst: true, born: true },
];
