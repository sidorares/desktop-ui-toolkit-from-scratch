// The surfaces an app owns *outside* its own windows — and the menu on three
// of them, driven from one array.
//
// Slide 22 is the desktop being read from — the user's calendar, arriving as
// a hook. This is the other direction, and it is the half a browser tab has
// no expression for at all: the app icon, the tray, the desktop's own menu,
// and a banner that outlives every window the app drew.
//
// ## Why the menu is the demo and not a screenshot of one
//
// `MenuBar`'s item vocabulary **is** `com.canonical.dbusmenu`'s — that is not
// a coincidence, it is the design (`react-x11/src/types/components.d.ts`:
// *"the identical array serialises to the desktop's global menu with no
// translation and there is no second authoring model"*). So the same array
// has three destinations and the app picks none of them:
//
//   * on Plasma, Unity or `vala-panel-appmenu`, `globalmenu.js` finds a live
//     owner of `com.canonical.AppMenu.Registrar` and exports it over D-Bus;
//   * on macOS, `cocoa/globalmenu.js` feeds the same `snapshot()` /
//     `IdAllocator` output to `setMainMenu` — the real `NSMenu`, at the top of
//     the screen, outside this window entirely. Its header says the Linux
//     global menu "was built for exactly this moment", and the same builder
//     also fills the Dock menu and the tray's menu: three system menus, one
//     spec;
//   * on stock GNOME nothing owns the registrar name, `exported` stays false,
//     and `<MenuBar>` draws the bar itself — **in this panel**, where the row
//     below will say so.
//
// Which is why the items have to actually work. An `onSelect` that logged
// would prove the serialisation and not the point; these ones call `useNav()`
// (see `nav.tsx`), so picking *Next slide* from a menu this application never
// drew advances the talk.
//
// ## No `shortcut` on any item, on purpose
//
// A `MenuItem`'s `shortcut` is not only the hint drawn down the right of the
// row: `accelerators` defaults to true and the chord is **bound** while the
// menu is mounted (#351). That is a good fact and the wrong place to prove
// it — the deck already dispatches every key itself in `deck.tsx`, and a
// second binding arriving with a slide is a fight to discover on stage. The
// menu is a second route to the deck's own verbs, not a second key map.
//
// ## Where the rows come from, and the one thing they cannot probe
//
// `exported`, `available` and `backend` are all render state the library
// hands over, so the panel reports what happened rather than what platform
// this is. `useDockMenu` is the exception: it returns nothing, so there is no
// per-feature answer for it. It is cocoa-only for the same reason the tray
// is, so the row reads `useTray().available` — which is a real probe of the
// same backend, and the honest caption for it is the one this file has to
// write down rather than infer.
import { useCallback, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import {
  Button,
  MenuBar,
  useDockMenu,
  useNotifier,
  useScreens,
  useTray,
} from 'react-x11';
import type { MenuBarMenu, MenuItem } from 'react-x11';

import { useNav } from '../nav.js';
import { Caption, fill } from './panel.js';

export interface DesktopProps {
  /** Pinned by a story. A slide gives it its natural height — see the note
   *  on the root box below, which is where this demo departs from
   *  `panel.tsx`'s rule that a panel grows. */
  height?: number;
}

/** One destination, and whether this machine had it. */
interface Row {
  /** What the user would call the place it landed. */
  where: string;
  /** The call that put it there. */
  how: string;
  /** What actually happened, in the library's own words. */
  what: string;
  /** `null` where this desktop has no such surface — muted, not red: an
   *  absent tray is a fact about the machine and not a failure. */
  landed: boolean | null;
}

function StatusRow({ row }: { row: Row }): ReactElement {
  const colour =
    row.landed === null ? '$textMuted' : row.landed ? '$success' : '$warning';
  return (
    <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <box
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: colour,
          transition: 150,
        }}
      />
      <text style={{ fontSize: 14, width: 190 }}>{row.where}</text>
      <text
        style={{ fontSize: 13, fontFamily: 'monospace', color: '$accent' }}
      >
        {row.how}
      </text>
      <text style={{ fontSize: 13, color: '$textMuted', flexShrink: 1 }}>
        {row.what}
      </text>
    </box>
  );
}

/** A titled box — the panel chrome both halves of the demo share. */
function Slab({
  title,
  basis,
  grow = false,
  children,
}: {
  title: string;
  /** The width it wants; only the growing half is allowed to exceed it. */
  basis: number;
  grow?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <box
      style={{
        flexGrow: grow ? 1 : 0,
        flexBasis: basis,
        flexShrink: 1,
        minHeight: 0,
        gap: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '$border',
        borderRadius: 8,
        backgroundColor: '$surface',
      }}
    >
      <Caption size={14}>{title}</Caption>
      {children}
    </box>
  );
}

