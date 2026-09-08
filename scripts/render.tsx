// `npx tsx scripts/render.tsx <slide> <step> <out.png>` — a slide rendered
// headlessly through ntk's own text engine, straight to a PNG.
//
// Two reasons this exists beside `shot.tsx`: it needs no window server, so it
// works over ssh and in CI, and it goes through the engine that reports
// laid-out runs *with* their spans — so it shows the slide at full fidelity,
// inline-code chips and all, which the Cocoa capture cannot yet.
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { renderX11 } from 'react-x11/test';
import { PNG } from 'pngjs';

import { Deck } from '../src/deck.js';
import { loadSlides } from '../src/slides.js';

const SLIDES_DIR = fileURLToPath(new URL('../slides', import.meta.url));

const FONT_CANDIDATES: Array<[string, string]> = [
  [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Monaco.ttf',
  ],
  [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
  ],
];
const found = FONT_CANDIDATES.find(
  ([sans, mono]) => existsSync(sans) && existsSync(mono),
);
if (!found) throw new Error('no usable font pair on this host');
const fonts = { 'sans-serif': found[0], monospace: found[1] };

const slide = Number(process.argv[2] ?? 0);
const step = Number(process.argv[3] ?? 0);
const out = process.argv[4] ?? `slide-${slide}-${step}.png`;

const all = await loadSlides(SLIDES_DIR);
const result = await renderX11(
  // `wrap: false`: <Deck> renders its own <window>, and wrapping would put a
  // blank one in front of it.
  <Deck slides={all.slice(slide)} initialStep={step} />,
  { fonts, colorScheme: 'dark', wrap: false } as never,
);

await new Promise((resolve) => setTimeout(resolve, 1500));

const { width, height } = (
  result as unknown as { windowNode: { abs: { width: number; height: number } } }
).windowNode.abs;
const ctx = (
  result as unknown as {
    ctx: {
      getImageData(
        x: number,
        y: number,
        w: number,
        h: number,
        cb: (err: unknown, data: { data: Uint8Array }) => void,
      ): void;
    };
  }
).ctx;

const rgba = await new Promise<Uint8Array>((resolve, reject) =>
  ctx.getImageData(0, 0, width, height, (err, data) =>
    err ? reject(err) : resolve(data.data),
  ),
);

const png = new PNG({ width, height });
png.data.set(rgba.subarray(0, png.data.length));
await writeFile(out, PNG.sync.write(png));
console.log(`wrote ${out} (${width}x${height})`);
process.exit(0);
