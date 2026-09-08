// `npx tsx scripts/smoke.ts` — every slide parsed, with its step count, the
// components it names, and whether it has speaker notes. A talk's rehearsal
// aid and its cheapest regression test: a frontmatter typo, a reveal marker
// swallowed by a code fence, or a component tag whose name is not in the map
// (and so is silently prose) shows up here in a second.
import { fileURLToPath } from 'node:url';

import { loadSlides } from '../src/slides.js';
import * as components from '../src/components/index.js';

const KNOWN = new Set(Object.keys(components));

const slides = await loadSlides(
  fileURLToPath(new URL('../slides', import.meta.url)),
);

let steps = 0;
for (const [i, s] of slides.entries()) {
  steps += s.steps;
  // Tags that open a line — the position MDX treats as a component.
  const tags = [...s.source.matchAll(/^<([A-Z][\w.]*)/gm)].map((m) => m[1]!);
  const used = [...new Set(tags)];
  const unknown = used.filter((t) => !KNOWN.has(t));
  console.log(
    [
      String(i).padStart(2),
      `${s.steps}st`,
      s.layout.padEnd(7),
      (s.notes ? 'notes' : 'NO NOTES').padEnd(9),
      s.title.padEnd(38),
      used.join(' ') + (unknown.length ? `  !! unknown: ${unknown.join(' ')}` : ''),
    ].join('  '),
  );
}
console.log(`\n${slides.length} slides, ${steps} steps`);
console.log(`components available: ${[...KNOWN].sort().join(', ')}`);