/**
 * `menus` as the tree it is, derived from the value itself rather than typed
 * out beside it. A listing somebody wrote by hand is a listing that can
 * disagree with the menu the desktop is drawing, and on this slide of all
 * slides "these are the same object" is the entire claim.
 *
 * A tree and not a JSX listing on purpose: the slide already carries the
 * source, and what the panel is for is the *shape* that got serialised —
 * which is the shape a menu has.
 */
interface TreeLine {
  text: string;
  kind: 'root' | 'menu' | 'item' | 'rule';
}

function tree(menus: readonly MenuBarMenu[]): TreeLine[] {
  const out: TreeLine[] = [{ text: 'menus', kind: 'root' }];
  menus.forEach((menu, m) => {
    const last = m === menus.length - 1;
    out.push({ text: `${last ? '└' : '├'} ${menu.label}`, kind: 'menu' });
    for (const item of menu.items) {
      out.push(
        item.type === 'separator'
          ? { text: '   ──────────', kind: 'rule' }
          : {
              text: `   ${item.label ?? ''}${item.toggleState === 1 ? ' ✓' : ''}`,
              kind: 'item',
            },
      );
    }
  });
  return out;
}

const LINE_COLOUR: Record<TreeLine['kind'], string> = {
  root: '$textMuted',
  menu: '$accent',
  item: '$text',
  rule: '$border',
};

/**
 * The desktop-integration demo: one item array, mounted into every system
 * surface this machine has, with a live account of which ones took it.
 *
 * Everything here is scoped to the slide. The menu appears in the desktop's
 * bar when this component mounts and is gone when the slide moves on, which
 * is the whole argument for a declared integration rather than a pushed one —
 * `useTray`, `useDockMenu` and `useBadge` all clear themselves on unmount,
 * so there is no take-it-down call for a presenter to forget.
 */
