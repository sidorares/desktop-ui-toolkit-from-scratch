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
| `Esc` | leave fullscreen |
| `r` | re-read `slides/` from disk |

Stepping back off the front of a slide lands on the **last** step of the one
before it, so rehearsing backwards works.

## Writing a slide

One file per slide in `slides/`, ordered by filename. Frontmatter is
optional:

```markdown
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

## Live demos

A ```` ```demo ```` fence renders a registered component instead of a code
block:

````markdown
```demo
name: terminal
height: 300
command: bash -l
```
````

`name` selects from the registry in [`src/demos/index.tsx`](src/demos/index.tsx);
every other key reaches the demo as a string. An unregistered name renders a
labelled box of the right height, so a slide can be laid out and rehearsed
before its demo exists.

Demos read `useStep()` to find out where the slide has got to — which is how
the chart on the stats slide shows eleven quiet years first and the spike
second, from one component.

This works through `<Markdown>`'s existing `fences` seam — the same one that
turns a ```` ```math ```` fence into a `<Formula>`. That is why the slides
can stay plain CommonMark: the only thing a deck needs that markdown lacks
is an escape into components, and the component already has one.

## Capturing slides

```bash
npm run render -- 17 1 stats.png   # headless, through ntk's text engine
npm run shot   -- 17 1 stats.png   # the real window, via CGWindowListCreateImage
```

`render` needs no window server and goes through the engine that reports
laid-out runs *with* their spans, so it shows a slide at full fidelity — see
below. It is also the seed of the backup PDF, which a talk should have.

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
| `slides/` | the talk, one markdown file per slide |
| `scripts/smoke.ts` | every slide parsed, with step and demo counts |
| `src/deck.tsx` | window, key map, chrome |
| `src/slides.ts` | frontmatter + reveal parsing |
| `src/steps.tsx` | `useStep()`, `at()`, `<Step>` |
| `src/prose.tsx` | `<Markdown>` with the deck's typography and fences |
| `src/demos/` | the demo registry |

Anything here that turns out to be generally useful belongs in
[`@react-x11/components`](https://github.com/sidorares/react-x11-components)
instead — which is the loop the talk itself is about.
