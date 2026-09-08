// `npx tsx scripts/smoke.ts` — every slide parsed, with its step count,
// demo count and whether it has speaker notes. A talk's rehearsal aid and
// its cheapest regression test: a frontmatter typo or a reveal marker
// swallowed by a code fence shows up here in a second.
import { fileURLToPath } from 'node:url';

import { loadSlides } from '../src/slides.js';

const slides = await loadSlides(
  fileURLToPath(new URL('../slides', import.meta.url)),
);

let steps = 0;
for (const [i, s] of slides.entries()) {
  steps += s.steps;
  const demos = s.source.match(/```demo/g)?.length ?? 0;
  console.log(
    [
      String(i).padStart(2),
      `${s.steps}st`,
      `${demos}d`,
      s.layout.padEnd(7),
      (s.notes ? 'notes' : 'NO NOTES').padEnd(9),
      s.title,
    ].join('  '),
  );
}
console.log(`\n${slides.length} slides, ${steps} steps`);
