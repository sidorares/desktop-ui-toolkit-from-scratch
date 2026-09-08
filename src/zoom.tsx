// The zoom ladder: how big the deck draws itself, decided in the room.
//
// The one thing about a slide that cannot be settled while writing it is how
// big it has to be. That is a fact about the projector, the throw distance
// and the back row, and it is learned about ten seconds before the talk
// starts — so it is a key, and every length the deck draws is multiplied by
// what that key is holding.
//
// **Why this is not the display scale.** react-x11 already has a number
// meaning "device pixels per logical pixel" — `useScale`, resolved once per
// connection from the panel and the desktop's own settings. Turning *that*
// dial would be the app claiming the display had changed underneath it: the
// window would keep its size in logical pixels and grow to cover more of the
// screen, and not one line of text would rewrap, because nothing about the
// layout would have moved. What a presenter wants is the other thing. The
// window stays exactly where the window manager put it and the content
// reflows inside it — a bullet that fitted on one line now takes two, a
// terminal keeps its box and shows fewer columns of larger text. That is a
// factor over the deck's *own* units, which is what this is.
//
// It is a ladder rather than a free multiplier because a talk is rehearsed at
// one size and given at another: "one press back" has to land on the size it
// was, exactly, and not near it.
import { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';

/**
 * The sizes the deck can be, as multipliers of the one it is written in.
 * Browser-ish steps: close enough that a press is a change rather than a
 * different slide, far enough apart that a few of them reach "the back row
 * can read the code".
 */
export const ZOOM_LEVELS = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2] as const;

/** Where the deck opens, and what `⌘0` puts it back to. */
export const ZOOM_DEFAULT = ZOOM_LEVELS.indexOf(1);

export interface ZoomState {
  /** Index into {@link ZOOM_LEVELS} — the level a keypress moves. */
  level: number;
  /** What every length is multiplied by; 1 at the default level. */
  factor: number;
  /**
   * A length written in the deck's units, at this zoom — `px(48)` is the
   * padding a slide has at 1×. Rounded, because type is sharpest on a whole
   * pixel and so is a box that has to meet a hairline.
   */
  px: (n: number) => number;
}

/** `level`, brought back onto the ladder. */
export function clampZoom(level: number): number {
  return Math.max(0, Math.min(Math.round(level), ZOOM_LEVELS.length - 1));
}

/**
 * The state for one level. Memoize it where it is made: `px` is a closure,
 * so a fresh call is a fresh identity and anything deriving from it — the
 * theme below, `<Markdown>`'s block cache — would rebuild every render.
 */
export function zoomOf(level: number): ZoomState {
  const at = clampZoom(level);
  const factor = ZOOM_LEVELS[at]!;
  return { level: at, factor, px: (n) => Math.round(n * factor) };
}

const ZoomContext = createContext<ZoomState>(zoomOf(ZOOM_DEFAULT));

export function ZoomProvider({
  value,
  children,
}: {
  value: ZoomState;
  children: ReactNode;
}): ReactElement {
  return <ZoomContext value={value}>{children}</ZoomContext>;
}

/**
 * How big the deck is drawing itself. A demo scales the sizes it names with
 * `px` — the type it sets by hand, and the padding around it:
 *
 * ```tsx
 * const { px } = useZoom();
 * <text style={{ fontSize: px(13) }}>…</text>
 * ```
 *
 * Two things need nothing. Text a demo does not size itself is already
 * zoomed, because the theme's `fontSize` is and that is what a bare `<text>`
 * inherits — a chart's axis labels come out of exactly that. And **the box a
 * demo stands in does not scale**: the `height:` a slide gave it is a share
 * of a window that did not change, so growing it is how a slide's chrome ends
 * up below the bottom edge. What a back row cannot read is the labels on the
 * chart, never the chart.
 */
export function useZoom(): ZoomState {
  return useContext(ZoomContext);
}

/** `'130%'` — what the footer says while the deck is not at 1×. */
export function zoomLabel(factor: number): string {
  return `${Math.round(factor * 100)}%`;
}
