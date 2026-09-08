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
// Two things here are the talk arguing for itself. `useKeepAwake` is why the
// screen does not blank during a long demo — an app in a browser tab cannot
// ask for that. And the window asks the window manager for `fullscreen`
// rather than drawing its own, which is the whole "integrate with the
// desktop" claim in one prop.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { ThemeProvider, useKeepAwake } from 'react-x11';
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
import { StepProvider } from './steps.js';
import type { Slide } from './slides.js';

/** The deck's palette. Dark, pinned: a projector is not a desktop. */
const THEME = {
  background: '#0e1116',
  surface: '#161b22',
  border: '#2a3038',
  text: '#e6edf3',
  textMuted: '#8b949e',
  accent: '#58a6ff',
};

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

  // Never blank the screen mid-talk. The reason string is what a desktop's
  // "an application is preventing sleep" panel shows.
  useKeepAwake(true, 'Presenting');

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

  const onKeyDown = useCallback(
    (ev: { keysym?: number; key?: string; preventDefault(): void }) => {
      const k = ev.keysym;
      const handled = () => ev.preventDefault();
      if (k === XK_RIGHT || k === XK_PAGE_DOWN) return go(index + 1), handled();
      if (k === XK_LEFT || k === XK_PAGE_UP) return go(index - 1), handled();
      if (k === XK_DOWN || k === XK_SPACE) return advance(), handled();
      if (k === XK_UP) return retreat(), handled();
      if (k === XK_HOME) return go(0), handled();
      if (k === XK_END) return go(slides.length - 1), handled();
      if (k === XK_ESCAPE) return setFullscreen(false), handled();
      if (ev.key === 'f') return setFullscreen((f) => !f), handled();
      if (ev.key === 'r') return onReload?.(), handled();
    },
    [index, go, advance, retreat, slides.length, onReload],
  );

  const stepState = useMemo(
    () => ({ step, steps: slide?.steps ?? 1 }),
    [step, slide],
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

  return (
    <ThemeProvider value={THEME} colorScheme="dark">
      <window
        width={1280}
        height={800}
        fullscreen={fullscreen}
        title={`${slide.title} — Making a Desktop UI Toolkit From Scratch`}
        onKeyDown={onKeyDown}
        style={{ backgroundColor: '$background' }}
      >
        <box
          style={{
            flexGrow: 1,
            gap: 16,
            // `title` centres its block vertically and gives it more room to
            // breathe; `full` hands the whole window to a demo. Everything
            // else is a document, and reads from the top.
            padding: slide.layout === 'full' ? 0 : 48,
            justifyContent:
              slide.layout === 'title' ? 'center' : 'flex-start',
          }}
        >
          <StepProvider value={stepState}>
            <Prose
              key={`${slide.id}:${step}`}
              source={slide.chunks[step] ?? ''}
              fontSize={slide.layout === 'title' ? 26 : 22}
              grow={slide.layout !== 'title'}
            />
          </StepProvider>
        </box>

        <box
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingLeft: 48,
            paddingRight: 48,
            paddingBottom: 16,
          }}
        >
          <text style={{ fontSize: 12, color: '$textMuted' }}>
            {`${index + 1} / ${slides.length}`}
          </text>
          <box
            style={{
              flexGrow: 1,
              height: 2,
              backgroundColor: '$border',
              borderRadius: 1,
            }}
          >
            <box
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: 2,
                backgroundColor: '$accent',
                borderRadius: 1,
                transition: 200,
              }}
            />
          </box>
          {slide.steps > 1 ? (
            <text style={{ fontSize: 12, color: '$textMuted' }}>
              {`step ${step + 1}/${slide.steps}`}
            </text>
          ) : null}
        </box>
      </window>
    </ThemeProvider>
  );
}
