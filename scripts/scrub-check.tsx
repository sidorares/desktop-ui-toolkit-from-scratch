// The scrubber, driven rather than looked at.
//
// Point at the progress track and the label should name the slide under the
// pointer; click and the deck should go there. Neither is a thing a screenshot
// can confirm, so this drives real pointer events through the renderer's own
// hit testing with `react-x11/test`.
//
// Two things about the harness, learned the hard way and worth keeping here:
//
//  - **`queryByText` is a substring match by default.** `'1 / 40'` is a
//    substring of `'21 / 40'`, so reading the footer counter without
//    `exact: true` reports slide 1 wherever the deck actually is — which
//    turns every position assertion into a false pass.
//  - **Injected pointer events arrive late, and `settle()` does not flush
//    them.** They go in at the server and come back to the client over the
//    socket, so the state update is an unknown number of round trips away —
//    with a fixed `settle()` the assertions read the previous frame and every
//    one of them fails for the wrong reason. So every probe *waits* for the
//    thing it is about to assert to become true, or gives up loudly.
//  - Each probe also leaves the track and re-enters at the offset it wants,
//    rather than sliding along it: the injector delivers enter and leave
//    reliably and motion-within-a-node less so.
import { fileURLToPath } from 'node:url';

import {
  act,
  cleanup,
  fireEvent,
  renderX11,
  settle,
  textOf,
  within,
} from 'react-x11/test';

import { Deck } from '../src/deck.js';
import { loadSlides } from '../src/slides.js';

const SLIDES_DIR = fileURLToPath(new URL('../slides', import.meta.url));
const slides = await loadSlides(SLIDES_DIR);

let bad = 0;
function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) bad++;
}

const r = await renderX11(<Deck slides={slides} />, {
  width: 1280,
  height: 800,
  // The screen has to exceed the window, or the footer is off it and an
  // injected pointer move lands nowhere.
  screen: { width: 1440, height: 900 },
});

const scrub = r.getByComponent('Scrubber');

/**
 * The number in the scrub label, or null when no label is up. Found by
 * component and then read *within* it: a bare `queryByText('21')` would match
 * whatever numbers the slide behind it contains, and `nodeUtterance` is empty
 * for a plain box — the label is boxes and text, not a widget with a role.
 */
function labelled(): number | null {
  const node = r.queryByComponent('ScrubLabel');
  if (!node) return null;
  for (const text of within(node).queryAllByText(/^\d+$/)) {
    const n = Number(textOf(text).trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Where the deck actually is, off its own footer counter. */
function at(): number | null {
  for (let n = 1; n <= slides.length; n++) {
    if (r.queryByText(`${n} / ${slides.length}`, { exact: true })) return n;
  }
  return null;
}

/**
 * Poll until `ok` holds, or give up. This is the load-bearing helper: the
 * events go in at the server and reach the client over the socket, so there
 * is no fixed number of round trips that means "it has landed".
 */
async function waitFor<T>(
  read: () => T,
  ok: (v: T) => boolean,
  ms = 4000,
): Promise<T> {
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

/**
 * Point at an offset from the track's centre and wait for the label, **re-
 * firing the move** until it registers.
 *
 * A single move is not reliable: whether an injected motion is delivered
 * depends on where the pointer already was, so the honest thing is to keep
 * asking rather than to encode which sequences happen to work. Re-sending the
 * same position is harmless — it is the same pointer at the same place.
 */
async function pointAt(dx: number): Promise<number | null> {
  await act(() => fireEvent.mouseLeave(scrub));
  await waitFor(labelled, (v) => v === null);
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    await act(() => fireEvent.mouseMove(scrub, { dx }));
    await settle(r.app);
    await act(async () => {
      await new Promise((res) => setTimeout(res, 20));
    });
    const v = labelled();
    if (v !== null) return v;
  }
  return null;
}

/**
 * Point at an offset, then press and release there.
 *
 * Deliberately not `fireEvent.click`, which injects the move and the button
 * back to back: the button then reaches the client before the motion it was
 * supposed to follow, so the hit test routes it from the pointer's *old*
 * position. Moving first and waiting for the label proves the client knows
 * where the pointer is before the press arrives.
 *
 * Returns both the slide the label named and the slide the deck landed on,
 * so the assertion can be the real contract — **you go where it said you
 * would** — rather than a comparison against arithmetic repeated from the
 * component.
 */
async function seekAt(
  dx: number,
): Promise<{ aimed: number | null; landed: number | null }> {
  const before = at();
  const aimed = await pointAt(dx);
  await act(() => fireEvent.mouseDown(scrub, { dx }));
  await act(() => fireEvent.mouseUp(scrub, { dx }));
  const landed = await waitFor(at, (v) => v !== before);
  return { aimed, landed };
}

const middle = Math.round(0.5 * (slides.length - 1)) + 1;

check('the scrubber is in the tree', !!scrub);
check('no label before the pointer arrives', labelled() === null);
check('the deck starts on slide 1', at() === 1, `at ${at()}`);

const centre = await pointAt(0);
check(
  'the centre of the track names the middle slide',
  centre === middle,
  `label ${centre}, expected ${middle}`,
);

const leftOf = await pointAt(-300);
const rightOf = await pointAt(300);
check(
  'left of centre names an earlier slide',
  leftOf !== null && centre !== null && leftOf < centre,
  `${leftOf} < ${centre}`,
);
check(
  'right of centre names a later slide',
  rightOf !== null && centre !== null && rightOf > centre,
  `${rightOf} > ${centre}`,
);

// Near the ends, still inside the track: the clamp must not eat real range.
const nearStart = await pointAt(-560);
const nearEnd = await pointAt(560);
check('near the left end names slide 1', nearStart === 1, `label ${nearStart}`);
check(
  'near the right end names the last slide',
  nearEnd === slides.length,
  `label ${nearEnd}`,
);

await act(() => fireEvent.mouseLeave(scrub));
check(
  'the label goes when the pointer does',
  (await waitFor(labelled, (v) => v === null)) === null,
);

// And the click seeks.
// Two seek probes, not three, and the showcase is reached last.
//
// **The injector will not deliver a third.** A pointer already inside the
// node cannot be moved to a new place within it reliably — re-sending the
// same coordinates produces no motion at all, since as far as the server is
// concerned nothing moved — so the second consecutive seek never registers
// its enter. Working around that means jiggling the pointer between two
// positions and disambiguating which label came back, which tests the
// harness rather than the deck.
//
// Two positions is enough coverage: one clamped end and the middle, both
// asserted against the label rather than against arithmetic copied out of the
// component. The mapping itself is separately proven at five positions above,
// and it is the same `slideAt` a click goes through.
for (const [where, dx, expected] of [
  ['near the right end', 560, slides.length],
  ['the centre', 0, middle],
] as const) {
  const { aimed, landed } = await seekAt(dx);
  check(
    `clicking ${where} goes where the label said`,
    aimed !== null && landed === aimed,
    `label ${aimed}, landed ${landed}`,
  );
  check(
    `clicking ${where} reaches slide ${expected}`,
    landed === expected,
    `at ${landed}`,
  );
}

// A seek resets the step, the way every other navigation does.
await seekAt(0);
check(
  'a seek lands on the first step of its slide',
  !!r.queryByText(`step 1/${slides[middle - 1]!.steps}`, { exact: true }),
  `expected step 1/${slides[middle - 1]!.steps}`,
);

await cleanup();
console.log(bad ? `\n${bad} failed` : '\nall passed');
process.exit(bad ? 1 : 0);
