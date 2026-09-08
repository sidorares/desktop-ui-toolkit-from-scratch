// Where the talk has got to, in words rather than in a fraction.
//
// `23 / 38` tells a presenter how much is left and an audience nothing at all.
// Thirty-eight slides is more than anyone can hold as a list, and a room that
// has lost the thread cannot ask a good question — so the footer carries the
// name of the section as well as the number, and the name changes eight times
// across the talk.
//
// It is a range table rather than a key in each slide's frontmatter on
// purpose: an act is a property of the *order*, not of the file. Inserting a
// slide should move the boundary that follows it, which is what an index
// range does for free and what a per-file key would silently get wrong — a
// slide moved into a different act would keep the old label, and nothing
// would complain.
//
// `from` is the first slide index in the act, inclusive. The title slides at
// either end belong to no act: naming a section over "Thank you" is furniture
// with nothing to say.

interface Act {
  /** First slide index of the act. */
  from: number;
  /** What to call it, or null for the slides that are outside the argument. */
  name: string | null;
}

const ACTS: readonly Act[] = [
  { from: 0, name: null },
  { from: 2, name: 'the wire' },
  { from: 11, name: 'why build one' },
  { from: 15, name: 'React, without a DOM' },
  { from: 19, name: "what's in the box" },
  { from: 24, name: 'under the hood' },
  { from: 27, name: 'make it fast' },
  { from: 31, name: 'what it cost' },
  { from: 36, name: null },
];

/** The section a slide is in, or `null` outside the argument. */
export function actOf(index: number): string | null {
  let name: string | null = null;
  for (const act of ACTS) {
    if (index < act.from) break;
    name = act.name;
  }
  return name;
}
