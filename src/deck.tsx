// The deck: one window, a key map, and the slide the key map is pointing at.
//
// The navigation model is Keynote's rather than a web deck's, because that
// is the one a presenter already has in their hands: `←`/`→` move between
// slides whatever step they are on, `↑`/`↓` move between steps *within* a
// slide, and `space` is the "just advance" key that runs the two together —
// step until the slide is exhausted, then move on. Stepping back off the
// front of a slide lands on the *last* step of the one before, which is the
// difference between rehearsing a talk and getting lost in one.
//
// Four things here are the talk arguing for itself. `useKeepAwake` is why
// the screen does not blank during a long demo — an app in a browser tab
// cannot ask for that. `useBadge` puts the deck's position on the app's own
// icon, which is a thing a tab cannot ask for either. The window asks the
// window manager for `fullscreen` rather than drawing its own, which is the
// whole "integrate with the desktop" claim in one prop. And the zoom keys
// are `useAccelerator`, not four more lines in the switch below: matching a
// chord exactly on the four modifiers while ignoring the locks, against the
// Latin keysym so a layout switch does not turn it off, is the binding every
// application hand-rolls and gets subtly wrong.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import {
  ThemeProvider,
  useAccelerator,
  useBadge,
  useKeepAwake,
} from 'react-x11';
import type {
  DrawnNode,
  KeyboardEvent,
  MenuShortcut,
  MouseEvent,
} from 'react-x11';
import {
  XK_DOWN,
  XK_END,
  XK_ESCAPE,
  XK_HOME,
  XK_LEFT,
  XK_PAGE_DOWN,
  XK_PAGE_UP,
  XK_RIGHT,
  XK_SPACE,
  XK_UP,
} from 'react-x11/keysyms';

import { Prose } from './prose.js';
import { DECK_THEME } from './theme.js';
import { actOf } from './acts.js';
import { PaceLine, reset as paceReset, toggle as paceToggle } from './pacemaker.js';
import { StepProvider } from './steps.js';
import {
  ZOOM_DEFAULT,
  ZoomProvider,
  clampZoom,
  zoomLabel,
  zoomOf,
} from './zoom.js';
import type { Slide } from './slides.js';

/** The deck's palette. Dark, pinned: a projector is not a desktop. It is in
 *  its own module because the workbench plants the same one — see
 *  `src/theme.ts`. */
const THEME = DECK_THEME;

/**
 * react-x11's own default text size, and the deck's zoom unit for everything
 * it does not lay out by hand: the theme's `fontSize` is what a `<text>` that
 * names no size inherits, which is most of what a demo draws — down to a
 * chart's axis labels, which are measured from it.
 */
const BASE_FONT_SIZE = 14;

// The zoom chords. ⌘ reaches this renderer as Super — Mod4, `ev.metaKey` —
// and Control is the same shortcut on every other desktop, so both are bound
// rather than one of them chosen. `plus` *and* `equal` because `+` is a
// shifted `=` on most layouts and a presenter reaching for "bigger" presses
// whichever one their hands know; the matcher takes the character the key
// produced as well as the key, so both spellings work under either.
const ZOOM_IN: MenuShortcut = [
  ['Super', 'plus'],
  ['Super', 'equal'],
  ['Control', 'plus'],
  ['Control', 'equal'],
];
const ZOOM_OUT: MenuShortcut = [
  ['Super', 'minus'],
  ['Control', 'minus'],
];
const ZOOM_RESET: MenuShortcut = [
  ['Super', '0'],
  ['Control', '0'],
];

/**
 * How long after the window takes focus a press still counts as *the click
 * that activated it* rather than a click the presenter aimed at something.
 * The two arrive together, so this only has to outlast one event pump.
 */
const ACTIVATION_CLICK_MS = 300;

/**
 * The focused node at or under `root`, or null.
 *
 * A `<window>`'s ref is the ntk window rather than a node, so the deck holds
 * one on the box its slides render into and looks from there — which is
 * where anything focusable in this deck is, because a demo is the only thing
 * that ever takes the keyboard. `focusWithin` prunes the walk to the single
 * branch that can hold the answer, so this is a step per level rather than a
 * pass over the tree.
 */
function focusedIn(root: DrawnNode | null): DrawnNode | null {
  if (!root?.focusWithin) return null;
  if (root.focused) return root;
  for (const child of root.children) {
    const found = focusedIn(child);
    if (found) return found;
  }
  return null;
}

export interface DeckProps {
  slides: Slide[];
  /** Re-read the slide files from disk — bound to `r`. */
  onReload?: () => void;
  /** Open on this step of the first slide — `scripts/shot.tsx` uses it. */
  initialStep?: number;
}

