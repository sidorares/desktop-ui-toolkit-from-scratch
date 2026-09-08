# Narration

The talk as spoken, before it is slides. Read top to bottom; if the story
does not hold here it will not hold on stage.

Stage directions in `[brackets]`. `[step]` is a `^^^` reveal.
**A 40-minute slot.**

> **This is the script, not the manifest.** The deck is now 38 slides — see
> [slides-structure.md](slides-structure.md) for the as-built order and slide
> numbers. This file still reads in the four acts it was drafted in, and a few
> beats below landed on different slides than the headings imply; the wording
> is what matters here, not the numbering. The three X11 protocol slides
> (04–06) and the ecosystem graph (23) were added after this draft and are
> described in the structure doc.

---

## The thesis

> **A desktop UI toolkit is a protocol client.**
> Every hard part of this project turned out to be two parties agreeing on a
> message format. The drawing was the easy bit.

That sentence is the spine, and it is what the current draft is missing. It is
not a framing device bolted on top — it is *literally true at every layer*, and
saying it out loud early is what turns twenty-seven slides into one argument:

| layer | the two parties | the format |
| --- | --- | --- |
| the wire | client ↔ X server | the X11 protocol |
| belonging | app ↔ desktop | XDND, dbusmenu, AT-SPI, XDG portals |
| React | React ↔ host | the reconciler's host config |
| tooling | DevTools frontend ↔ backend | the DevTools message channel |
| portability | toolkit ↔ platform | the presenter interface |

Every act pays off the same idea. The macOS backend exists because of the last
row. Issue #4 exists because of the third. The whole performance section
exists because of the first.

## The rule for demo slides

**Say it, then show it. Never both at once.**

A demo slide that is also making its own argument asks the room to read and
watch simultaneously, and they will do neither. So: the slide *before* a demo
ends on the claim, the demo slide's **title is that claim restated as fact**,
and while the demo is on screen you say almost nothing. Five demo moments in
the talk, one rhythm for all of them.

---

## Cold open — 2:30

*[App already up. Say nothing for a beat. Let them look at it.]*

Everything you are about to see for the next forty minutes is one Node
process.

This is not a slide deck. It is an application. There is a window, a flex
layout, shaped text and a markdown renderer, and all of it is drawn by the
toolkit this talk is about.

*[step]* Including a real shell. *[click it, type something, `Esc`]*

*[step]* No browser. No Electron. No compiled UI module. One `node` process,
talking to a display server over a socket.

I'm Andrey. I want to spend the next forty minutes on one idea, and the idea
is this: **a desktop UI toolkit is a protocol client.** Every hard part of this
turned out to be two parties agreeing on a message format. The drawing was the
easy bit.

---

# Act I — the wire, and belonging (8:30)

## X11 is a protocol, not a library

Start with the thing that makes any of this possible.

X11 is not a library you link against. It is a protocol — a byte stream over a
socket. Your program is the client. Something else, the X server, owns the
screen, owns the pixels, owns the memory the window lives in. You send it
requests: `CreateWindow`, `MapWindow`, `PolyFillRectangle`,
`RenderCompositeGlyphs`. It sends back events and replies.

Two consequences, and they are the whole talk.

*[step]* **First: the wire carries drawing, not pixels.** You do not hand the
server a framebuffer, you hand it a description — a rectangle here, this
colour; this glyph, at this position. Which means anything that can write bytes
to a socket can be a GUI toolkit. That includes Node, with no bindings at all.

*[step]* **Second: there is a network in the middle.** Even when the server is
on the same machine over a Unix socket, the *shape* of the thing is a network.
Latency is a first-class design constraint and it always was — this was
designed in 1987 to put a window from a mainframe onto a terminal across a
campus. That decision is why the protocol is asynchronous, why a reply is
something you learn to avoid asking for, and why a third of this talk is about
round trips.

## node-x11 — June 2011

I have known the first consequence for a while.

