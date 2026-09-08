// The chrome every demo panel on the showcase slide shares: the line above
// it, and the box it lives in.
//
// **`fill()` is the interesting half.** A demo that names a height is a demo
// with a gap under it, and the gap changes size as the window does — which is
// the one thing a deck whose whole argument is "the desktop decides how big
// this window is" cannot have on screen. So a panel grows instead: `flexGrow`
// down a chain that is unbroken from the window to the chart. `<Markdown>`
// renders a component block as the component itself rather than wrapping it
// in a box, so the demo's own root *is* a flex child of the document, and the
// document is a flex child of the slide.
//
// `height` stays for the workbench, where a story is a fixed viewport and
// "the size a slide would give it" is a number somebody has to name.
//
// `minHeight: 0` is not decoration: a flex item's minimum is its content by
// default, so a panel holding something scrollable would refuse to be shorter
// than the thing inside it and push the deck's own chrome off the bottom.
import type { ReactElement } from 'react';

import type { Style } from 'react-x11/style';

export interface CaptionProps {
  children: string;
  /** 18 is the full-width size; a panel sharing the row passes less. */
  size?: number;
}

/**
 * The line above a demo that says which component is drawing it.
 *
 * It is a subheading rather than a label: on a slide that gives one panel the
 * whole width, the caption is the only thing telling the room what they are
 * looking at, and 12px muted grey — right for a column header — is not that.
 * Shared so the steps agree, since they are consecutive steps of one slide
 * and a size that changes between them reads as an accident.
 */
export function Caption({ children, size = 18 }: CaptionProps): ReactElement {
  return (
    <text style={{ fontSize: size, color: '$textMuted' }}>{children}</text>
  );
}

/** A pinned height, or everything the slide has left. */
export function fill(height?: number): Style {
  return height === undefined
    ? { flexGrow: 1, flexShrink: 1, minHeight: 0 }
    : { height };
}
