// The progress bar, made a control: point at it to see which slide is under
// the pointer, click to go there.
//
// **The hit area is not the bar.** The bar is two pixels tall, which is a fine
// thing to look at and an impossible thing to hit — so the interactive box
// carries vertical padding and the lines sit inside it. Roughly nine pixels of
// slack either side, which is the difference between a control and a dare.
//
// **The hover state lives here, not in `<Deck>`.** `onMouseMove` fires all the
// way across the footer, and a `useState` up in the deck would re-render the
// slide on every one of them — on the terminal slide, re-rendering a live
// shell because the pointer moved. So this component owns the state and the
// bar markup both, and a pointer sweep repaints the footer and nothing else.
// Same reasoning as `pacemaker.tsx`, for the same reason.
//
// **The label is a fixed width with centred text**, which is what makes the
// clamp exact: a self-sizing bubble would have to be measured before it could
// be kept on screen, and the first frame of every hover would be in the wrong
// place. A known width clamps arithmetically and is never wrong.
//
// It is drawn rather than being a `<Tooltip>` on purpose. A tooltip anchors to
// its trigger and waits half a second; a scrub label belongs *above the
// pointer* and has to keep up with it, which is the seek preview every video
// player has taught the room to expect.
import { useState } from 'react';
import type { ReactElement } from 'react';

import { PaceLine } from './pacemaker.js';
import type { Slide } from './slides.js';

/** Wide enough for a number and a trimmed title, and pinned so the clamp is
 *  arithmetic rather than a measurement. */
const LABEL = 260;
const TITLE_MAX = 34;

export interface ScrubberProps {
  slides: Slide[];
  index: number;
  /** Where a click goes. `<Deck>`'s own `go`, which clamps and resets step. */
  onSeek: (to: number) => void;
  px: (n: number) => number;
}

export function Scrubber({
  slides,
  index,
  onSeek,
  px,
}: ScrubberProps): ReactElement {
  // The track's own width, needed to turn a pointer offset into a slide. One
  // update per resize or zoom, not per frame.
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  const last = Math.max(1, slides.length - 1);
  const progress = slides.length > 1 ? index / last : 1;

  /** Which slide sits under an offset into the track. Rounds, because the
   *  fill maps slide `k` to exactly `k / (n - 1)` — so rounding is the
   *  inverse of the mapping rather than an approximation of it. */
  const slideAt = (localX: number): number => {
    if (width <= 0) return index;
    const fraction = Math.min(1, Math.max(0, localX / width));
    return Math.round(fraction * last);
  };

  const target = hover === null ? null : slides[hover];
  const title = target
    ? target.title.length > TITLE_MAX
      ? `${target.title.slice(0, TITLE_MAX - 1)}…`
      : target.title
    : '';

  // Centre the label on the pointer, then keep it inside the track. Both ends
  // clamp, so slide 1 and slide 40 read as easily as the middle.
  const centre = hover === null ? 0 : (hover / last) * width;
  const left = Math.min(Math.max(centre - LABEL / 2, 0), Math.max(0, width - LABEL));

  return (
    <box
      style={{
        flexGrow: 1,
        // The hit area. See the note above: the bar is two pixels.
        paddingTop: px(9),
        paddingBottom: px(9),
        justifyContent: 'center',
        gap: px(3),
      }}
      onLayout={(ev) => {
        const w = Math.round(ev.width);
        if (w !== width) setWidth(w);
      }}
      onMouseMove={(ev) => {
        const at = slideAt(ev.localX);
        if (at !== hover) setHover(at);
      }}
      onMouseLeave={() => setHover(null)}
      onClick={(ev) => onSeek(slideAt(ev.localX))}
    >
      {/* Where the slides have got to. */}
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

      {/* Where the clock has. Same track width, deliberately — see
          `pacemaker.tsx`. */}
      <PaceLine progress={progress} px={px} />

      {/* Above the bar and out of the flow, so it cannot move the lines it is
          describing. */}
      {hover !== null && target ? (
        <ScrubLabel
          number={hover + 1}
          title={title}
          here={hover === index}
          left={left}
          px={px}
        />
      ) : null}
    </box>
  );
}

/**
 * The bubble. Its own component partly for shape and partly so a test has
 * something to ask for by name — the number in it is a bare integer, and a
 * query for "17" would find the 17 in whatever slide is behind it.
 */
function ScrubLabel({
  number,
  title,
  here,
  left,
  px,
}: {
  number: number;
  title: string;
  /** The slide the deck is already on, which is worth colouring. */
  here: boolean;
  left: number;
  px: (n: number) => number;
}): ReactElement {
  return (
    <box
      style={{
        position: 'absolute',
        bottom: px(20),
        left: px(left),
        width: px(LABEL),
        alignItems: 'center',
      }}
    >
      <box
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: px(7),
          paddingLeft: px(9),
          paddingRight: px(9),
          paddingTop: px(4),
          paddingBottom: px(4),
          borderRadius: px(5),
          borderWidth: 1,
          borderColor: '$border',
          backgroundColor: '$surface',
        }}
      >
        <text
          style={{
            fontSize: px(12),
            fontFamily: '$monoFamily',
            color: here ? '$accent' : '$text',
          }}
        >
          {String(number)}
        </text>
        <text style={{ fontSize: px(12), color: '$textMuted' }}>{title}</text>
      </box>
    </box>
  );
}