In June 2011 I wrote a pure-JavaScript X11 client. No `node-gyp`, no Xlib, no
bindings — just the protocol, encoded and decoded in JS.

*[step, code]*

That is fifteen years ago. And for fifteen years it stayed exactly that: a
*protocol library*. You could open a window. You could fill a rectangle. And
then you were on your own.

*[step]* Because opening a window is not a toolkit.

So what is?

## Drawing rectangles is the easy 20%

Here is the definition I have landed on, and it is the one that earns the title
of this talk.

**A toolkit is what makes an application belong to the desktop it is running
on.** And almost none of belonging is drawing.

*[step]* Think about what you expect from a real desktop app and never think
about:

- It **integrates**. You drag a file from the file manager onto it. Its menu
  appears in the desktop's own panel, not in its window. It opens the same file
  dialog every other app opens.
- It **looks native**. It follows the colour scheme. It goes dark when the
  desktop goes dark. It honours reduced motion and increased contrast.
- It is **accessible** — a screen reader can walk it, a magnifier can follow
  the caret, someone can drive it without a mouse.
- It is **localised** — the system's language, the system's date and number
  formats.
- It is **activatable** — `myapp://something` launches it, or focuses the copy
  already running.
- It is **distributable** — packaged, signed, updateable.

*[step]* Now the point. Every single one of those is a **protocol you have to
speak**, not a feature you implement:

| what the user sees | what you actually speak |
| --- | --- |
| drag and drop between apps | XDND — a handshake in properties and client messages |
| the menu in the desktop's panel | `com.canonical.dbusmenu`, over D-Bus |
| a screen reader reading your app | AT-SPI, over D-Bus |
| the file dialog, the permission prompt | XDG desktop portals, over D-Bus |
| going dark when the desktop does | a D-Bus settings read, X resources as fallback |
| another app's icon in your tray | XEmbed, and `_NET_SYSTEM_TRAY_*` |
| the screen not blanking mid-talk | a D-Bus idle inhibitor |

*[If anyone asks whether that list is aspirational: every row is a file.
`dnd.js`, `dbusmenu.js` + `globalmenu.js`, `atspi.js` + `a11y.js`,
`portal.js`, `appearance.js`, `trayhooks.js`, `idle.js` — plus `activate.js`,
`clipboard.js`, `scale.js`, `compose.js`, `decorations.js`. And a parallel set
under `cocoa/`.]*

Belonging to a desktop means being fluent in about a dozen conversations. None
of them involve a pixel.

*[step]* And the strongest version of that is not that your window looks
right. It is that **the same JSX can leave your window entirely.**

*[That is the claim. Do not demonstrate it here. Next slide.]*

## The same JSX, in somebody else's chrome  *(DEMO)*

*[Say the first line, run it, then be quiet and let them look at the top of
the screen rather than at the slide.]*

This is one line of JSX in this deck:

`<MenuBar menus={…} />`

*[step]* And there it is — **in the macOS menu bar.** Not drawn by me. Not in
my window. That menu is at the top of the screen, in the operating system's
own chrome, and it got there because the same array that would draw a menu bar
also serialises to the protocol the desktop is listening on.

On a Linux desktop with a panel, the same line goes out over
`com.canonical.dbusmenu` instead. On a desktop with no global menu at all, it
draws the bar itself.

*[step]* Same line, three outcomes, and the app does not branch — because
**the array that draws the menu is the array that serialises.** That is not a
compatibility shim. It is one data structure with three ports.

*[step]* And the same trick runs in the other direction. On X11 this deck can
be a **tray host** — other applications dock their status icons into my flex
layout over XEmbed, which is my app being desktop infrastructure rather than
consuming it — and mpv reparents into a flex child, laid out by yoga, resizing
when the pane resizes.

*[If presenting on Cocoa, that last beat is a sentence and a screenshot, not a
live demo. See slides-structure.md.]*

## The browser is very good at the other half

So — the obvious question. Why not just use a browser? I want to be fair here,
because the browser is a superb platform and pretending otherwise would be
dishonest.

