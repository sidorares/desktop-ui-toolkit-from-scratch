// Where the deck can be driven from, by something that is not the keyboard.
//
// `<Scrubber onSeek>` gets the deck's navigation as a prop, because `<Deck>`
// renders it directly. A demo cannot be handed the same thing: it is *named*
// in a slide's markdown and mounted by `<Markdown>` several layers down, with
// no props of its own. So navigation is a context for exactly the reason the
// step is one (`steps.tsx`) — the value belongs to the deck and the reader
// is somewhere inside a document.
//
// **The desktop-integration slide is why this exists.** A menu item that the
// *desktop* drew — in the macOS menu bar, in the Dock menu, behind a status
// item — has to be able to advance the talk, or the demo is a picture of a
// menu rather than a menu. There is no way to get from an `onSelect` in
// `com.canonical.dbusmenu`'s item vocabulary back to `<Deck>`'s `go` except
// through something like this.
//
// Everything here is a callback rather than a setter: a demo may ask the deck
// to move and may read where it is, and cannot reach its state. That is the
// same bargain `onSeek` struck, written once for every future caller.
import { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';

export interface NavState {
  /** 0-based, matching the footer's `index + 1`. */
  index: number;
  total: number;
  /** Every slide's title, in order — for a menu that offers them. */
  titles: readonly string[];
  /** Clamped by `<Deck>`, so `go(-1)` and `go(999)` are both safe. */
  go: (to: number) => void;
  /** The next and previous *slide*, whatever step it is on — `→` and `←`. */
  next: () => void;
  prev: () => void;
  /** What the window manager has been asked for, and the ask again. */
  fullscreen: boolean;
  toggleFullscreen: () => void;
  /** Re-read `slides/` from disk — what `r` does. */
  reload: () => void;
}

/**
 * Inert by default, so a component that reads it renders in the workbench —
 * where there is no deck at all — instead of throwing. A story previewing
 * the desktop slide gets a menu whose items do nothing, which is the right
 * answer: there is nothing for them to do.
 */
const NavContext = createContext<NavState>({
  index: 0,
  total: 1,
  titles: [],
  go: () => {},
  next: () => {},
  prev: () => {},
  fullscreen: false,
  toggleFullscreen: () => {},
  reload: () => {},
});

export function NavProvider({
  value,
  children,
}: {
  value: NavState;
  children: ReactNode;
}): ReactElement {
  return <NavContext value={value}>{children}</NavContext>;
}

/** The deck, as a demo may drive it. */
export function useNav(): NavState {
  return useContext(NavContext);
}
