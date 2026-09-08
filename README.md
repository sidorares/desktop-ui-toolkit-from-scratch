# Making a Desktop UI Toolkit From Scratch

A talk for MelbJS about [react-x11](https://github.com/sidorares/react-x11) —
presented in an app built with react-x11.

The deck is an X11 client. The slides are markdown; the demos are live
components; the terminal on slide 2 is a real shell.

## Running it

```bash
npm install --install-links
npm start
```

`--install-links` matters: `@react-x11/components` is a `file:` dependency on
the sibling checkout, and a symlinked one resolves its own copy of React —
two Reacts in one process is an "Invalid hook call". Installing it as a copy
lets React hoist.

**Until `@react-x11/components@0.5.0` is published**, this deck needs the
sibling checkout *built*, and needs it for a real reason: the published
0.4.0 dereferences a laid-out run's span without a guard, which crashes on
the first painted paragraph on macOS. Master has the fix (PR #58); `dist/` is
gitignored, so it has to be built locally:

```bash
npm --prefix ../react-x11-components run build
```

When 0.5.0 ships, this all collapses back to `"@react-x11/components": "^0.5.0"`
and a plain `npm install`.

On macOS this runs on react-x11's native Cocoa backend. To present under
XQuartz instead — see [Fidelity](#fidelity) — use:

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
skipped — the text is correct, the chips are missing
(`react-x11` Cocoa gap 2; the fix belongs in `cocoa/fonts.js` `layout()`).

Until that lands, `npm run x11` under XQuartz is the full-fidelity path.

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