A web page gets a *lot* for free, and specifically it gets the easy 20% for
free. Layout, text shaping, font fallback, a compositor, a rendering pipeline
thousands of people have tuned for twenty years. If your app is a document, a
browser is the correct answer and you should use one.

*[step]* What it gives up is the other 80%. One sandbox, one tab. It does not
get the user's window manager, the tray, the global menu, D-Bus, the
filesystem, per-monitor scale — and it certainly does not get to put somebody
else's video player inside a flex box.

*[step]* Smaller proof, running right now: while this slide has been up, this
deck has been holding a **sleep inhibitor**, so the screen cannot blank in the
middle of my talk. That is one hook — `useKeepAwake()` — and underneath it is a
D-Bus call to the desktop's idle service. There is no web API for that, and
there should not be.

So it is not "the browser is bad". It is: **a different set of things is
hard**. The browser makes drawing easy and belonging impossible. I wanted to
find out what the other trade looks like.

---

# Act II — React, without a DOM (11:00)

## React needs a host, not a DOM

I want to build the 80%, and I want to write applications in React, because
that is the programming model I want.

The good news is that React does not require a DOM. It requires a *host*.
`react-reconciler` — the package React DOM and React Native are both built on —
asks you for a host config. Roughly: how do I make a thing, how do I put a
thing inside another thing, how do I update a thing.

*[code: createInstance / appendChild / commitUpdate]*

That is the interface. Answer those three and React will drive you. **The
reconciler is a protocol too** — the third row of the table I opened with.

*[step]* That part is a weekend. Genuinely — a weekend gets you rectangles on
screen that update when state changes.

## Hello, desktop — the whole program

So let me show you the whole thing, end to end, because I have been talking
about a toolkit for ten minutes and you have not yet seen a program.

```jsx
import { createRoot } from 'react-x11';

function App() {
  return (
    <window title="Hello" width={400} height={300}>
      <text style={{ fontSize: 24, padding: 20 }}>Hello, desktop</text>
    </window>
  );
}

const root = await createRoot();
root.render(<App />);
```

That is the file. `node app.jsx`, and there is a window on your screen.

*[step]* No HTML file. No bundler, no dev server, no `index.html` with a `div`
in it that everything gets mounted into. `createRoot()` opens a connection —
to `$DISPLAY`, or on this machine to the Cocoa presenter — and `render` puts a
tree on the other end of it.

*[step]* And notice where the window is. **`<window>` is in the tree.** It is
not ambient context you configure from outside the app; it is an element, with
props, reconciled like everything else. Which has consequences that all fall
out for free:

- The title is a prop. Put state in it and the titlebar updates, because it
  went through the same commit as the text did.
- Two `<window>`s is a multi-window application. There is no separate window
  API to learn.
- A `<popup>` is a window with different hints for the window manager — so
  menus, tooltips and dialogs are the same machinery, not a special case.

*[step]* And a confession about that snippet: those last two lines are the
bottom of this deck's own `src/main.tsx`. That is not a simplified example.
That is what is running.

## What `createRoot()` did before your first render

Which brings me back to the list from Act I, because I owe you a payoff on it.

`await createRoot()` is one line. Before your first component renders, it has
connected to the display, loaded the layout engine — and **dialled the session
bus to start three protocol clients on your behalf**:

| | |
| --- | --- |
| `appearance` | the desktop's light/dark, accent, contrast and reduced motion |
| `a11y` | the AT-SPI bridge — whether a screen reader can see this app at all |
| `globalMenu` | whether a `MenuBar` hands its menu to the panel or draws it |

*[step]* And here is how you know that list is real engineering and not a
marketing bullet: **you can turn it off.**

```js
await createRoot({ desktop: false });                  // none of it
await createRoot({ desktop: { appearance: false } });  // just that one
```

Because there are applications that should not do this. A kiosk. A daemon. A
test that needs the same answer on every machine. An embedder that owns those
integrations itself and does not want a second app fighting it for the bus.

