// The desktop slide's punchline, driven rather than looked at.
//
// A screenshot proves the menu is *there* — the deck's own window shows
// `exported`, and on macOS `Slide` and `Deck` really are in the system menu
// bar. What no screenshot can prove is the half the demo is actually making:
// that picking an item from a menu this application never drew **moves the
// talk**. That path runs from a `MenuItem.onSelect` in the array, through
// `useGlobalMenu` (which calls `item.onSelect` before its own), out to
// `useNav()` and into `<Deck>`'s `go` — four seams, none of them typed
// together, and every one of them silently survivable if it breaks.
//
// Under `react-x11/test` there is no registrar and no cocoa bridge, so
// `useGlobalMenu` reports `exported: false` and `<MenuBar>` draws the bar
// itself. That is the right harness for this: the drawn bar and the exported
// one are handed **the same array**, so clicking a row here exercises the
// same `onSelect` the desktop's menu invokes. What it does not cover is the
// transport, which is the library's own test suite's job.
import { fileURLToPath } from 'node:url';

import { act, cleanup, fireEvent, renderX11, settle } from 'react-x11/test';

import { Deck } from '../src/deck.js';
import { loadSlides } from '../src/slides.js';

const SLIDES_DIR = fileURLToPath(new URL('../slides', import.meta.url));
const all = await loadSlides(SLIDES_DIR);

const from = all.findIndex((s) => s.id === 'desktop-integration');
if (from < 0) throw new Error('no desktop-integration slide in slides/');

// Sliced, so the deck opens on the slide under test; `initialStep` puts it on
// the demo. The counter then reads `1 / n`, which is what `at()` compares.
const slides = all.slice(from);
const steps = slides[0]!.steps;

let bad = 0;
function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) bad++;
}

const r = await renderX11(<Deck slides={slides} initialStep={steps - 1} />, {
  width: 1280,
  height: 800,
  screen: { width: 1440, height: 900 },
});

/** Where the deck is, off its own footer counter. */
function at(): number | null {
  for (let n = 1; n <= slides.length; n++) {
    if (r.queryByText(`${n} / ${slides.length}`, { exact: true })) return n;
  }
  return null;
}

/** Poll until `ok` holds — a press lands an unknown number of round trips away. */
async function waitFor<T>(read: () => T, ok: (v: T) => boolean, ms = 4000) {
  const deadline = Date.now() + ms;
  let v = read();
  while (!ok(v) && Date.now() < deadline) {
    await settle(r.app);
    await act(async () => {
      await new Promise((res) => setTimeout(res, 20));
    });
    v = read();
  }
  return v;
}

check('the demo mounted', !!r.queryByComponent('Desktop'));
check('the deck opens on the slide under test', at() === 1, `at ${at()}`);

// Off a desktop with a registrar the bar is drawn, and the rows are the same
// objects the export would have serialised.
const bar = r.queryByComponent('MenuBar');
check('a MenuBar is mounted', !!bar);

const slideMenu = r.queryByText('Slide', { exact: true });
check('the Slide menu is on the bar', !!slideMenu);

if (slideMenu) {
  await act(() => fireEvent.click(slideMenu));
  const item = await waitFor(
    () => r.queryByText('Next slide', { exact: true }),
    (v) => !!v,
  );
  check('opening it shows its items', !!item);

  if (item) {
    await act(() => fireEvent.click(item));
    const landed = await waitFor(at, (v) => v === 2);
    // The whole point of the slide, as an assertion.
    check('picking "Next slide" advances the deck', landed === 2, `at ${landed}`);
    check(
      'and it lands on that slide’s first step',
      !!r.queryByText(`step 1/${slides[1]!.steps}`, { exact: true }) ||
        slides[1]!.steps === 1,
    );
  }
}

await cleanup();
console.log(bad ? `\n${bad} failed` : '\nall passed');
process.exit(bad ? 1 : 0);
