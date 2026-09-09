# Deck structure — as built

Companion to [narration.md](narration.md), which is the spoken script.

**41 slides, 145 steps, 40-minute slot.** This file was a proposal against a
24-slide deck; PRs #1 and #2 then landed eight demo slides, so most of the
original reordering argument is obsolete and has been dropped rather than
forced onto a deck that had already moved. What survived, what was added, and
what is still open are below.

## Versions

| | was | now |
| --- | --- | --- |
| `react-x11` | 2.9.0 | **2.10.1** |
| `@react-x11/components` | 0.6.0 | **0.7.0** |
| `@react-x11/workbench` | 0.2.0 | 0.2.0 — current |

**0.7.0 removed the `desktop-calendar` subpath.** It was not deleted — react-x11
2.9.1 promoted it into **core**, because reading the user's calendar is one of
the things an app does outside its own windows, like notifications and the tray,
and the macOS rung of that ladder reaches EventKit through `@windowkit/appkit`,
which only core can see. `src/components/booking.tsx` now imports `byDay` and
`DesktopEvent` from `react-x11`; nothing else changed.

That is slide 26's loop having happened to this deck between two `npm install`s,
and it is worth a sentence on stage.

## The act structure

| act | slides | the question it answers |
| --- | --- | --- |
| Cold open | 0–1 | what am I looking at? |
| **I — the wire** | 2–10 | **why** is this possible? |
| **II — belonging** | 11–12 | **why** bother, rather than using a browser? |
| **III — the programming model** | 13–23 | **what** do you write, and **how** does it work? |
| **IV — mechanism** | 24–26 | **how** does an update actually travel? |
| **V — performance** | 27–30 | **how** is it fast, and what transfers to my job? |
| **VI — what it cost** | 31–36 | **what** did it take, honestly? |
| Close | 37 | |

## The desktop-integration slide — 23

Added after the calendar, and deliberately as its pair: **22 is the desktop
being read from, 23 is writing to it.** Slide 12 said belonging is a dozen
protocols you have to speak and never showed one as an API; `createRoot()`
(19) paid off three of them as default arguments; nothing said *here is the
one-line hook, and here is where it does nothing.*

Four steps under `reveal: replace`:

| | |
| --- | --- |
| 1 | the inventory — seven surfaces outside your own windows, one hook each, and the point that every one is **declared rather than pushed** |
| 2 | **one array, three destinations.** `MenuBar`'s items *are* dbusmenu's vocabulary, so the same array reaches a D-Bus registrar, `setMainMenu`, or the drawn bar — and the app branches on `exported`, never on the platform |
| 3 | where it is empty, which is what makes the rest believable: the tray is the most Linux-shaped thing on the list and react-x11 has it **only on macOS** (#353); the badge is the mirror image, so this deck's own `23 / 41` shows nothing on Linux |
| 4 | `<Desktop />`, live |

The demo mounts `<MenuBar>`, `useDockMenu` and `useTray` from one array, so
on the presenting machine the menu is in the **real macOS menu bar**, a
status item and the Dock icon at once — and picking *Slide → Next slide*
from there advances the talk. That needed a seam: `src/nav.tsx`, the deck's
own navigation verbs as a context, because a component named in markdown
cannot be handed props. `src/main.tsx` now passes `cocoa.appName`, without
which the menu the room is asked to look at is called **node**.

The panel does **not** grow into the slide, which is the one place it departs
from `panel.tsx`'s rule. Six status rows stretched down a slide read as a
table with the middle missing.

**It costs three minutes the deck did not have** — see [Timing](#timing--the-honest-version).
The cut ladder below is where that comes from; this slide is a better three
minutes than the four-budgets slide, but that is a decision, not a fact.

## What was added this round

| # | slide | why |
| --- | --- | --- |
| 04 | **Ids you invent yourself** | the handshake hands over a *range*; ids are futures minted locally, so naming a thing costs no round trip. Pays off directly on slide 08, whose notes say to read the `AllocID` line out loud |
| 05 | **What a window actually is** | a rectangle in a tree, a paint surface, an event source — and nothing else. Ends on *why react-x11 makes one window and paints the rest*, which sets up both the roadblock and Cocoa |
| 06 | **Atoms, properties, selections** | server-side constants, typed blobs on a window, and a clipboard that is a negotiation rather than a buffer. Lands on *X11 ships no policy* — so every desktop convention is an agreement, which is slide 11's whole argument |
| 14 | **The whole program** | ten minutes of toolkit talk and no program had been shown. `createRoot` → `<window>` → `render`, and the point that **`<window>` is in the tree**, from which multi-window and popups fall out for free |
| 15 | **What `createRoot()` did first** | the payoff for slide 11's list: three protocol clients started before your first render, and `{ desktop: false }` to prove the list is engineering rather than a brochure |
| 23 | **The ecosystem** | `<Flow>` over the real dependency graph — see below |
| 33 | **Eleven quiet years** | the chart, split back off the timeline (see below) |

## Slides rewritten from the narration

The prose, not the order. Each of these led with an example and now leads with
the argument:

| # | slide | what changed |
| --- | --- | --- |
| 03 | X11 is a protocol | the two consequences are separate steps, because they are separate arguments; 1987-across-a-campus is now the *reason* the protocol is asynchronous rather than colour |
| 04 | node-x11 | ends on *"opening a window is not a toolkit. So what is?"* — the hinge into slide 12 |
| 12 | the easy 20% | the see/speak table: six desirable properties became a right-hand column of actual protocols. The notes carry the module names, so the list is answerable rather than assertable |
| 14 | React needs a host | *"the reconciler is a protocol too"*, and the DOM's silent work moved here from the layers slide |
| 17 | it reads like the web | **the biggest rewrite.** Was a JSX blob plus a vocabulary list; now the design goal, then what the architecture *forced* (no cascade → pseudo-states in the object; panes not screens → container queries are the primitive), then what it costs |
| 21 | your tooling still works | **was duplicating slides 22 and 23.** It listed DevTools and Fast Refresh, which the next two slides then demonstrated. Now it is the *why* — the tools speak protocols, so a renderer qualifies rather than implements — plus alt-click-to-source, the one thing with no demo of its own |
| 25 | the pipeline | *why* layout is client-side (a round trip per string measurement) rather than the bare fact that it uses yoga |
| 30 | every optimisation was "don't" | four refusals, **one per budget**, which is what makes them a set rather than a list of tips — and the setup slide for 31 |
| 31 | the demos | retitled *"Two of the four, running"*, placeholders gone, charts launcher added |

Slides 04–06 sit **before** the visualizer and the three `<Wire>` demos, so
every concept is spoken before it is watched on the wire. That is the one idea
from the original proposal that mattered and it survived intact:
**say it, then show it.**

## The ecosystem graph

`src/components/ecosystem.tsx` — thirteen nodes, hand-placed, read off
`node_modules` rather than remembered. `A → B` means *A depends on B*.

**Three tiers, not two.** "Pure JS vs compiled" is the split the talk cares
about, but drawn honestly it has a middle:

| | |
| --- | --- |
| green | pure JavaScript — node-x11, ntk, react-x11, dbus-native, components, workbench, the visualizer, react-reconciler |
| amber | `yoga-layout` — compiled, but ships as **base64-inlined WASM**: no toolchain, no `node-gyp` |
| red | `@windowkit/appkit` and `node-x11-dri` — compiled binaries (`gypfile: true`) |
| grey | the X server and react-devtools — not dependencies at all |

That middle tier is the whole reason "no binary modules" survived fifteen
years, and why breaking it for AppKit was a decision rather than a slide. The
reveal dims everything JavaScript and leaves **three** nodes lit — one WASM,
one optional for GL, and one that bought macOS. Colouring yoga the same red as
AppKit would tell that story wrong.

Two edges are dashed and headless because they are **not** dependencies: the
visualizer sits *on* the wire when `DISPLAY` points at it, and react-devtools
is joined by a websocket on `:8097` and nothing else.

The visualizer also *depends* on react-x11 — its own UI is a react-x11 app,
which is the nicest fact about it — and **that edge is deliberately not drawn**:
it crossed the entire diagram diagonally to reach react-x11 in the middle and
cost more legibility than the loop was worth. It is a line in the speaker notes
and a phrase in the node's description instead.

## The numbers, cut down

A count is a claim about effort; the shape is a claim about what changed, and
only the shape earns stage time.

**Cut:** the `<Stats />` grid entirely; *"across seven repositories, 23 July –
9 September"*; *"371 of them arrived after 23 July"*; *"sat at 32 commits for
eleven years"*.

**Kept:** the timeline (slide 32) and the axis rescale (slide 33) — the
defensible exception, because the room *watches* the y-axis break under 2026
rather than being read a figure. One number said out loud: **"seven weeks."**

Those are **two slides, not one.** Merging them was tried and rendered as an
overflow — the ten-row timeline plus a 260px chart runs off the bottom edge.
The thing to cut was the grid, not the chart.

`STATS.commits` / `prs` / `newRepos` / `revivedRepos` are now referenced by no
slide. Worth keeping in `src/data.ts` as the answer to a question from the
floor, but they should not go back on screen.

## Placeholders and the joke — all resolved

**Zero `<Placeholder>` left on any slide**, and `scripts/smoke.ts` now exits
non-zero if one comes back.

- The **joke slide is gone**. It was the one slide whose content was a
  screenshot nobody had taken, and it was the second-to-last thing the room
  would see.
- The perf demo slide's two placeholders were **already covered**. Slide 19
  step 5 is `<Flow>` panning and zooming over a subtree scale, and step 7 is
  the GL scene on `<glarea>` — which is one `CallList` a frame. Those are
  exactly "don't redraw what did not move" and "don't send it twice", already
  demonstrated with better demos than the placeholders described. So slide 31
  runs **two** of the four refusals and points back at 19 for the others.
- `<Placeholder>` the component stays. It is genuinely useful while writing;
  the smoke guard is what stops it shipping.

## The charts launcher — slide 31

The panel on that slide draws this deck's commit history: a few dozen points,
the right size for a slide and the wrong size for the claim. "Cost follows
pixels, not points" is only interesting at a scale a slide cannot hold, and
only *believable* with a frame counter and a byte count beside it.

So the button starts `@react-x11/components`' own `examples/charts.tsx` —
copied in, import repointed at the published package — **in its own window**:
a million-point series through per-column min/max spans, a streaming section
appending sixty points a second, small multiples at 90px, and a HUD under each
chart printing the last frame's mode, span, command count and estimated wire
bytes. Zoom the million and the byte count does not move.

Separate process for two reasons: it needs its own connection and frame clock
or the HUD reports *this deck's* frames, and a demo that can wedge itself on a
million points should not be able to take the talk down with it.

## The coherence pass

A read of the whole deck end to end, as prose rather than as slides. Eight
things were wrong and most were invisible one slide at a time — the full list
is in the `fix(slides)` commit. The two that mattered:

**Two promises the deck did not keep.** Slide 4 asked *"so what is a
toolkit?"* and then spent seven slides on the protocol before answering it on
12. And slide 15 promised *"six good reasons"* it was a bad idea and never
enumerated them — the reasons are slide 16's list of everything the DOM was
doing for you, so it now says the bill arrives next, and it does.

**Three things said twice.** The showcase had three consecutive steps titled
"A series, a sequence, a graph" — under `reveal: replace` the heading is the
only thing that changes, so an identical one three times reads as a stuck
deck. `<HtmlPlayground>`'s slide duplicated showcase step 2, which already has
`<Html>` behind a tab. And the calendar slide's prose duplicated the
component's own panel.

**`src/acts.ts`** — the footer now carries the section name beside the
counter, changing eight times across the talk. `23 / 38` tells a presenter how
much is left and an audience nothing at all. A range table rather than
frontmatter, because an act is a property of the *order*: inserting a slide
should move the boundary after it, which an index range does for free and a
per-file key gets silently wrong.

## Timing — the honest version

The acts add up to **50 minutes** with slide 23 in them, which does not fit a
40-minute slot.
[narration.md](narration.md) ends with a five-step cut ladder that lands 39
minutes with the spine intact; deciding those cuts now beats discovering them
at minute 35. In order: three showcase steps, the atoms slide, the wire-events
slide, the four-budgets slide, and — painfully, only if you are at minute 30
with eight slides left — Fast Refresh.

## Components with no slide

`<HtmlPlayground>`, `<Stats>`, `<Metric>` and `<Placeholder>` are in the map
and on no slide. All four are deliberate: the playground's slide was pruned
and is one `git revert` away, `<Stats>` and `<Metric>` are what a number would
come back as if one ever should, and `<Placeholder>` is for writing, which the
smoke guard is what makes safe.

## Still open

1. **`<Metric>` is used by no slide.** If any single number goes back on
   screen, that is what it is for.
2. **Act markers.** Seven acts across 41 slides is a lot to hold without
   signposting; cheapest is the act name in the existing footer beside the step
   counter.
3. **Timing.** 41 slides in 40 minutes is tight even speed-running 04–06.
   The cut ladder: slide 32 (four budgets) folds into 08; slide 28 (the loop)
   folds into 35.
4. **Slide numbers in this file and in `README.md` had already drifted** — both
   were written against earlier orderings and neither agrees with the
   filenames. Inserting 23 did not cause that and has not fixed it; the counts
   above are the real ones, the cross-references are not.