*[step]* And that is where the menu bar you watched jump into the top of the
screen came from. I never asked for a D-Bus connection. `createRoot()` had
already opened one, because `globalMenu` defaults to on — which is the whole
difference between a toolkit and a drawing library, expressed as a default
argument.

## The shape it settled into

Here is the architecture, because everything after this refers to it.

- **the protocol client** — encode and decode X11, plus the extensions:
  XRender for text and compositing, XInput for devices, XKB for keyboards, GLX
  for OpenGL.
- **the presenter** — the interface between *what should be on screen* and
  *what this platform does about it*. Remember this one.
- **the renderer** — the host config, plus layout, text, paint, events, focus.
- **the elements** — `<window>`, `<popup>`, `<box>`, `<text>`, `<textinput>`,
  `<image>`, `<canvas>`, `<svg>`, `<glarea>`. The host primitives; what
  `createInstance` actually makes.
- **the widgets** — buttons, selects, sliders, menus, dialogs, tabs, trees,
  split panes. Written in React, in terms of the elements.
- **components** — charts, tables, terminals, maps, a markdown renderer. A
  separate package. Everything on these slides comes from it.

*[step]* Everything above the presenter line is platform-independent. Hold that
thought for about fifteen minutes.

*[step]* And the reason that stack is deeper than it looks: when you remove the
DOM you do not just lose an API. You lose everything the DOM was quietly doing
for you and never mentioned.

- **Layout.** No box model, no flow, no line boxes. Yoga, one node per element,
  computed in-process.
- **Text.** Shaping a string into positioned glyphs. Bidi. Ligatures. Font
  fallback when your font does not have the character. Line breaking.
- **Painting.** What actually changed. What needs redrawing. Double buffering
  so nobody watches it happen. Clipping. Z-order.
- **Events.** Hit testing front-to-back through a tree. Capture and bubble.
  Enter and leave, which is not the same thing as move.
- **Focus.** What is focused. What tab order means. What a modal takes when it
  opens and gives back when it closes.

**That** is "from scratch". The reconciler is the easy end of it. The browser
has been doing that list for you your entire career.

## What happens when state changes

So: what actually happens when a component calls `setState`?

*[walk it once, left to right, slowly]*

- **Reconcile** — React's render phase. Pure, and — remember this word —
  *discardable*. React is allowed to do this work and throw it away.
- **Commit** — host mutations. Now my code runs: create these, append those,
  apply this prop diff.
- **Layout** — yoga, over the dirty subtree. In my process.
- **Paint** — walk what is damaged, produce drawing commands, for the changed
  regions only.
- **The wire** — batched requests out, through the presenter.

*[step]* Two of those stages are the entire performance story, and both are
about the socket.

**Layout never leaves the process.** This is not a small thing. If you asked
the server "how wide is this string" for every text node every frame, that is a
round trip per measurement, and a round trip is the most expensive thing
available to you. So font metrics come across once and get cached, and
everything after that is arithmetic on this side of the wire.

**Paint sends the smallest rectangle that changed.** A cursor blink in a
terminal is one cell, not one screen.

## React's render phase is discardable

Now my favourite bug, because it is a bug you can only have if your host is a
protocol.

React's render phase is discardable. React will happily call `createInstance`
for work it later decides it does not need — a component that suspended, an
interrupted update, a branch it threw away. For React DOM that is completely
fine: you made a `<div>` in memory, you never appended it, the garbage
collector eats it, nobody finds out.

*[step]* It is **not** fine for `CreateWindow`. By the time I am back from that
call the server has already allocated it. There is a resource on the other side
of the socket with an ID, and no garbage collector on this side is going to
reach across and free it. Render-phase work leaked real state into another
process.

*[step]* And there is a second problem that stacks with it. X11 names a
window's **parent at creation time** — the parent is an argument to
`CreateWindow`. But React builds children before parents. By the time I know
who the parent is, I have already had to create the child.

