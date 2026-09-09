# Making a Desktop UI Toolkit From Scratch

A talk for MelbJS about [react-x11](https://github.com/sidorares/react-x11) —
presented in an app built with react-x11.

The deck is an X11 client. The slides are markdown; the demos are live
components; the terminal on slide 2 is a real shell, slide 19 is the
component library demonstrating itself, and slide 20 reads the calendar the
desktop already has.

## Running it

```bash
npm install
npm start        # node, through tsx
npm run start:bun
```

**Either runtime works, and the launcher slides adapt to which one you used.**
That is not cosmetic: the buttons on the wire, DevTools, Fast Refresh and
charts slides spawn child processes, and they used to spawn
`process.execPath` — which under `bun src/main.tsx` is *bun*, so every one of
them ran `bun --import tsx …` and died on a Node loader bun does not want.
`src/runtime.ts` resolves it per example now: bun runs TS and JSX with no
loader at all, Node gets `--import tsx` only for files that need it, and the
command printed on the slide is derived from the same call so it cannot drift
from the one that ran.

**Fast Refresh is the exception and needs Node.**
`react-x11/refresh/register` uses Node's `module.registerHooks`, which bun
does not implement, so that one launcher asks for `node` by name even when the
deck itself is bun. On a machine with no `node` on `PATH` it fails in the
panel like any other launcher.

```bash
npm run check:launchers   # what each one resolves to, and whether it starts
```

On macOS this runs on react-x11's native Cocoa backend, which is the one to
present on. XQuartz is available as an alternative — see
[Fidelity](#fidelity) — and is worth knowing about but not worth arranging:

```bash
npm run x11
```

## Keys

| key | |
| --- | --- |
| `←` `→` | previous / next **slide** |
| `↑` `↓` | previous / next **step** within a slide |
| `space` | advance — step, then slide |
| `Page Up` `Page Down` | previous / next slide |
| `Home` `End` | first / last slide |
| `f` | toggle fullscreen (asks the window manager) |
| `Esc` | hand the keyboard back to the deck, else leave fullscreen |
| `r` | re-read `slides/` from disk (saves reload on their own) |
| `p` | start the **pacemaker**, then pause / resume it |
| `P` | reset the pacemaker to zero |
| `⌘+` `⌘-` | **bigger** / **smaller** — `Ctrl` too, for a Linux desktop |
| `⌘0` | back to 100% |

Stepping back off the front of a slide lands on the **last** step of the one
before it, so rehearsing backwards works.

`slides/` is watched, so writing the talk is a save away from seeing it: the
deck re-reads the directory and stays exactly where it was — same slide, same
step, same zoom. Editing `src/` is a restart, since that is code; `npx tsx
watch src/main.tsx` will do it for you, at the cost of a new window each
time.

**A demo that has the keyboard keeps it.** Click the terminal on slide 2 and
you are typing into bash: `space` is a space, `f` is an `f`, and the deck
does not move. `Esc` hands the keyboard back — so does clicking anywhere off
the demo — and then the deck's keys are the deck's again. Zoom is the
exception, because `⌘+` is an accelerator: those run *after* the focused
element has had its refusal, so the room can be adjusted mid-demo.

**Coming back to the deck means the deck has the keyboard.** macOS hands the
click that reactivates a window straight to whatever is under the pointer —
ntk asks for that, because on X11 a click on an unfocused window acts rather
than only focusing — so clicking back from an editor onto a slide running a
terminal would otherwise land *inside* the demo, and the arrow keys would
stop being the deck's. Activating the window clears the focus instead, and
the click that activated it is spent doing so. The way into a demo is a
click made while the deck already has the keyboard.

## Pacing

`p` starts a second progress line under the first one, and it fills once over
**forty minutes**. Press it again to pause — for a question, or an
interruption — and again to resume; `P` puts it back to zero for the next
rehearsal.

**The point is the gap between the two lines, not either line on its own.**
The top one is where the slides have got to; the bottom one is where the clock
has. If the bottom line is ahead of the top one, you are behind. That is a
question a digital clock in the corner cannot answer without arithmetic
performed on stage.

The colour says it again for the back of the room, where two-pixel lines are
hard to compare: muted while the two are within two minutes of each other,
amber once the clock is meaningfully ahead, red once the slot is gone. The
number beside it is time **remaining**, because "eleven minutes" is a decision
and "twenty-nine minutes elapsed" is a subtraction.

Nothing is drawn until it is armed, so a talk given without it looks exactly
as it did before — and the two pixels are reserved either way, so pressing `p`
mid-sentence does not reflow the slide above it.

The clock is derived from a wall-clock start rather than counted in ticks, so
a dropped timer or a machine that slept does not show up as drift.
`npm run check:pace` asserts that, along with pause banking time instead of
losing it and the colour thresholds firing where they should.

## Size

How big the deck has to be is a fact about the room, learned about ten
seconds before the talk starts, so it is a key. `⌘+` steps up a ladder of
sizes — 80%, 90%, 100%, 115%, 130%, 150%, 175%, 200% — and the footer says
where it is whenever that is not 100%. (`⌘=` is the same binding: `+` is a
shifted `=` on most layouts, and both spellings are bound, on `⌘` *and*
`Ctrl`.)

**The window does not resize; the content reflows inside it.** That is the
difference between this and the display scale react-x11 resolves per
connection: turning *that* dial would be the app claiming the panel had
changed, and the window would grow to cover more of the screen with not one
line rewrapped. Here the window stays where the window manager put it, and a
bullet that fitted on one line takes two.

What scales is the type and the space around it — prose, headings, code, the
chrome, and anything a demo draws that inherits its size, down to a chart's
axis labels. A terminal at 150% is the same pane with larger characters and
fewer of them, which is what `⌘+` does to every other terminal on the machine.

A demo that names a `height` does **not** scale with it, and should not: that
number is a share of a window zoom does not resize, so growing it only pushes
the slide's own chrome off the bottom edge. Which is why the showcase demos
name no height at all. They grow instead — `flexGrow` down a chain that is
unbroken from the window to the chart, because `<Markdown>` renders a
component block as the component itself rather than wrapping it in a box.
A panel is then the same panel fullscreen, in whatever window the window
manager felt like, and at any zoom, with no gap under it. `height` survives
as a prop for the workbench, where a story is a fixed viewport and somebody
has to name a number.

## On the Dock

The deck badges its own icon with where the talk has got to — `11 / 37`, the
same string the footer carries — through react-x11's `useBadge`. So the
position is readable from the Dock with something else in front of the deck,
which is the case a presenter is actually in: notes on one screen, the deck
on the other. It is declared rather than pushed, so the badge is up for
exactly as long as `<Deck>` is mounted and gone when it is not.

A **string** badge is a macOS-shaped choice, and worth knowing about. The
Dock tile takes any label; the freedesktop protocol a Linux launcher listens
to carries a *count* and has no text field at all, so on that desktop
nothing is shown — silently, because a badge is not a feature an app should
branch on. The position stays in the footer, where it always was.

## Writing a slide

One file per slide in `slides/`, ordered by filename. Frontmatter is
optional:

```mdx
---
title: What a desktop toolkit is
notes: |
  Speaker notes. Two spaces of indent, any number of lines.
---

# The heading

A first point.

^^^

A second point, revealed on the next step.
```

A line of `^^^` on its own is a **reveal marker**. Steps are counted from
them — three markers is four steps — so adding a beat is adding a line, and
nothing declares a step count anywhere. A `^^^` inside a fenced code block
is left alone.

Reveals are cumulative by default: step *n* shows everything up to and
including part *n*. A slide that runs one demo at a time wants the other
model, and asks for it in frontmatter:

```markdown
---
reveal: replace
---
```

Then each step shows only its own part. Four charts stacked down the screen
are not four steps of a demo.

Other frontmatter keys: `title` (defaults to the first heading, then the
filename), `notes`, and `layout` — `default`, `title` (vertically centred,
larger type) or `full` (no padding, for a slide that is all demo).

## Components in a slide

A slide names a component and gets one — `@react-x11/components` 0.6.0's
MDX, on `<Markdown>`'s `components` prop:

```mdx
Everything on this slide is drawn by the toolkit the talk is about:

<Terminal height={300} command={["bash", "-lc", "yes hello | head -20000"]} />
```

A tag is a component **iff its name is a key in the map**, which lives in
[`src/prose.tsx`](src/prose.tsx). Anything else — `<Unclaimed />`, a stray
`<` — is the literal text it looks like, so prose about `<box>` and `<text>`
stays prose. Attributes are strings, `true`, or JSON, which is what lets a
shell one-liner keep its quotes and its pipe.

| component | what it is |
| --- | --- |
| `<Charts>` | react-x11's commit history, drawn by react-x11 |
| `<Timeline>` | the dates, as a shape rather than a list |
| `<Stats>` | the four totals, in a row |
| `<Metric>` | one number, said loudly |
| `<Terminal>` | a real shell, on the in-process vt backend |
| `<HtmlPlayground>` | `<CodeEditor>` and `<Html>`, split — type markup, see it rendered |
| `<Wire>` | a node-x11 example, and a button that runs it through x11vis |
| `<DevTools>` | starts React DevTools, then an app with the bridge on |
| `<HotReload>` | starts an app under the refresh loader, and edits its source |
| `<ChartsDemo>` | a button that opens the charts example in its own window |
| `<Placeholder>` | a box the size a demo will be, for one that isn't built — **no slide may ship naming it**, see [Smoke](#smoke) |
| `<Widgets>` | core's controls, a variable font's axes and an `<svg>`, on one wire |
| `<Documents>` | markdown, maths and HTML behind one strip of `<Tabs>` |
| `<DataViz>` | `panel=` a series, a sequence, or the architecture graph |
| `<Scenes>` | `panel=` a live map, or a GL scene beside its own source |
| `<SourceCode>` | a file off disk, highlighted — the demo's own, usually |
| `<Booking>` | a flight booking that reads the desktop's calendar |

`<DataViz>` and `<Scenes>` are five of slide 19's seven steps, one `panel`
each; `<Booking>` is slide 20. Between them the showcase is every component
this talk claims: `<box>`, `<text>`, `<textinput>` and core's widgets;
variable-font axes read off the font file; `<svg>`; `<Markdown>`, `<Formula>`
and `<Html>`; `<Tabs>`; charts, the timeline, the flow pane with three nodes
that are forms, the map, a GL scene, and the calendar. Grouped rather than
listed, because a step that makes three claims at once beats three steps.

Two of them are worth knowing about on their own. `<SourceCode>` reads a file
from the repo — anchored on *text* rather than line numbers, so a slice
survives an edit above it — which is how the scene demo shows the code it is
running from without a second copy to go stale. And `<Booking>` takes its
calendar events as a **prop**: on the slide that is a fixture, in an
application it is `useDesktopCalendarEvents().events`, and since the
integration arrives through `<Calendar dayContent>` the grid cannot tell the
difference — so the demo needs no calendar service configured in the room.

Components read `useStep()`, so one of them can be both halves of a point:
`<Charts revealAt={1} />` shows eleven quiet years, then rescales its axis
under 2026 when the slide steps. `revealAt={0}` opts out.

Slides can also **compute**, because `prose.tsx` passes a `scope`:

```mdx
# 15 years, and then {stats.days} days

react-x11 sat at **{stats.quietYears} commits** for eleven years.
```

Those come from [`src/data.ts`](src/data.ts), so the chart and the sentence
beside it cannot disagree — which matters for numbers that appear on three
slides and get asked about afterwards. Passing `scope` is safe here only
because these slides are ours; the same prop pointed at a document somebody
else wrote would be handing it `new Function`.

## Demos that start other programs

Four slides run something that is not the deck: the DevTools pair (slide 17),
the hot-reload example (18), and the three protocol slides (6–8). Each has a
button, and beside the button are the commands it runs — the button is the
convenience, the commands are the point, and a demo whose button does not
work is still a slide you can talk from.

They all behave the same way. The children are spawned **detached, in their
own process group**, so stopping one stops what it started (`react-devtools`
is a node script that spawns Electron as a child, and signalling the script
alone would leave the window behind); closing the deck takes them with it.
And because `<Prose>` is remounted on every keypress, the processes are held
in a module-scope store rather than in component state — stepping away from a
slide and back finds the demo still running.

**React DevTools** (22) — `npm run devtools`, then `npm run example:devtools`. The
button does both, in that order, because the backend connects to a socket
that has to already be listening. The deck cannot inspect *itself*:
`REACT_X11_DEVTOOLS` is read before React's first commit, so what opens is a
second app, [`examples/devtools-demo.tsx`](examples/devtools-demo.tsx). The
three packages it needs — `react-devtools`, `react-devtools-core`, `ws` — are
devDependencies, so `npm install` has them; the first drags in Electron, which
is most of the install. A DevTools already listening on 8097 is used as it
stands rather than replaced.

**Hot reload** (23) — `npm run example:hot`. The second button rewrites two marked
lines in [`examples/hot-demo-app.jsx`](examples/hot-demo-app.jsx), which is a
save like any other: the loader's watcher applies it, and the count and the
half-typed text on screen do not move. The variants cycle and the third press
restores the committed text, so a full cycle leaves the working tree clean —
`git diff` if you have been rehearsing. The example is two files because a
module is a refresh boundary only when *every* export of it is a component:
the components are in `hot-demo-app.jsx`, and `hot-demo.jsx` does the
mounting, which must not run twice. The toolchain — `@babel/core`,
`@babel/plugin-transform-react-jsx`, `hot-module-replacement`, `react-refresh`
— is react-x11's optional peers, carried here as devDependencies.

**The wire** (6–8) — `DISPLAY=127.0.0.1:1 node examples/x11/window.js`, with
[x11vis](https://github.com/sidorares/x11-protocol-visualizer) listening on
6001. Two things are not in this repo. The visualizer is not published, so it
is looked for rather than installed: `X11VIS` names it outright, else a
`node_modules` install, else a sibling checkout beside this one (which is
what a machine with all seven repositories looks like). And the proxy
forwards to a **real X server**, so `$DISPLAY` has to point at one — XQuartz,
on a mac. Without either, the panel says which is missing instead of failing
quietly. `X11VIS_PORT` moves the port; one already listening is reused, and
left alone by Stop, so a visualizer you started by hand stays yours.

Rehearse each of them once on the machine you are presenting from, on the
wifi you will have. That is the whole of the advice.

## The workbench

The components are developed in [`@react-x11/workbench`](https://github.com/sidorares/react-x11-workbench),
not by re-running the deck and arrowing to slide 27:

```bash
npm run workbench      # bunx @react-x11/workbench dev
npx x11-workbench ls   # what it found
```

Each component on its own, every variant at once, props editable while it
runs. `stories/` has 68 stories across the seventeen — including both sides of
every step reveal, which is the behaviour most likely to break quietly and
least likely to be noticed until it breaks on stage, and the states a
launcher only reaches by failing.

`workbench.config.ts` wraps every story in the deck's own palette
([`src/theme.ts`](src/theme.ts)), and that is not decoration. A story renders
a component bare, and a react-x11 tree with no `<ThemeProvider>` above it
follows the **desktop** — so on a Mac whose accent is orange, a control that
is `#58a6ff` on the projector comes up orange in the workshop, and the menu a
`<Select>` drops comes up in the library's defaults. Planting the deck's
palette once, outside every story, is the difference between a workshop and a
lookalike.

## Fidelity

`<Markdown>` paints inline-code chips, link underlines and strikethrough
rules by reading the *span* each laid-out run came from. react-x11's Cocoa
text engine reports run geometry only, so on macOS those decorations are
skipped (`react-x11` Cocoa gap 2; the fix belongs in `cocoa/fonts.js`
`layout()`, attaching `span`/`run` per native run by code-unit range).

**In practice this is cosmetic.** What is lost is the rounded chip *behind*
inline code and the rule under a link. What survives is everything that
comes from the span's own attributes, because those go into the native
layout: the monospace face, weight, size and colour. Inline code still
reads as code; fenced blocks are unaffected, since their background is a
box and their highlighting is per-token colour. At projector size nobody
has noticed.

So `npm run x11` under XQuartz is the pixel-exact path, not the usable one.
Present on Cocoa.

## Structure

| | |
| --- | --- |
| `slides/` | the talk, one `.mdx` file per slide |
| `src/components/` | what a slide may name, and the workbench's subjects |
| `examples/` | the apps the demo slides start, in their own processes |
| `src/data.ts` | the talk's numbers, so they cannot disagree |
| `stories/` | workbench stories for every component |
| `scripts/smoke.ts` | every slide parsed, with its steps and its components |
| `src/deck.tsx` | window, key map, chrome |
| `src/slides.ts` | frontmatter + reveal parsing |
| `src/steps.tsx` | `useStep()`, `at()`, `<Step>` |
| `src/zoom.tsx` | the zoom ladder, and what every length is multiplied by |
| `src/prose.tsx` | `<Markdown>` with the deck's typography, components and scope |
| `src/processes.ts` | spawning, stopping and watching a demo's child processes |
| `src/devtools.ts` | the DevTools pair: the UI, the port, then the app |
| `src/hotreload.ts` | the refresh-loader run, and the edit the slide makes |
| `src/x11vis.ts` | finding the visualizer, and pointing an example at it |
| `src/html-language.ts` | an HTML mode for `<CodeEditor>`, written for slide 13 |

Anything here that turns out to be generally useful belongs in
[`@react-x11/components`](https://github.com/sidorares/react-x11-components)
instead — which is the loop the talk itself is about.

## Smoke

```bash
npm run smoke
```

Parses every slide and prints one line each — step count, layout, whether it
has notes, and which components it names, flagging any name that is not a key
in the map. Then it **exits non-zero if any slide still names
`<Placeholder>`**.

That last check is the point. A placeholder draws a labelled box the size the
demo will be, which is right while a slide is being written and wrong on a
projector — and the failure mode is that nobody notices, because a
placeholder looks deliberate. Finishing the demos should not be something to
remember the night before.

## The charts example

```bash
npm run example:charts
```

`@react-x11/components`' own `examples/charts.tsx`, copied in with its import
repointed at the published package, and the button on slide 31 starts it.

It is a **separate process with its own window** on purpose. The panel on that
slide draws this deck's commit history — a few dozen points, the right size
for a slide and the wrong size for the claim. "Cost follows pixels, not
points" needs a million points, its own frame clock, and a HUD reporting what
the last painted frame actually cost: mode, span, command count, estimated
wire bytes. Zoom in and out of the million and the byte count does not move.

A chart sharing this deck's connection would be reporting this deck's frames,
and a demo that can wedge itself on a million points should not be able to
take the talk down with it.
