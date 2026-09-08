# Deck structure — as built

Companion to [narration.md](narration.md), which is the spoken script.

**38 slides, 124 steps, 40-minute slot.** This file was a proposal against a
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

## Still open

1. **Two `<Placeholder>`s remain** — slide 30 step 3 and slide 35 (the joke
   screenshot). `<Flow>` and `<Canvas>`/three both exist in components 0.7.0,
   so slide 30's placeholder is now only a wrapper away; the joke one is a
   missing PNG, and it is the second-to-last thing the audience sees.
2. **Suggested guard rail:** make `scripts/smoke.ts` fail if any slide still
   names `<Placeholder>`. It already parses every slide and reports its
   components, so this is a few lines, and it turns "did I finish the demos"
   into a pre-flight check.
3. **`<Metric>` is still used by no slide.** If any single number goes back on
   screen, that is what it is for.
4. **Act markers.** Seven acts across 38 slides is a lot to hold without
   signposting; cheapest is the act name in the existing footer beside the step
   counter.
5. **Timing.** 38 slides in 40 minutes is tight even speed-running 04–06.
   The cut ladder: slide 27 (four budgets) folds into 07; slide 26 (the loop)
   folds into 34; two of slide 30's four demos are eye candy.