*[step]* Two tempting fixes, both bad. Create it detached and `ReparentWindow`
it later — an extra round trip and a visible flash. Or stage it as an
override-redirect window and adopt it — worse, and the window manager will
notice.

*[step]* The actual fix is a rule: **no X11 calls in the render phase, at
all.** `createInstance` returns a plain object — the *description* of a window
that does not exist yet. Windows are realized in the **commit** phase,
top-down, so every `CreateWindow` names its real parent from the start.

Which, written down, is just the reconciler's own contract: render is pure,
commit is where effects go. I had to have this bug to learn that the rule was
not advice.

`react-x11#4`

## It reads like the web, because it should

Back to the surface for a moment. Styles.

```jsx
<box style={{
  padding: 12,
  backgroundColor: '$surface',
  transition: 150,
  ':hover': { backgroundColor: '$surfaceHover' },
  '@container width >= 400': { flexDirection: 'column' },
}}>
```

The design goal was one sentence: **a web developer should be able to read this
without translating.** Not "looks a bit like CSS" — actually reads.

*[step]* But that goal argues with the architecture, and the argument is the
interesting part. There is no stylesheet here and there is no cascade — a style
is an object on a node. So:

- **Pseudo-states live in the object**, because there is no selector to put
  them in. `:hover`, `:focus`, `:active`, `:disabled` — and because drag and
  drop is first-class here, `:drag-over` and `:dragging` for free.
- **Container queries, not media queries.** In a desktop app the interesting
  size is almost never the screen, it is the pane. So the container query is
  the primitive and the window query is the special case — the exact opposite
  of the web's history.
- **Tokens, not variables.** `$surface` resolves against the theme, the theme
  comes from the desktop over that D-Bus connection `createRoot` opened, which
  is how dark mode arrives without the app asking for it.
- **Transitions on any number or colour**, because animation is a property of
  the value, not a rule in a stylesheet somewhere else.

What you give up is real: no cascade, no selectors, no stylesheet you can ship
separately. What you get is that every style is a value in the tree — which is
why the whole thing can be diffed, and why a theme change is just a re-render.

*[step]* And to be concrete: this slide is being drawn by three of them.

## React DevTools. On an X11 window.  *(DEMO)*

Then the thing that made me believe this was usable rather than a clever hack.

*[step — the demo. Show, do not narrate the list.]*

Component tree, props, hook state — live. Edit a prop and the app re-renders.
The crosshair picks an element by clicking it **in the window**.
Highlight-updates outlines the rectangles that just re-rendered. The profiler
records the mount.

*[step]* And here is *why*, and it is the thesis again: **DevTools is a
protocol too.** The frontend does not know about the DOM. It talks to a backend
over a message channel — that is how React Native does it, over a socket. So
the renderer injects the backend and speaks it. I did not build DevTools. I
qualified for it.

*[step]* **Fast Refresh** works for a related reason. Save a file and the
edited components update in place — and the X11 connection, the window and
component state all survive, because the connection lives *outside* React's
tree. Half-typed text in an input is still there.

*[step]* And one thing that was not free, but is my favourite: **alt-click any
element on screen and your editor opens on the JSX line that drew it.** That is
the source location babel already puts on every element, plus a hit test, plus
spawning `$EDITOR`. About fifty lines.

The point is not the feature list. The point is that almost none of it is
bespoke. It is React's own tooling, talking to a renderer that happens to draw
on a display server.

---

# Act III — latency is the design (9:00)

## How many times you talk is the whole story  *(DEMO)*

Right. Let us make it fast. But first: how do you even debug this?

*[demo — alt-tab to x11vis, already running]*

A man-in-the-middle proxy. It sits between a client and the server and decodes
the protocol live. Every request, reply, event and error, with the byte range
for each decoded field. Every resource ID links back to the request that
created it.

Here is a trivial client — open a window, draw something. **Twenty-two
messages. About five milliseconds.**

