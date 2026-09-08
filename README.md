# Making a Desktop UI Toolkit From Scratch

A talk for MelbJS about [react-x11](https://github.com/sidorares/react-x11) —
presented in an app built with react-x11.

The deck is an X11 client. The slides are markdown; the demos are live
components; the terminal on slide 2 is a real shell.

## Running it

```bash
npm install
npm start
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
axis labels. What does **not** scale is the box a demo asked for: a
`height: 380` is a share of a window that zoom does not resize, so growing it
only pushes the slide's own chrome off the bottom edge. A terminal at 150% is
the same pane with larger characters and fewer of them, which is what `⌘+`
does to every other terminal on the machine.

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
| `<Placeholder>` | a box the size a demo will be, for one that isn't built |

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

## The workbench

The components are developed in [`@react-x11/workbench`](https://github.com/sidorares/react-x11-workbench),
not by re-running the deck and arrowing to slide 19:

```bash
npm run workbench      # bunx @react-x11/workbench dev
npx x11-workbench ls   # what it found
```

Each component on its own, every variant at once, props editable while it
runs. `stories/` has 23 stories across the six — including both sides of
every step reveal, which is the behaviour most likely to break quietly and
least likely to be noticed until it breaks on stage.

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
| `src/data.ts` | the talk's numbers, so they cannot disagree |
| `stories/` | workbench stories for every component |
| `scripts/smoke.ts` | every slide parsed, with its steps and its components |
| `src/deck.tsx` | window, key map, chrome |
| `src/slides.ts` | frontmatter + reveal parsing |
| `src/steps.tsx` | `useStep()`, `at()`, `<Step>` |
| `src/zoom.tsx` | the zoom ladder, and what every length is multiplied by |
| `src/prose.tsx` | `<Markdown>` with the deck's typography, components and scope |

Anything here that turns out to be generally useful belongs in
[`@react-x11/components`](https://github.com/sidorares/react-x11-components)
instead — which is the loop the talk itself is about.
