// `npx tsx scripts/shot.tsx <slide> <step> <out.png>` — one slide, rendered
// and captured, without a presenter.
//
// This is the seed of the backup deck: a talk needs a PDF that works when
// the laptop does not, and the honest way to make one is to photograph the
// real renderer rather than to re-typeset the slides somewhere else.
import { fileURLToPath } from 'node:url';

import { createRoot } from 'react-x11';

import { Deck } from '../src/deck.js';
import { loadSlides } from '../src/slides.js';

const SLIDES_DIR = fileURLToPath(new URL('../slides', import.meta.url));

const slide = Number(process.argv[2] ?? 0);
const step = Number(process.argv[3] ?? 0);
const out = process.argv[4] ?? `slide-${slide}-${step}.png`;

const all = await loadSlides(SLIDES_DIR);
// The deck opens on its first slide, so the slide to shoot is made first.
const slides = all.slice(slide);
const root = await createRoot();
root.render(<Deck slides={slides} initialStep={step} />);

await new Promise((resolve) => setTimeout(resolve, 3000));

const windows = (root as unknown as { app: { _windows: Map<unknown, { snapshot(p: string): Promise<void> }> } })
  .app._windows;
const [first] = [...windows.values()];
if (!first) throw new Error('no window to snapshot');
await first.snapshot(out);
console.log(`wrote ${out}`);
process.exit(0);