*[step — flip the preset to Slow 3G, re-run. Say nothing while it runs.]*

Same twenty-two messages. **Two point nine seconds.**

Nothing about the program changed.

*[step]* And fittingly — this tool's own UI is an X11 application built with
react-x11. The visualizer is one of its own clients.

## Four budgets, and they fight

So performance here is not one number, it is four, and they trade against each
other, which is unusual and is what makes it interesting.

- **Network** — round trips and bytes to the display server.
- **Local CPU** — layout, shaping, diffing, in my process.
- **Server CPU** — what the X server does with what I sent it.
- **The raster gate** — how often you are allowed to draw at all. Vsync, the
  compositor, the display's refresh.

*[step]* Optimising one usually spends another. Fewer, larger requests helps
the network and costs server memory. Caching glyphs helps server CPU and costs
a round trip to set it up. More layout work locally saves round trips and costs
frame time.

There is no single dial. There is a budget you are currently failing, and you
go and find out which one.

## Text is uploaded once, then referenced

Let me show you the prettiest mechanism in the whole thing, because it is the
one that makes all four budgets happy at the same time.

Text. XRender has **glyph sets**: you upload a glyph's bitmap once and you get
back an ID.

*[step]* So — `fontkit` shapes a string, which gives me positioned glyph IDs. I
check which of those the server has not seen and upload only those. Then
`RenderCompositeGlyphs` draws the entire run **by ID**.

Which means a paragraph you have shown before costs one request containing a
list of small integers. Not pixels. Not even characters. Integers.

*[step]* And here is the trick that made me laugh when I found it. **A glyph
does not have to be a letter.**

Upload a solid 1×1 square as a glyph. Composite it in a run, with positions and
a colour. That is a filled rectangle — and a run of them is *hundreds* of
filled rectangles in one request. That is how a terminal draws every cell
background on screen in a single call.

The text-drawing path turned out to be the fastest rectangle-drawing path.

## Every real optimisation was "don't"

Here is the part that transfers even if none of you ever write an X11 client.

I went back through everything I actually did to make this fast, and there was
not one clever algorithm in it. Every single one was a **refusal**. Four of
them, one per budget:

- **Don't draw detail nobody can see.** *(local CPU)*
- **Don't draw too often.** *(the raster gate)*
- **Don't redraw what did not move.** *(server CPU)*
- **Don't send it twice.** *(network)*

*[step]* The terminal got three times faster on macOS by drawing *less often*.
Not by drawing faster. I did not change a single drawing call.

*[step]* Those four are the next slide, running. One each.

## The four refusals, running  *(DEMO — `reveal: replace`)*

*[One sentence per demo. Then stop talking and let it run.]*

**Don't draw detail nobody can see.** Three thousand points on an
eight-hundred-pixel chart is more points than pixels. Decimated to what the
axis can actually resolve — visually identical, a quarter of the work. Resize
it and it re-decimates.

*[step]* **Don't draw too often.** A terminal, flooded with twenty thousand
lines. Glyph runs for the text, glyph runs for the backgrounds — and a frame
gate deciding how much of that torrent you actually see. The output is correct
either way; the only question is how many frames you spent on it.

*[step]* **Don't redraw what did not move.** Pan and zoom over a node graph.
That is a scale on a subtree, and damage tracking working out that most of the
screen is exactly where it was.

*[step]* **Don't send it twice.** Geometry, in a server-side display list. The
vertices cross the wire **once**, at startup. Every frame after that is one
`CallList` — a few bytes, for all of that.

---

# Act IV — what it cost, and how it got built (4:30)

## Then macOS happened

Now the honest part.

I said I would come back to the presenter. The presenter is the interface
between the component tree and the platform: what a window is, what a surface
is, how a frame reaches a screen. There is one for X11. And now there is one
for Core Animation — layers instead of windows, CoreGraphics instead of
XRender.

Same component tree. Same yoga layout. Same event model. Same components. One
layer per real window, everything else painted into it.

