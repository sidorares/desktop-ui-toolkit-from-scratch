// A second progress line, under the first one: where the *clock* has got to.
//
// The number a presenter actually needs is not the time and not the slide
// position — it is the difference between them. So the pace line is drawn
// directly under the slide line, in the same track width, and the question
// becomes a glance: **if the bottom line is ahead of the top one, you are
// behind.** That comparison is why this is not a digital clock in the corner.
//
// The colour says the same thing again for the case where the lines are too
// close to read at projector distance — muted while the two are within a
// couple of minutes of each other, amber when the clock is meaningfully
// ahead, and red once the slot is gone.
//
// **The state is module-scope, not in `<Deck>`.** A ticking `useState` up
// there would re-render the whole slide four times a second, which on the
// terminal slide means re-rendering a live shell to move a two-pixel bar. So
// the store lives here, `<PaceLine>` is the only subscriber, and a tick
// repaints a line and nothing else. Same reasoning as `processes.ts`.
//
// Elapsed time is derived from a wall-clock start, not accumulated from
// ticks: a dropped interval, a machine that slept, or a laptop lid closed
// between rehearsal and talk would otherwise all show up as drift, and a
// pacemaker that is wrong is worse than no pacemaker.
import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

import { createStore } from './processes.js';

/** The slot this deck is written for. */
export const TALK_MS = 40 * 60 * 1000;

/** How far the clock may lead the slides before the line changes colour. */
const TOLERANCE = 2 * 60 * 1000;

/** How often the line moves. 250ms is below what reads as a step at this
 *  width, and it costs one leaf repaint — see the note above about why that
 *  is affordable and a `<Deck>`-level tick is not. */
const TICK = 250;

interface PaceState {
  /** `performance.now()` when the current run began, or null while paused. */
  since: number | null;
  /** Milliseconds banked by previous runs, so pause/resume does not lose
   *  time and does not double-count it either. */
  banked: number;
  /** Bumped on every tick, purely to notify subscribers. */
  tick: number;
}

const store = createStore<PaceState>({ since: null, banked: 0, tick: 0 });

let timer: ReturnType<typeof setInterval> | null = null;

function arm(): void {
  if (timer) return;
  timer = setInterval(() => store.set({ tick: store.get().tick + 1 }), TICK);
}

function disarm(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

/** Milliseconds on the clock, running or paused. */
export function elapsed(state: PaceState = store.get()): number {
  const live = state.since === null ? 0 : performance.now() - state.since;
  return state.banked + live;
}

/** Has the pacemaker been started at all? Nothing is drawn before it has. */
export function armed(state: PaceState = store.get()): boolean {
  return state.since !== null || state.banked > 0;
}

export function running(state: PaceState = store.get()): boolean {
  return state.since !== null;
}

/** `p` — start, or pause, or resume. */
export function toggle(): void {
  const state = store.get();
  if (state.since === null) {
    store.set({ since: performance.now() });
    arm();
  } else {
    // Bank what this run was worth before dropping the start mark, or the
    // time between `p` and `p` disappears.
    disarm();
    store.set({ since: null, banked: elapsed(state) });
  }
}

/** `P` — back to zero and stopped, for the second rehearsal. */
export function reset(): void {
  disarm();
  store.set({ since: null, banked: 0, tick: 0 });
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export interface PaceLineProps {
  /** The slide line's fraction, so the two can be compared. */
  progress: number;
  /** The deck's zoom scaler, so this line matches the one above it. */
  px: (n: number) => number;
}

/**
 * The line, and the one number worth having beside it.
 *
 * The track is always laid out and only *painted* once the pacemaker is
 * armed: reserving the two pixels means pressing `p` mid-talk does not reflow
 * the slide above it, and leaving it unpainted means a presenter who never
 * uses this feature is not looking at an empty grey rule all evening.
 */
export function PaceLine({ progress, px }: PaceLineProps): ReactElement {
  const state = useSyncExternalStore(store.subscribe, store.get);
  const on = armed(state);
  const ms = elapsed(state);
  const fraction = Math.min(1, ms / TALK_MS);

  // Over the slot is red; clock meaningfully ahead of the slides is amber.
  // `progress` is the slide fraction, so the two are directly comparable.
  const behind = ms - progress * TALK_MS;
  const colour =
    ms >= TALK_MS ? '$danger' : behind > TOLERANCE ? '$warning' : '$textMuted';

  return (
    <box style={{ flexDirection: 'row', alignItems: 'center', gap: px(8) }}>
      <box
        style={{
          flexGrow: 1,
          height: px(2),
          borderRadius: px(1),
          // The page's own ground when idle, rather than `transparent` —
          // which is a `<window>` prop here, not a colour value, so it is
          // not a thing `backgroundColor` is documented to take.
          backgroundColor: on ? '$border' : '$background',
        }}
      >
        <box
          style={{
            width: `${Math.round(fraction * 1000) / 10}%`,
            height: px(2),
            borderRadius: px(1),
            backgroundColor: on ? colour : '$background',
            // Matches the tick, so the line slides rather than steps.
            transition: TICK,
          }}
        />
      </box>
      {/* Time left, not time spent: "eleven minutes" is a decision and
          "twenty-nine minutes elapsed" is arithmetic to do on stage. */}
      {on ? (
        <text
          style={{
            fontSize: px(12),
            color: colour,
            fontFamily: '$monoFamily',
          }}
        >
          {running(state) ? mmss(TALK_MS - ms) : `${mmss(TALK_MS - ms)} paused`}
        </text>
      ) : null}
    </box>
  );
}