export function Desktop({ height }: DesktopProps): ReactElement {
  const nav = useNav();
  const notifier = useNotifier();
  const screens = useScreens();
  const [exported, setExported] = useState(false);
  const [posted, setPosted] = useState<string | null>(null);

  const position = `${nav.index + 1} / ${nav.total}`;

  const post = useCallback(() => {
    notifier
      .notify({
        summary: 'Making a Desktop UI Toolkit From Scratch',
        body: `Slide ${position} — a banner that outlives every window this app drew.`,
      })
      .then(
        (handle) => setPosted(`posted on the ${handle.backend} rung`),
        (err: unknown) =>
          setPosted(err instanceof Error ? err.name : 'refused'),
      );
  }, [notifier, position]);

  // The one array. `nav` and `fullscreen` are in it, so the menu the desktop
  // is drawing re-serialises when the deck moves — a check mark that stops
  // agreeing with the window is worse than no check mark.
  const menus: MenuBarMenu[] = useMemo(
    () => [
      {
        label: 'Slide',
        key: 'slide',
        items: [
          { key: 'next', label: 'Next slide', onSelect: nav.next },
          { key: 'prev', label: 'Previous slide', onSelect: nav.prev },
          { key: 'sep', type: 'separator' },
          { key: 'first', label: 'First slide', onSelect: () => nav.go(0) },
          {
            key: 'last',
            label: 'Last slide',
            onSelect: () => nav.go(nav.total - 1),
          },
        ],
      },
      {
        label: 'Deck',
        key: 'deck',
        items: [
          {
            key: 'fullscreen',
            label: 'Fullscreen',
            toggleType: 'checkmark',
            toggleState: nav.fullscreen ? 1 : 0,
            onSelect: nav.toggleFullscreen,
          },
          { key: 'sep', type: 'separator' },
          {
            key: 'notify',
            label: 'Post a notification',
            enabled: notifier.available,
            onSelect: post,
          },
          { key: 'sep2', type: 'separator' },
          {
            key: 'reload',
            label: 'Reload slides from disk',
            onSelect: nav.reload,
          },
        ],
      },
    ],
    [nav, notifier.available, post],
  );

  // The Dock menu takes the same items — a right-click on the icon, where the
  // window may not even be on screen, so the slide-navigation half is the
  // half that makes sense there.
  const dockItems: MenuItem[] = useMemo(
    () => menus[0]!.items,
    [menus],
  );
  useDockMenu(dockItems);

  // …and so does the tray, whose title is the position the badge is already
  // showing. Two surfaces, one string, and neither of them is a window.
  const tray = useTray(
    useMemo(
      () => ({
        icon: 'rectangle.on.rectangle',
        title: position,
        tooltip: 'Making a Desktop UI Toolkit From Scratch',
        menu: dockItems,
      }),
      [position, dockItems],
    ),
  );

  const area = screens.primary?.available ?? screens.workArea;
  const full = screens.primary ?? screens.virtual;

  const rows: Row[] = [
    {
      where: 'the desktop’s menu bar',
      how: '<MenuBar menus={…} />',
      what: exported
        ? 'the desktop took it — this app is drawing no bar'
        : 'no registrar answered, so it is drawn below',
      landed: exported,
    },
    {
      where: 'the tray / status bar',
      how: 'useTray({ menu })',
      what: tray.available
        ? `showing ${position}, with the same menu`
        : 'no tray on this backend yet (#353)',
      landed: tray.available ? true : null,
    },
    {
      where: 'the Dock icon’s menu',
      how: 'useDockMenu(items)',
      what: tray.available
        ? 'installed while this slide is up'
        : 'cocoa only — nothing to install here',
      landed: tray.available ? true : null,
    },
    {
      where: 'the app icon',
      how: 'useBadge(value)',
      what: `“${position}” — a string, which only macOS can show`,
      landed: true,
    },
    {
      where: 'a banner, outside every window',
      how: 'useNotifier()',
      what: posted
        ? posted
        : notifier.available
          ? `the ${notifier.backend} rung would answer`
          : 'nothing on this machine can show one',
      landed: notifier.available,
    },
    {
      where: 'where a window may go',
      how: 'useScreens().available',
      what: area
        ? `${Math.round(area.width)}×${Math.round(area.height)} of ${Math.round(full?.width ?? 0)}×${Math.round(full?.height ?? 0)} — the panels taken off`
        : 'no work area published',
      landed: area ? true : null,
    },
  ];

  return (
    // Not `fill()`'s growing half, and this is the one demo on the deck that
    // should not grow. The panel's content is six status rows and a menu:
    // stretched down a slide it becomes a table with the middle missing,
    // and the space it would claim reads as something failing to load. So it
    // takes its natural height and leaves the rest of the slide empty, the
    // way a paragraph does. `height` still goes through `fill()` for a story.
    <box style={{ ...(height === undefined ? {} : fill(height)), gap: 16 }}>
      <box style={{ flexDirection: 'row', gap: 16, minHeight: 0 }}>
        <Slab title="the array" basis={300}>
          <box style={{ gap: 3 }}>
            {tree(menus).map((line, i) => (
              <text
                key={`${i}:${line.text}`}
                style={{
                  fontSize: 14,
                  fontFamily: 'monospace',
                  color: LINE_COLOUR[line.kind],
                }}
              >
                {line.text}
              </text>
            ))}
          </box>

          {/* Rendered here on purpose. On a desktop that took the menu this
              draws nothing at all — `MenuBar`'s own fallback never runs once
              `useGlobalMenu` reports `exported` — so the bar appearing in
              this panel *is* the "and where none does" branch, arriving in
              the place the room is already looking. */}
          <MenuBar menus={menus} onGlobalMenuChange={setExported} />
          {exported ? (
            <text style={{ fontSize: 13, color: '$accent' }}>
              …and it is not drawn here, because the desktop took it.
            </text>
          ) : null}
        </Slab>

        <Slab title="everywhere it went" basis={0} grow>
          <box style={{ gap: 16 }}>
            {rows.map((row) => (
              <StatusRow key={row.where} row={row} />
            ))}
          </box>
          {/* Takes whatever the taller slab beside it made spare, so the two
              line up at the bottom without the rows drifting apart. */}
          <box style={{ flexGrow: 1, minHeight: 8 }} />

          {/* The button is in the panel rather than under it because the
              sentence beside it is about the panel: every one of those rows
              has a route that is not this window, and the notification is
              the only one a presenter can fire on demand. */}
          <box
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderColor: '$border',
            }}
          >
            <Button
              onPress={post}
              disabled={!notifier.available}
              style={{ flexShrink: 0 }}
            >
              Post a notification
            </Button>
            <text style={{ fontSize: 14, color: '$textMuted', flexShrink: 1 }}>
              Or pick it from the menu the desktop is drawing — and pick “Next
              slide” from there too. Nothing in this window is being clicked.
            </text>
          </box>
        </Slab>
      </box>
    </box>
  );
}