*[step]* And the cost: the AppKit bridge is a **compiled module**. `node-gyp`
is back. Fifteen years of "pure JS, no bindings" and I broke it.

*[step]* Which is fine, and I want to be clear about why. **"No binary modules"
was never the goal. It was a constraint** — and it was a good one, because it
forced me to actually implement things instead of binding to something that
already had. It is the reason the layout, text and paint layers are honest
portable code rather than a thin wrapper around a C library.

A constraint that has done its job is allowed to be spent. macOS was worth
spending it on. Wayland and Windows are the same shape of problem — and they
are easier now, because the first backend proved the seam was in the right
place.

*[beat]* This deck is running on that backend right now.

## The loop

One more thing about how this gets built, because I think it is what made the
API coherent.

*[step]* Three steps:

1. **Draft** an application that wants something.
2. Find the **gap** — the thing this app is about to write for itself, that
   every app would have to write for itself.
3. **Promote** it: out of the app, into the components package, and if it is
   fundamental enough, into core.

*[step]* `<Markdown>` exists because a chat client needed it. Drag and drop
moved into core because a reorderable list and a file-drop target turned out to
want the same two props. Nothing here was designed in the abstract. Everything
is here because something concrete was missing it.

*[step]* This deck did it too — it found one this week. A markdown code fence
knows its *language*, but the renderer never hands it the rest of the info
string. Which is a real gap, because that is where line highlighting would go.

## Fifteen years, and then seven weeks

*[timeline]*

Those are the dates. node-x11 in 2011. ntk in 2012. react-x11 in 2015 — and
then, essentially, nothing for eleven years.

*[step — pause. Let the colour land. Do not talk over it.]*

That is seven weeks.

## The honest version

I want to be careful about how I say this, because the honest version is more
interesting than the marketing one.

**The loop did not change.** Draft, find the gap, promote. What changed is the
*cycle time* between having an idea and knowing whether it was any good.

*[step]* What actually changed:

- The **design record became the unit of work** — a written spec per component,
  before the code and kept after it. Which is, again, a protocol: an agreement
  written down before either side implements it.
- **Reading and reviewing** became the bottleneck instead of typing.
- **"Try it as a throwaway" got cheap enough to do first**, every time. Most of
  the good decisions in this toolkit are the second or third version of
  something I threw away.

*[step]* What did not change:

- Deciding **what** to build, and — much harder — what to refuse to build.
- **Protocol-level debugging.** A wrong byte is still a wrong byte, and nothing
  helps with that except the visualizer and patience.
- **Taste.** Every API I have shown you today is a judgement call, and the
  judgement is fifteen years old.

*[step]* So the honest summary is: this is not "AI wrote a UI toolkit". It is
fifteen years of knowing exactly what I wanted, finally meeting a fast enough
typist.

## The bar has moved

*[screenshot. Deadpan. Do not explain it.]*

> Cure cancer, then open a PR

*[beat]*

The second half is the easy part now.

---

# Close (1:15)

## What's next

Real things, not a wishlist:

- **MDX in `<Markdown>`** — components interleaved with prose. This deck is the
  forcing function and it is most of the way there.
- **More backends** — Wayland, and Windows, behind the same tree.
- **Accessibility** — AT-SPI is wired, the coverage is not finished. This is
  the one I would most like help with.
- **The workbench** — a Storybook for a desktop toolkit. It is how the
  components on these slides get built.

All of it is on GitHub and the good-first-issues are real ones.

## It's all just bytes on a socket

So — the idea I wanted to leave you with.

A desktop toolkit is a protocol client. The wire carries drawing, not pixels.
Belonging to a desktop is a dozen conversations, none of which involve a pixel.
React's reconciler is a protocol. DevTools is a protocol. And the presenter is
a protocol I wrote for myself, which is the only reason there is a second
backend.

It is all just bytes on a socket.

*[links]*

Questions. And this slide is an X11 client too.