export function Deck({
  slides,
  onReload,
  initialStep = 0,
}: DeckProps): ReactElement {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(initialStep);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(ZOOM_DEFAULT);

  // Never blank the screen mid-talk. The reason string is what a desktop's
  // "an application is preventing sleep" panel shows.
  useKeepAwake(true, 'Presenting');

  // Where the talk has got to, on the app's own icon — so the room, and the
  // presenter's second screen, can read the position off the Dock without
  // the deck being in front. It is the same string as the footer, declared
  // rather than pushed: `useBadge` shows it while this component is mounted
  // and clears it on the way out, which is the difference between a badge
  // and a badge somebody has to remember to take down.
  //
  // A **string** badge, which is a macOS-shaped choice and worth saying: the
  // Dock tile takes any label, while the freedesktop protocol underneath a
  // Linux launcher carries a *count* and has no text field at all. Nothing
  // is shown where nothing can show it, silently — so this is one line here
  // rather than a branch, and on a Linux desktop the position stays in the
  // footer where it always was.
  useBadge(`${index + 1} / ${slides.length}`);

  const slide = slides[Math.min(index, slides.length - 1)];

  // An edit that removes a step must not leave the deck pointing past the
  // end of the slide it is on.
  useEffect(() => {
    if (slide && step > slide.steps - 1) setStep(slide.steps - 1);
  }, [slide, step]);

  const go = useCallback(
    (to: number, atEnd = false) => {
      const next = Math.max(0, Math.min(to, slides.length - 1));
      setIndex(next);
      setStep(atEnd ? Math.max(0, (slides[next]?.steps ?? 1) - 1) : 0);
    },
    [slides],
  );

  const advance = useCallback(() => {
    if (!slide) return;
    if (step < slide.steps - 1) setStep(step + 1);
    else go(index + 1);
  }, [slide, step, index, go]);

  const retreat = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else if (index > 0) go(index - 1, true);
  }, [step, index, go]);

  // **Coming back to the deck means the deck has the keyboard.**
  //
  // macOS hands the click that reactivates a window straight to whatever is
  // under the pointer — ntk asks for that (`acceptsFirstMouse: YES`), because
  // on X11 a click on an unfocused window *acts* rather than only focusing,
  // and every X11 app behaves so. On a slide running a terminal that means
  // clicking back from the editor lands **inside the demo**, and every arrow
  // key after it is the demo's, which reads as a deck that stopped working.
  // The way into a demo is a click made while the deck already has the
  // keyboard. The click that brought the window back is not that click.
  //
  // Two halves, because the two events arrive in that order:
  //
  //  1. the activation clears whatever was focused *before* — an alt-tab
  //     away from a demo leaves it focused, the way a browser leaves
  //     `document.activeElement` alone; and
  //  2. the press that comes with the activation gives back what it just
  //     took. `preventDefault` is what makes that stick: focus moves on the
  //     press itself, before this handler runs, and the element's own
  //     `defaultMouseDown` would otherwise take it straight back — and type
  //     the click into the shell on the way.
  const contentRef = useRef<DrawnNode | null>(null);
  const activatedAt = useRef(0);

  const onWindowFocus = useCallback(() => {
    activatedAt.current = Date.now();
    focusedIn(contentRef.current)?.blur();
  }, []);

  const onMouseDown = useCallback((ev: MouseEvent) => {
    if (ev.target === ev.currentTarget) return;
    if (Date.now() - activatedAt.current > ACTIVATION_CLICK_MS) return;
    activatedAt.current = 0;
    ev.target.blur();
    ev.preventDefault();
  }, []);

  useAccelerator(ZOOM_IN, () => setZoomLevel((l) => clampZoom(l + 1)));
  useAccelerator(ZOOM_OUT, () => setZoomLevel((l) => clampZoom(l - 1)));
  useAccelerator(ZOOM_RESET, () => setZoomLevel(ZOOM_DEFAULT));

  const onKeyDown = useCallback(
    (ev: KeyboardEvent) => {
      const k = ev.keysym;
      const handled = () => ev.preventDefault();
      // **A demo that has the keyboard keeps it.** A key is dispatched at the
      // focused node and bubbles to this handler *before* any element's own
      // key behaviour runs — the layering that lets an application chord beat
      // a focused widget — so a deck that reads every key from here takes
      // `space` out of the shell on slide 2 and advances the slide with it,
      // which is stealing a keystroke from the demo it is making. `ev.target`
      // is that focused node, and the window itself when nothing inside is
      // focused, so this is "the slide has the keyboard" in one comparison.
      //
      // `Esc` is the way back, and the only key the deck takes while the
      // slide has the keyboard: it hands it over and goes no further, undoing
      // one level of "inside" rather than leaving fullscreen. Clicking
      // anywhere off the demo does the same, since a press moves focus to the
      // nearest focusable ancestor and there is none.
      if (ev.target !== ev.currentTarget) {
        if (k === XK_ESCAPE) return ev.target.blur(), handled();
        return;
      }
      if (k === XK_RIGHT || k === XK_PAGE_DOWN) return go(index + 1), handled();
      if (k === XK_LEFT || k === XK_PAGE_UP) return go(index - 1), handled();
      if (k === XK_DOWN || k === XK_SPACE) return advance(), handled();
      if (k === XK_UP) return retreat(), handled();
      if (k === XK_HOME) return go(0), handled();
      if (k === XK_END) return go(slides.length - 1), handled();
      if (k === XK_ESCAPE) return setFullscreen(false), handled();
      if (ev.key === 'f') return setFullscreen((f) => !f), handled();
      if (ev.key === 'r') return onReload?.(), handled();
      // The pacemaker. Lower case runs and pauses; upper case zeroes it, so
      // a second rehearsal does not start twenty minutes in. Neither touches
      // the slide, so both are safe to hit mid-sentence.
      if (ev.key === 'p') return paceToggle(), handled();
      if (ev.key === 'P') return paceReset(), handled();
    },
    [index, go, advance, retreat, slides.length, onReload],
  );

  const stepState = useMemo(
    () => ({ step, steps: slide?.steps ?? 1 }),
    [step, slide],
  );

  const zoom = useMemo(() => zoomOf(zoomLevel), [zoomLevel]);
  const { px } = zoom;
  // A new object per render would re-resolve the palette and rebuild every
  // cached block under it, so the theme moves only when the zoom does.
  const theme = useMemo(
    () => ({ ...THEME, fontSize: px(BASE_FONT_SIZE) }),
    [px],
  );

  if (!slide) {
    return (
      <window width={1280} height={800} title="Deck — no slides">
        <box style={{ flexGrow: 1, justifyContent: 'center', padding: 40 }}>
          <text style={{ fontSize: 18 }}>No `.md` files in `slides/`.</text>
        </box>
      </window>
    );
  }

  const progress = slides.length > 1 ? index / (slides.length - 1) : 1;
  const act = actOf(index);

  return (
    // The zoom provider goes *outside* the theme, not between it and the
    // window: `<ThemeProvider>` plants its palette on a `<window>` among its
    // direct children rather than wrapping one in a box — a window may not be
    // inside a box — and anything in between turns that into a wrap, and the
    // wrap into an error.
    <ZoomProvider value={zoom}>
      <ThemeProvider value={theme} colorScheme="dark">
        {/* The window's size is the one thing zoom leaves alone: it is the
            desktop's to decide, and the whole point is that the content
            reflows inside whatever it is. */}
        <window
          width={1280}
          height={800}
          fullscreen={fullscreen}
          title={`${slide.title} — Making a Desktop UI Toolkit From Scratch`}
          onKeyDown={onKeyDown}
          onFocus={onWindowFocus}
          onMouseDown={onMouseDown}
          style={{ backgroundColor: '$background' }}
        >
          <box
            ref={contentRef}
            style={{
              flexGrow: 1,
              gap: px(16),
              // `title` centres its block vertically and gives it more room
              // to breathe; `full` hands the whole window to a demo.
              // Everything else is a document, and reads from the top.
              padding: slide.layout === 'full' ? 0 : px(48),
              justifyContent:
                slide.layout === 'title' ? 'center' : 'flex-start',
            }}
          >
            <StepProvider value={stepState}>
              <Prose
                key={`${slide.id}:${step}`}
                source={slide.chunks[step] ?? ''}
                fontSize={px(slide.layout === 'title' ? 26 : 22)}
                grow={slide.layout !== 'title'}
              />
            </StepProvider>
          </box>

          <box
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: px(12),
              paddingLeft: px(48),
              paddingRight: px(48),
              paddingBottom: px(16),
            }}
          >
            <text style={{ fontSize: px(12), color: '$textMuted' }}>
              {`${index + 1} / ${slides.length}`}
            </text>
            {/* Two lines, stacked and sharing a width: where the slides have
                got to, and where the clock has. The gap between them is the
                only thing a presenter actually needs to read — see
                `pacemaker.tsx`. */}
            <box style={{ flexGrow: 1, gap: px(3) }}>
              <box
                style={{
                  height: px(2),
                  backgroundColor: '$border',
                  borderRadius: px(1),
                }}
              >
                <box
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: px(2),
                    backgroundColor: '$accent',
                    borderRadius: px(1),
                    transition: 200,
                  }}
                />
              </box>
              <PaceLine progress={progress} px={px} />
            </box>
            {/* The section, in words. A number says how much is left; the
                name says what the room is currently being told, which is the
                half a presenter cannot get from the progress bar and an
                audience cannot get at all. Silent on the title slides at
                either end — see `acts.ts`. */}
            {act ? (
              <text style={{ fontSize: px(12), color: '$textMuted' }}>
                {act}
              </text>
            ) : null}
            {slide.steps > 1 ? (
              <text style={{ fontSize: px(12), color: '$textMuted' }}>
                {`step ${step + 1}/${slide.steps}`}
              </text>
            ) : null}
            {/* Silent at 1×: a presenter who has not zoomed does not need to
                be told the deck is its own size. */}
            {zoom.factor !== 1 ? (
              <text style={{ fontSize: px(12), color: '$textMuted' }}>
                {zoomLabel(zoom.factor)}
              </text>
            ) : null}
          </box>
        </window>
      </ThemeProvider>
    </ZoomProvider>
  );
}
