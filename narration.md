# Narration

The talk as spoken, start to finish. Read it top to bottom; if the story does
not hold here it will not hold on stage.

**40 slides, 141 steps, a 40-minute slot.** One heading per slide, in order,
so this file and `slides/` can be read side by side.

Stage directions in *[brackets]*. `[step]` is a `^^^` reveal. **Demo slides get
their spoken paragraphs written out**, because on eleven of these slides the
words are the whole content — the slide is a running program and the prose is
what you say over it.

---

## The thesis

> **A desktop UI toolkit is a protocol client.**
> Every hard part of this turned out to be two parties agreeing on a message
> format. The drawing was the easy bit.

Said once in the cold open, and back at you on the last slide. It is not a
framing device — it is true at six separate layers, and it is what makes
thirty-eight slides one argument instead of a tour:

| layer | the two parties | the format |
| --- | --- | --- |
| the wire | client ↔ X server | the X11 protocol |
| belonging | app ↔ desktop | XDND, dbusmenu, AT-SPI, portals |
| React | React ↔ host | the reconciler's host config |
| tooling | DevTools ↔ backend | a socket, on `:8097` |
| portability | toolkit ↔ platform | the presenter interface |
| **the alternatives** | renderer ↔ main process | **a protocol you invented yourself** |

That last row is the one that earns the talk. An Electron app is also a
protocol client; it is just a protocol nobody else implements.

## Two rules for delivery

**Say it, then show it. Never both at once.** The slide before a demo ends on
the claim; the demo slide's title *is* that claim; while it runs you say
almost nothing. Eleven demo moments, one rhythm.

**A demo that is running is doing the talking.** Press the button, then stop
narrating the UI. Point at one thing. Wait.

---

# Cold open — 2:30

## 01 · Making a Desktop UI Toolkit From Scratch

*[App already up. Say nothing for a beat. Let them look at it.]*

## 02 · You are looking at the demo

Everything you see for the next forty minutes is one Node process.

This is not a slide deck. It is an application — a window, a flex layout,
shaped text and a markdown renderer — and all of it is drawn by the toolkit
this talk is about.

*[step]* Including a real shell.

*[Click the terminal. Type something — `ls`, or `ps aux | grep node` if you
want the point made twice. Then `Esc` to hand the keyboard back, and SAY that
you did, because the room needs to know the deck did not break.]*

*[step]* No browser. No Electron. No compiled UI module. One `node` process,
talking to a display server over a socket.

*[step]* I'm Andrey. One idea, for the next forty minutes: **a desktop UI
toolkit is a protocol client.** Every hard part of this turned out to be two
parties agreeing on a message format. The drawing was the easy bit.

---

# The wire — 9:00

*Nine slides before the room is told why any of this matters. That is a real
risk and the mitigation is pace: 05, 06 and 07 are a speed-run, and 09–11 are
demos that carry themselves. If you are behind, 07 is the one to lose.*

## 03 · X11 is a protocol, not a library

X11 is not something you link against. It is a byte stream over a socket. Your
program is the client; something else owns the screen, the pixels, and the
memory the window lives in. You send requests — `CreateWindow`, `MapWindow`,
`PolyFillRectangle`. It sends back events and replies.

Two consequences, and they are the whole talk.

*[step]* **The wire carries drawing, not pixels.** You do not hand the server
a framebuffer, you hand it a description: a rectangle here, this colour; this
glyph, at this position. Which means anything that can write bytes to a socket
can be a GUI toolkit. That includes Node, with no bindings at all.

*[step]* **And there is a network in the middle.** Even over a Unix socket on
this machine, the shape of the thing is a network — because it was designed in
1987 to put a window from a mainframe onto a terminal across a campus.

That decision is why the protocol is asynchronous, why a reply is something
you learn to avoid asking for, and why a third of this talk is about round
trips.

## 04 · node-x11 — June 2011

I have known the first of those for a while.

In June 2011 I wrote a pure-JavaScript X11 client. No `node-gyp`, no Xlib, no
bindings — just the protocol, encoded and decoded in JS.

*[step, the code]* That is fifteen years ago. And for fifteen years it stayed
exactly that: a protocol library. You could open a window. You could fill a
rectangle. And then you were on your own.

*[step]* Because opening a window is not a toolkit.

*[step]* Before we work out what is — ten minutes on what that library
actually talks to. Three ideas, then we watch them on the wire.

*[Do NOT ask "so what is a toolkit?" here. It gets asked and answered on the
"easy 20%" slide, and asking it now leaves it hanging through seven slides.]*

## 05 · Every id is a promise you make yourself

*[Speed-run, but this is the one that explains why the protocol feels fast.]*

The connection handshake does not just say hello. The server hands back a
**range of resource ids** — a base and a mask — and from then on the client
mints its own.

*[step, the code]* `AllocID` is a local counter. It sends nothing.

*[step]* So `wid` is a **future**: a handle to a window that does not exist
yet, and will not exist until the server gets round to reading the request
three lines up. That is legal, and it is the whole trick — you can name a
thing and use the name in the same breath, because both sides already agree
who gets to invent names.

*[step]* The alternative is the obvious design: *ask* the server to make a
window and reply with its id. That costs a round trip **per object** — every
window, pixmap, graphics context, font and glyph set.

*[step]* A protocol built in 1987 for a network could not afford to ask
permission for names. So it gave the names away at the door.

## 06 · A window is a rectangle with three jobs

There are no widgets in X11. No buttons, no text fields, no menus.

*[step]* One object, with three jobs: a **rectangle in a tree**, positioned
relative to a parent that clips it — that is the entire layout model the
server offers. A **paint surface** you may aim drawing requests at. And an
**event source**, where a 32-bit mask says which events you want.

*[step]* That is the whole object. A button is a rectangle that accepts
drawing, receives clicks, and has somebody's code deciding what it looks like
in between.

*[step]* Which is why react-x11 makes **one** window and paints everything
into it. A window per `<box>` would be thousands of pieces of server-side
state, a round trip of setup each, and a hit test the server does instead of
you — slower *and* less controllable.

*[This is the setup for the roadblock slide and for Cocoa. Do not skip it.]*

*[step]* The server's job is the rectangle. Everything you think of as a user
interface happens on this side of the socket.

## 07 · Three primitives, and no policy at all

*[Fastest slide in the deck. Three things, then the point.]*

**Atoms** — hand the server a string, get an integer back. Server-side
constants, interned once, shared by every client on the display. Because
sending `353` is four bytes and sending `"_NET_WM_STATE"` is not.

*[step]* **Properties** — a named, typed blob on a window, keyed by an atom.
So a window is also a key-value store: its title, its icon, its class, its
size hints, and whatever else anyone has agreed to look for.

*[step]* **Selections** — an atom exactly one client *owns* at a time. The
clipboard is a selection: to paste, you ask the owner to convert its value to
a type you want, and it answers. So the clipboard is not a buffer somewhere,
it is a negotiation with whichever app you copied from — which is why copying
and then quitting that app loses it.

*[That last line usually gets a noise of recognition. Wait for it.]*

*[step]* And now the point. X11 ships almost **no policy**. It has no concept
of a taskbar, a maximised window, a drag, a tray or a menu.

*[step]* Every one of those is a *convention* — an agreed atom, holding an
agreed property, in an agreed format — that the desktop and the application
both promise to honour. Which is exactly why belonging to a desktop is not a
feature you implement. It is a set of agreements you keep.

## 08 · You can watch every byte

*[DEMO. x11vis is a separate X11 app under XQuartz — start it BEFORE the talk
and alt-tab. Do not launch it live.]*

This is a man-in-the-middle proxy. It sits between a client and the server and
decodes the protocol live: every request, reply, event and error, with the
byte range for each decoded field. Click any resource id and it links back to
the request that created it.

*[Run the trivial client.]* Here is a program that opens a window and draws
something. **Twenty-two messages. About five milliseconds.**

*[step — flip the network preset to Slow 3G and re-run. SAY NOTHING while it
runs. Let the room watch the list crawl.]*

Same twenty-two messages. **Two point nine seconds.**

Nothing about the program changed. Hold that number — the performance section
is about that number.

*[step]* And, fittingly: this tool's own UI is an X11 application built with
react-x11. The visualizer is one of its own clients.

*[2 min. Come back to the deck.]*

## 09 · The smallest thing you can see

*[DEMO, first of three. 90 seconds. Press Run and keep talking — x11vis opens
its window, then the example runs against it.]*

The smallest program that puts something on a screen. Four requests.

*[step]* A handshake, then **four requests and not one reply.** `CreateWindow`
and `MapWindow` are one-way — nothing here waits for the server.

*[Point at the `AllocID` line and read it out loud.]* And that id in the first
argument was invented by the client, out of the range the server handed over
at connect time. Naming a window cost no round trip. That is the slide from
five minutes ago, on the wire.

*[If x11vis is not on the machine the panel says so. Talk through the code and
move on — do not debug on stage.]*

## 10 · One bit more, and it answers back

*[DEMO, 60 seconds. Run it, then click the window a few times and let the room
watch events appear.]*

Same program, one field different.

*[step]* `eventMask` is a 32-bit set inside the *same* `CreateWindow`. Asking
for clicks cost four bytes and no extra request — nothing here registered a
listener over the wire.

And every click comes back as 32 bytes the client never asked for. Which is
the half of the protocol that is not request/reply at all: the server talks
first, and your program's job is to be listening.

## 11 · Three shapes, and every byte accounted for

*[DEMO, 90 seconds, and the one to linger on.]*

Three shapes cover almost the whole protocol.

*[Run it. Select `ChangeProperty` and click the `name` field — the bytes light
up in the hex dump. Show the pad byte.]*

A **value list**: a mask, then one 32-bit value per set bit, in mask order. A
**string**: 8-bit units padded up to a multiple of four, with a length that
counts the characters and not the padding.

*[Now select `GetGeometry` and follow the link to its reply.]*

*[step]* And the one request here that asks a question. Its reply carries a
**sequence number**, which is how you know which question it answered — there
is no ordering guarantee otherwise, because nothing waited.

That is the whole request/reply story in one click. And every one of these is
a round trip you would rather not make, which is the slide we come back to
later.

---

# Why build one — 5:30

## 12 · Drawing rectangles is the easy 20%

So: rectangles that take clicks, text drawn by id, and a key-value store on
every window. That is everything the protocol gives you.

Back to the question I left hanging. If a protocol library is not a toolkit,
what is?

*[step]* A toolkit is what makes an application **belong to the desktop it is
running on**. And almost none of belonging is drawing.

*[step]* Everything you expect from a real desktop app and never think about
is a protocol you have to speak, not a feature you implement.

*[Read three or four rows ACROSS. Left column is what a user would say they
expect; right column is the actual work.]*

Drag and drop is XDND — a handshake in properties and client messages. The
menu in the panel is dbusmenu, over D-Bus. A screen reader is AT-SPI, also
D-Bus. File dialogs and permission prompts are XDG portals. Even "what colour
scheme is the desktop using" is a D-Bus settings read.

*[If anyone doubts the list is real: every row is a file. dnd.js, dbusmenu.js,
atspi.js, portal.js, appearance.js, trayhooks.js.]*

*[step]* Belonging to a desktop means being fluent in about a dozen
conversations. **None of them involve a pixel.**

*[step]* And here is what that buys. `<MenuBar menus={…}/>` hands its menu to
the panel over dbusmenu where one exists, and draws the bar itself where none
does. Same line either way — because the array that draws the menu is the
array that serialises. Not a compatibility shim: one data structure, two
ports.

## 13 · The question I have been putting off

*[Open by admitting it. It gets a laugh and it shows you know.]*

Why would anyone build this? People run JavaScript on the desktop every day.

*[step]* And they do it in one of two ways. You either **wrap a browser** —
Electron ships Chromium and Node together, Tauri borrows the OS webview with
Rust behind it — or you **wrap a toolkit**: nodegui gives you Qt over
bindings, node-gtk gives you GTK through GObject introspection, and
nodegui-react and gtkx put React onto those widgets.

*[step]* Both are good answers, and I want to be clear about that. Electron
ships the editor most of this room writes code in. nodegui hands you real Qt
widgets a Qt developer would recognise.

*[Be generous here. Nobody should feel sold to.]*

*[step]* But look at what they have in common. **Both are wrappers.** One
wraps a rendering engine built for documents. The other wraps a toolkit built
for C++.

*[step]* In neither case is the toolkit itself made of the language you are
writing. There is always a boundary — and the interesting question is what
that boundary costs you, which is different for each. Two slides, one per
column.

## 14 · The browser is very good at the other half

A web page gets **the easy 20% for free**, and it is a colossal 20%: layout,
text shaping, bidi, font fallback, a compositor, an accessibility tree, i18n,
and a rendering pipeline thousands of people have tuned for twenty years.

If your application is a document, this is the right answer. Use it.

*[step]* What it gives up is the other 80%, and it gives it up in a specific
shape. **Nothing your UI draws can leave the page.** A menu cannot become the
desktop's menu — it is a `<div>`. A popup cannot be a real window with its own
hints; it is clipped to the viewport it was born in. A tray icon is not
expressible at all.

*[step]* **And anything that touches the desktop has to be serialised to
another process.** Files, D-Bus, the tray, the global menu, keep-awake,
per-monitor scale — none of it is reachable from the half of your app that
draws. It lives in the main process, in a different language, behind a
channel.

*[step]* So the component that needs the desktop and the code that can reach
it are on opposite sides of a serialisation boundary — and you maintain the
message format between them, by hand, for every interaction.

Which means an Electron app is **also** a protocol client. It is just a
protocol you had to invent, and you are its only implementer.

*[Land this hard. It is the thesis arriving from the other direction, and it
is the moment the talk stops being a curiosity.]*

*[step]* While this slide has been up, this deck has been holding a sleep
inhibitor, so the screen cannot blank mid-talk. One hook — `useKeepAwake()` —
called from the component that cares. No channel, no main process, no message.

## 15 · The other column: real widgets, over a bridge

*[Shorter slide, but do not skip it — without it the talk looks like it only
considered Electron.]*

nodegui hands you Qt. node-gtk hands you GTK. Both give you widgets a native
developer would recognise — the platform's own look, its own accessibility,
its own decades of work — and you implemented none of it. That is a real win,
and it is the thing this project has to work hardest to earn.

*[step]* The cost is a boundary in a different place. **Your tree is not the
widget tree** — it is a script that drives one, and every prop crosses a
language boundary to get there. You inherit their threading model, their event
loop and their build story. And the layer you most want to change is the layer
you cannot reach.

*[step]* So both columns are a boundary. One puts it between your UI and the
desktop; the other between your code and the widgets. Which is the thing
worth sitting with for a moment.

*[End on the observation, not on a conclusion. Put the word "boundary" in the
room's hands and step.]*

## 16 · You cannot remove it. You can only place it.

*[THE HINGE. The most important minute in the first half, and what the last
three slides were for.]*

The pixels are not yours. The display server owns them, so **something** has
to cross that gap — and every design we have looked at has a boundary in it,
including mine. They differ in *where*, not in *whether*.

*[step — the table. Read the third row last, and slowly.]*

Electron puts it between your UI and the desktop, and it is an IPC channel
you invented and are the only implementer of. A binding puts it between your
code and the widgets, and it is a language bridge you cannot see into.

This puts it between you and the display server — and that one is a protocol
specified in 1987, extended many times and never broken, and the one you
watched decode itself twenty minutes ago.

*[The point is NOT that mine is smaller. It is that mine is the only one
somebody else already specified, and the only one you can read without asking
permission.]*

*[step]* So put it at the socket. Below the wire is somebody else's problem —
written down, forty years old, and the same on every machine that speaks it.
Above the wire is **all yours.**

*[step]* Which is a much bigger "all" than it sounds.

So: what does owning everything above a socket actually leave you to write?

---

# React, without a DOM — 6:00

## 17 · React needs a host, not a DOM

Two answers to that, and they are wildly different sizes. Here is the small
one.

React does not need a DOM. It needs a **host**.
`react-reconciler` — the package React DOM and React Native are both built on
— asks for a host config: how to make a thing, put it in another thing, and
update it.

Answer those three and React will drive you. **The reconciler is a protocol
too** — the third row of the table from the cold open.

*[step]* That part is a weekend. Genuinely — a weekend gets rectangles on
screen that update when state changes.

*[step]* And here is the large one. Because the DOM was never just a tree of
nodes — when you remove it you lose everything it was quietly doing for you
and never mentioned.

*[Read this list slowly. It is the honest scope of "from scratch".]*

**Layout** — no box model, no flow, no line boxes. **Text** — shaping, bidi,
ligatures, font fallback, line breaking. **Painting** — damage tracking,
double buffering, clipping, z-order. **Events** — hit testing front-to-back,
capture and bubble, enter and leave, which is not the same as move. **Focus** —
traversal order, focus scopes, what a modal takes and gives back.

*[step]* **That** is "from scratch". The reconciler is the easy end of it —
the browser has been doing that list for you your entire career.

## 18 · Hello, desktop

Ten minutes of me talking about a toolkit and you have not seen a program.

*[The code.]* That is the file. **`bun app.jsx`**, and there is a window on
your screen. No bundler, no dev server, no `index.html` with a div in it to
mount into — and no build step, because the JSX is transpiled on the way in.

*[step]* And those last two lines are the bottom of this deck's own
`src/main.tsx`. Not a simplified example — what is running.

*[step]* Notice where the window is. **`<window>` is in the tree**: an element,
with props, reconciled like everything else. Three things fall out of that for
free. The title is a prop, so put state in it and the titlebar updates. Two
`<window>`s is a multi-window app, with no second API to learn. And a
`<popup>` is a window with different window-manager hints — so menus, tooltips
and dialogs are the same machinery, not a special case.

*[Callback: that is the thing the browser slide said was impossible. A popup
here is a real window, not a div clipped to a viewport.]*

## 19 · One line had already done this

`await createRoot()` is one line. Before your first component rendered, it
connected to the display, loaded the layout engine, **and dialled the session
bus to start three protocol clients**: `appearance`, for the desktop's
light/dark, accent, contrast and reduced motion; `a11y`, the AT-SPI bridge
that decides whether a screen reader can see this app at all; and
`globalMenu`, which decides whether a `MenuBar` hands its menu to the panel or
draws it.

*[step]* And here is how you know that list is engineering and not a brochure:
**you can turn it off.** `{ desktop: false }` for none of it, or one at a
time. For a kiosk. A daemon. A test that needs the same answer on every
machine. An embedder that owns those integrations itself and does not want a
second app fighting it for the bus.

*[step]* That is the dozen conversations from twenty minutes ago, arriving as
the default arguments of a constructor.

## 20 · It reads like the web, because it should

*[The code.]* The goal was one sentence: a web developer should be able to
read this without translating. Not "looks a bit like CSS" — actually reads.

*[step]* But there is no stylesheet here and no cascade — a style is an object
on a node. So the architecture forced all of this.

**Pseudo-states live in the object**, because there is no selector to put them
in — and `:drag-over` and `:dragging` come free. **Container queries, not
media queries**: the interesting size in a desktop app is the pane, never the
screen, so the container query is the primitive and the window query is the
special case. That is the exact opposite of the web's history. **Tokens, not
variables** — `$surface` resolves against the theme, which came from the
desktop over the bus `createRoot` opened. And **transitions on any number or
colour**, because animation belongs to the value.

*[step]* What you give up is real: no cascade, no selectors, no stylesheet you
can ship separately. What you get is that every style is a value in the tree —
which is why the whole thing can be diffed, and why a theme change is just a
re-render.

---

# What's in the box — 7:00

## 21 · The whole box

*[THE SHOWCASE. 4 min, seven steps, `reveal: replace`. One sentence per step,
then STOP TALKING and let them look. No panel names a height — every one
grows into whatever the slide has left, so this reads the same fullscreen and
at any zoom.]*

**Step 1 — all of this is core.** Everything on screen is react-x11 itself,
no components package: a text input, a slider, a switch, checkboxes, a radio
group, a select, buttons, an icon, a progress bar, a tooltip. *[Drag the
weight slider.]* And those are the font file's own axes, read off the machine
this is running on — a variable font, driven from a slider, with an `<svg>`
moving with it. *[Type in the field, and let the specimen and the vector move
together. CAREFUL: clicking the field takes the keyboard, so `space` types a
space. `Esc` gives it back.]*

*[step]* **Step 2 — three documents behind one strip of tabs.** Markdown, a
formula, and HTML. *[Land the HTML tab.]* That `<select>` is not a picture of
a menu — it is the same menu as step one's. And there is no browser and no
webview behind it: the markup was parsed, the CSS cascaded, the boxes laid out
and the text painted in this process. *[Switch tabs and back, to show the
panels stayed alive.]*

*[step]* **Step 3 — a series.** The commit-history numbers, drawn as an area
instead of bars. Nothing new is being claimed; the component is the point.

*[step]* **Step 4 — a sequence.** A timeline, and the one thing on this slide
that registers no element at all: box, text, and one absolutely-positioned
pixel down the gutter.

*[step]* **Step 5 — and a graph you can operate.** *[The slide's best three
minutes if you have them.]* This is react-x11's architecture, drawn by
react-x11: five stages from `setState` to the wire, with the backend swapped
in one place at the bottom. Now watch — *[flip the backend radio]* — a branch
goes. *[Turn the paint cache off]* — the edge under it starts marching.
*[Tick a desktop hook]* — the D-Bus wing appears.

Those are real widgets, inside a drawn graph. Which is the seam worth naming:
a `<Flow>` node normally paints itself, because a graph of ten thousand cards
cannot afford a React subtree each — but a node that wants a switch rather
than a picture of one asks for `render` and gets an ordinary react-x11 tree.
*[The wheel zooms; under 0.6 the form nodes stop mounting, which is the budget
that makes drawing the default.]*

And the wing along the bottom is this deck: `useBadge` reaches the Dock
without touching yoga, paint or the X connection.

*[step]* **Step 6 — a map that pans.** This is live over the network. *[If the
wifi is out it says so and draws the style's background. Say that out loud and
move on.]*

*[step]* **Step 7 — and a scene that spins, beside its own source.** GL through
`<glarea>`. *[Drive it from the bar: spin to 0 and back, wireframe on, swap
the shape, open the colour field. Then hit the SOURCE tab.]* That is the file
this demo is running from, read off disk — not a snippet pasted into a slide.
*[Point at the props in it, and at the widgets that were moving them.]*

*[If behind: cut to steps 1, 5 and 6. Those carry the claim; 2, 3 and 4 are
what people ask about afterwards.]*

## 22 · Booking a flight, on a desktop

*[DEMO. Short, and the argument is on the panel to the right — read it rather
than paraphrasing it.]*

A date range, with the airline's sold-out days blocked. And because a range
may not *contain* a blocked day, the preview stops at the first one — which is
what an airline that marked a date full actually meant.

*[Point at the panel.]* And those dots are the user's own calendar. The panel
says where they came from: a hook, the session bus, the desktop's calendar
service, and behind that Google, Microsoft, CalDAV, local. The desktop signed
into those accounts once, on the user's behalf, for every application on the
machine.

This application asked for **nothing**. No OAuth screen, no credential, no
token to store and none to leak.

*[step]* A web page cannot ask this question at all. It can only ask a server
to ask it, on your behalf, after you have logged in again — and then keep a
token that is worth stealing.

*[That is the strongest argument for desktop integration in the talk. Let it
sit for a second.]*

## 23 · Everything outside your own window

*[Four steps, `reveal: replace`, so arrow DOWN. The pair with 22 is the frame
— say it in the first sentence or this reads as a feature list.]*

That was the desktop being **read** from. This is the other direction —
writing to it — and it is the half a browser tab has no expression for at
all.

*[Do not read the table. Read the last line.]* Every one of those is
**declared, not pushed**: a value a component holds while it is mounted,
cleared on the way out. There is no `clearBadge()` for anybody to forget —
which is the same argument `useKeepAwake` made on the browser slide, arriving
for six more surfaces.

*[step]* **One array, three destinations,** and this is the best forty-five
seconds on the slide. `MenuBar`'s items **are** `com.canonical.dbusmenu`'s
vocabulary — the types say so in as many words, because the alternative was a
second authoring model. So the same array reaches a D-Bus registrar on
Plasma, `setMainMenu` on macOS, or nobody at all on stock GNOME, in which
case `<MenuBar>` draws it itself.

And the application branches on **the answer**, never on the platform:
`if (exported) return null`.

*[If asked why not GTK's `org.gtk.Menus` as well: traffic flows towards
dbusmenu, not away from it. Plasma ships a proxy that converts GTK menus INTO
dbusmenu, so a second exporter is double the work for no new consumer.]*

*[step]* **And where it is empty** — which is the step that makes the other
three believable. The interesting rows are the missing ones, and they are not
the ones you would guess.

The tray is the most Linux-shaped thing on that list, and react-x11 has it
**only on macOS**. The badge is the mirror image: a Dock tile takes any
label, the freedesktop protocol underneath a Linux launcher carries a *count*
and has no text field — so the `23 / 41` this deck has been showing you all
talk appears **nowhere** on a Linux desktop. Silently, and by design.

That is what makes a hook safe to write unconditionally, and it is why
nothing in the first table needed an `if (platform === …)` around it.

*[step]* **Live.** The menu has been installed since this slide came up.

*[In fullscreen the macOS menu bar is hidden until the pointer reaches the top
edge — use that.]* Watch the top of the screen. *[Move the pointer up.]*
`Slide` and `Deck`, in the desktop's own bar, above a fullscreen window. The
same items are in the status item beside the clock, and behind a right-click
on the Dock icon. Three system menus, one array, and none of them is drawn by
this application.

*[Then finish by picking **Slide → Next slide from the desktop's menu.** The
talk advances, and the menu, the status item and the Dock menu all leave with
the slide — which is the unmount half of step 1, demonstrated by walking away
from it.]*

*[CAVEATS. The notification row says osascript rather than cocoa and that is
correct — `UNUserNotificationCenter` wants a bundle identifier and an
unbundled process has none, so the ladder falls to the next rung and posts
anyway. Do Not Disturb may eat the banner in fullscreen; the panel reports
the rung either way, so say so and move on rather than debugging it. On a
Linux machine the bar draws inside the panel and the first row says so, and
the tray row goes grey — both of those are the slide working.]*

*[If behind: steps 1 and 4 carry the claim.]*

## 24 · Your tooling still works

*[Section opener for the next two slides. Deliberately short — they do the
showing.]*

And the reason is the same one as everything else in this talk: **the tools
speak protocols too.** React DevTools does not know about the DOM — it talks
to a backend over a socket, which is how React Native does it. Fast Refresh
needs a module boundary and a re-render, neither of which is a browser thing.
And the JSX source location babel already puts on every element is just…
there.

So a renderer with no DOM does not *implement* any of that. It **qualifies**
for it.

*[step]* Which includes one thing that was not free, and is my favourite:
alt-click any element on screen and your editor opens on the JSX line that
drew it. A hit test, the source location, and spawning `$EDITOR`. About fifty
lines.

*[If the room is warm, do it live — editor already open on a second desktop.
If it is flaky, describe it; the line lands either way.]*

*[step]* DevTools and Fast Refresh are the next two slides, running.

## 25 · The debugger that ships with React

*[DEMO, 2–3 min. Press the button FIRST and keep talking — the UI takes a few
seconds, then the app window appears with the bridge on.]*

The component tree, the props and hook state behind each node, and a profiler
for the commits. In a browser this is an extension talking to the page. Here
it is the standalone app, and the backend talks to it over a socket — which is
why a renderer with no DOM gets it for nothing.

*[step — the launcher.]*

*[step]* Two processes, because the flag is read before React's first commit:
an app cannot be handed DevTools once it is running. **This deck cannot
inspect itself.** What opens is a second app, and the tree in that window is
its tree.

*[step]* *[Now drive it, in this order.]* The tree. Edit `step` on the counter
and watch it re-render. Edit the name in the greeting's hook state. Then take
the **crosshair** and pick a swatch by clicking it **in the app's window** —
not in DevTools. And finally turn on "highlight updates" and watch the ticker
outline itself, once a second.

*[If it does not come up, the panel says which half failed. Move on — the next
slide is the one that gets the reaction.]*

## 26 · Fast Refresh, on a window the desktop owns

*[DEMO, 2 min, and the one to rehearse. Start it, click "count me" a few
times, type something into the field, THEN press the edit button.]*

`node --import react-x11/refresh/register` and nothing else. No accept
handlers, no loader files to copy. Saving a file re-evaluates the modules that
changed and re-renders the components that came from them, in place.

*[step — start it. Click the counter a few times. Type into the field. Now
press "Edit the file".]*

*[step]* The headline changed and its colour changed. **The count did not, and
neither did the half-typed text.** And say the pid out loud: same process,
same window, same X11 connection.

That works because the connection lives *outside* React's tree. There was
nothing to tear down.

*[Better version if the room can see your editor: open the file on a second
screen and save it yourself. The button is the one-projector fallback. It
cycles three variants and the third press restores the file.]*

---

# Under the hood — 4:30

## 27 · The ecosystem

*[Drag a node if the room is warm — it is a real graph, not a picture.]*

This is what you would actually install. An arrow means "depends on".

Down the spine: the workbench, the components package, react-x11 — host
config, style, layout, damage and paint — then ntk, node-x11, and a socket.

*[If asked "doesn't yoga do the layout?": yoga owns the algorithm, react-x11
owns the tree — a yoga node per element, the measure functions text nodes
answer with, and the dirty propagation. Which is why the edge between them
says `measure`.]* Out to the right, what react-x11 pulls in. And two
dashed edges that are **not** dependencies — the visualizer sits *on* the wire
when `DISPLAY` points at it, and react-devtools is joined by a websocket on
port 8097 and nothing else.

*[Worth saying, because it is not drawn: the visualizer's own UI is a
react-x11 app. It is a client of the thing it is debugging.]*

*[step]* Now watch what happens when I dim everything written in JavaScript.

**Three nodes are not.** And the differences between those three are the whole
point. `yoga-layout` is amber, not red: it is compiled, but it ships as
base64-inlined WebAssembly, so there is no toolchain and no `node-gyp`.
`node-x11-dri` is optional, and only if you want OpenGL. And one of them is a
decision I will have to defend later.

## 28 · What happens when state changes

*[Walk it top to bottom, once, slowly.]*

`setState`. **Reconcile** — React's render phase, pure and — remember this
word — *discardable*. **Commit** — host mutations; now my code runs.
**Layout** — yoga, over the dirty subtree. **Paint** — the damaged regions.
**The wire** — batched requests out.

*[step]* Two of those stages are the whole performance story, and both are
about the socket.

**Layout never leaves the process.** If you asked the server how wide a string
is for every text node every frame, that is a round trip per measurement — and
you saw on the visualizer what a round trip costs. So font metrics come across
once and get cached, and everything after that is arithmetic on this side of
the wire.

**Paint sends the smallest rectangle that changed.** A cursor blink in a
terminal is one cell, not one screen.

## 29 · React's render phase is discardable

Now my favourite bug, because it is a bug you can only have if your host is a
protocol.

React will happily call `createInstance` for work it later throws away — a
component that suspended, an interrupted update, a branch it discarded. For
React DOM that is completely fine: you made a div in memory, never appended
it, the garbage collector eats it, nobody finds out.

*[step]* It is **not** fine for `CreateWindow`. By the time I am back from
that call the server has already allocated it. There is a resource on the
other side of the socket with an id, and no garbage collector on this side is
reaching across to free it. Render-phase work leaked real state into another
process.

*[step]* And a second problem that stacks with it: X11 names a window's parent
**at creation time** — it is an argument to `CreateWindow`. But React builds
children before parents. By the time I know the parent, I have already had to
create the child.

*[step]* Two tempting fixes, both bad. Create it detached and reparent later —
an extra round trip and a visible flash. Or stage it as an override-redirect
window and adopt it — worse, and the window manager will notice.

*[step]* The actual fix is a rule: **no X11 calls in the render phase, at
all.** `createInstance` returns a plain object — the description of a window
that does not exist yet. Windows get realized in the **commit** phase,
top-down, so every `CreateWindow` names its real parent from the start.

Which, written down, is just the reconciler's own contract: render is pure,
commit is where effects go. I had to have this bug to learn the rule was not
advice.

---

# Make it fast — 6:00

## 30 · Four budgets, and they fight

Performance here is not one number, it is four, and they trade against each
other — which is unusual, and is what makes it interesting.

*[step]* **Network** — round trips and bytes to the display server. **Local
CPU** — layout, shaping, diffing, in my process. **Server CPU** — what the X
server does with what I sent. And **the raster gate** — how often you are
allowed to draw at all.

*[step]* Optimising one usually spends another. Fewer, larger requests helps
the network and costs server memory. Caching glyphs helps server CPU and costs
a round trip to set up.

There is no single dial. There is a budget you are currently failing, and you
go and find out which one.

## 31 · Text is uploaded once, then referenced

The prettiest mechanism in the whole thing, because it is the one that makes
all four budgets happy at once.

XRender has **glyph sets**: you upload a glyph's bitmap once and get back an
id.

*[step]* `fontkit` shapes a string, which gives me positioned glyph ids. I
check which of those the server has not seen, and upload only those. Then one
request draws the whole run **by id**.

*[step]* Which means a paragraph you have shown before costs one request
containing a list of small integers. Not pixels. Not even characters.
Integers.

*[step]* And here is the trick that made me laugh when I found it. **A glyph
does not have to be a letter.** Upload a solid one-by-one square as a glyph,
composite it in a run with positions and a colour, and that is a filled
rectangle — a run of them is hundreds of filled rectangles in one request.

That is how a terminal draws every cell background on screen in a single call.
The text-drawing path turned out to be the fastest rectangle-drawing path.

## 32 · Every real optimisation was "don't"

The part that transfers even if none of you ever write an X11 client. I went
back through everything I actually did to make this fast, and there was not
one clever algorithm in it. Every single one was a **refusal** — and there is
one per budget, which is what makes them a set.

*[step]* **Don't draw detail nobody can see** — decimate a three-thousand
point series to the pixels it covers. **Don't draw too often** — frame gates,
and pacing that adapts to how long the last frame took. **Don't redraw what
did not move** — clip to the viewport, track damage. **Don't send it twice** —
glyph sets, and geometry in a server-side display list.

*[step]* The terminal got **three times faster on macOS by drawing less
often.** Not by drawing faster. I did not change a single drawing call.

## 33 · Two of the four, running

*[DEMO SLIDE. 3 min, hard stop. `reveal: replace`. Stop both before moving
on.]*

**Don't draw detail nobody can see.** *[The panel.]* This is the deck's own
commit history — a few dozen points, which is the right size for a slide and
the wrong size for the claim.

So: *[press the button]*. That is the components package's own charts example,
in its own window. A million-point series. A streaming section appending sixty
points a second. Small multiples at ninety pixels wide. And under each chart a
HUD printing what the last painted frame actually cost — mode, span, command
count, wire bytes.

*[Zoom in and out of the million and read the byte count out loud.]* It does
not move. **Cost follows pixels, not points.** *[Scroll a chart out of view
and its frame counter freezes — an invisible chart neither paints nor
schedules, while its store keeps appending.]*

*[step]* **Don't draw too often.** *[The flood — twenty thousand lines.]*
Glyph runs for the text, glyph runs for the backgrounds, and a frame gate
deciding how much of that torrent you actually see. The output is correct
either way. The only question is how many frames you spent on it.

*[The other two refusals were the showcase: the flow graph pans and zooms over
a subtree scale, and the GL scene is one `CallList` a frame. Point back rather
than showing them twice.]*

---

# What it cost — 5:00

## 34 · Then macOS happened

Now the honest part, and the decision I said I would have to defend.

The presenter is the interface between the component tree and the platform:
what a window is, what a surface is, how a frame reaches a screen. There is
one for X11. And now there is one for Core Animation — layers instead of
windows, CoreGraphics instead of XRender.

*[step]* Same component tree. Same yoga layout. Same event model. Same
components. One layer per real window, everything else painted into it.

*[Callback: that is the "one window, paint everything into it" decision from
the protocol section, paying for itself on a platform X11 never touched.]*

*[step]* And the cost: the AppKit bridge is a **compiled module**. `node-gyp`
is back. Fifteen years of "pure JS, no bindings" and I broke it.

*[step]* Which is fine, and I want to be clear about why. **"No binary
modules" was never the goal. It was a constraint** — and a good one, because
it forced me to actually implement things instead of binding to something that
already had. It is the reason the layout, text and paint layers are honest
portable code rather than a thin wrapper around a C library.

A constraint that has done its job is allowed to be spent. macOS was worth
spending it on. Wayland and Windows are the same shape of problem — and they
are easier now, because the first backend proved the seam was in the right
place.

*[Beat: this deck is running on that backend right now.]*

## 35 · Do we still need X11?

Mostly, **no**. Wayland is where the Linux desktop went, and I am not going to
stand here and pretend otherwise.

*[Concede the premise immediately and mean it. That is what buys the next
three steps — a defensive answer here sounds like a man who has not noticed
what decade it is.]*

*[step]* But as a *first* backend it was the right one, and the reasons are
about **building** rather than about desktops.

**It is specified** — you can implement it from a document, which is the whole
of the boundary argument and the reason the first backend was a reading
exercise rather than a reverse-engineering one. **It is observable** — you
watched it decode itself, field by field; try that with a shared-memory buffer
handle. And **it already runs everywhere**: every Wayland desktop ships
XWayland, so an X11 client is not a subset of Linux, it is all of Linux today,
unmodified. There are still sessions that come up on X by default.

*[step]* And after the last slide, the honest framing is that **X11 is a
backend, not the architecture.** One presenter drives it. Cocoa was the
second. Wayland is high in the plans, and it is the third time rather than the
first — which was the point of breaking the purity rule.

*[step]* Though there is one thing X11 has that Wayland **deliberately** does
not.

Wayland is a local compositor protocol: buffers are shared memory and file
descriptors, and remote display is a layer built on top — waypipe, RDP, a VNC
server — all of them re-encoding, because there is nothing in the protocol to
forward.

X11 has been able to put a window from one machine onto another machine's
screen since 1987, because that is what it was built for.

*[Say "deliberately" out loud. This is not "Wayland is worse" — it dropped
network transparency on purpose. If somebody asks about waypipe afterwards,
that is the question you wanted.]*

*[step]* So: do we need X11? No. Do we need *a* protocol — chosen
deliberately, with the whole toolkit above it unchanged? That was the entire
argument.

## 36 · The loop

One thing about how this gets built, because I think it is what made the API
coherent.

*[step]* Three steps. **Draft** an application that wants something. Find the
**gap** — the thing this app is about to write for itself, that every app
would have to write for itself. Then **promote** it: out of the app, into the
components package, and if it is fundamental enough, into core.

*[step]* `<Markdown>` exists because a chat client needed it. Drag and drop
moved into core because a reorderable list and a file-drop target turned out
to want the same two props. Nothing here was designed in the abstract.

*[step]* And it happened to this deck while I was writing it. The desktop
calendar you saw earlier used to live in the components package; it moved into
core between two `npm install`s, because reading the user's calendar is one of
the things an app does *outside* its own windows — like notifications and the
tray — and the macOS side of that can only be reached from core. The migration
was two import lines.

## 37 · The dates

*[Read the first three at normal pace.]* node-x11, 2011. ntk, 2012. react-x11,
2015 — and then essentially nothing for eleven years.

*[step — PAUSE before pressing. Let the colour land. Do not talk over it.]*

That is seven weeks.

## 38 · The same seven weeks, by volume

*[Same story, counted instead of dated. Say "it sat there for eleven years"
and nothing else — do NOT re-land "seven weeks", the last slide already did
and saying it twice spends the pause you took for it.]*

*[step — the axis rescales under the last bar. Say nothing. Wait.]*

## 39 · So: AI-assisted development

I want to be careful about how I say this, because the honest version is more
interesting than the marketing one.

**The loop did not change.** Draft, find the gap, promote. What changed is the
*cycle time* between having an idea and knowing whether it was any good.

*[step]* What actually changed. The **design record became the unit of work**
— a written spec per component, before the code and kept after it. Which is,
again, a protocol: an agreement written down before either side implements it.
**Reading and reviewing** became the bottleneck instead of typing. And **"try
it as a throwaway" got cheap enough to do first**, every time — most of the
good decisions in this toolkit are the second or third version of something I
threw away.

*[step]* What did not. Deciding **what** to build, and — much harder — what to
refuse to build. **Protocol-level debugging**: a wrong byte is still a wrong
byte, and nothing helps except the visualizer and patience. And **taste**.
Every API I have shown you today is a judgement call, and the judgement is
fifteen years old.

*[step]* So the honest summary is: this is not "AI wrote a UI toolkit". It is
fifteen years of knowing exactly what I wanted, finally meeting a fast enough
typist.

---

# Close — 1:30

## 40 · What's next for react-x11

The list is not "features I have not built yet" any more. It is the work that
only real use produces.

*[MDX shipped in components 0.6.0 — these slides ARE `.mdx` — and the
workbench is out at 0.2.0 with 74 stories. Both used to be on this list. Do
not read the old one.]*

*[step]* **More backends** — Wayland, and Windows, behind the same node tree.
The presenter seam held for Cocoa, so this is the third time rather than the
first. **Finish the accessibility coverage** — AT-SPI is wired, the coverage
is not, and this is the one I would most like help with. And **keep tweaking
performance**, because there are four budgets and every new application fails
a different one.

*[step]* And the one that matters most: **real users.**

The bug I actually need is one I did not predict. Everything on these slides
is one person's taste, tested against one person's applications — and fifteen
years of knowing exactly what I wanted is also fifteen years of my own blind
spots.

*[step]* So let me pay for that with a bug that has been on screen all
evening.

`<Markdown>` draws the rounded chip behind inline code by reading the span
each laid-out run came from. react-x11's Cocoa text engine reports run
geometry only — so on macOS the chips are skipped.

**Every piece of inline code in this talk has been missing its background.**

*[Point at a piece of inline code on this very slide. It is cosmetic, it is
written down in the README, and admitting it out loud is worth more than the
slide costs. If nobody has a question after the last slide, this beat is
usually what produces one.]*

*[step]* All of it is on GitHub, and the good first issues are real ones.

## 41 · It's all just bytes on a socket

So — the idea I wanted to leave you with.

A desktop toolkit is a protocol client. The wire carries drawing, not pixels.
Belonging to a desktop is a dozen conversations, none of which involve a
pixel. React's reconciler is a protocol. DevTools is a protocol. The presenter
is a protocol I wrote for myself, which is the only reason there is a second
backend.

And an Electron app is one too — it is just a protocol you had to invent.

It's all just bytes on a socket.

*[step — the links.]*

*[step]* Questions. And this slide is an X11 client too.

*[If nobody asks anything, the reliable opener is: "ask me why it's not
Wayland first."]*

---

# Timing, and what to cut

**Press `p` when you start.** The second footer line fills once over the
forty minutes, under the slide line — if it gets ahead of the slide line you
are behind, and the colour says so from the back of the room. `p` again
pauses it for a question.

| act | slides | budget |
| --- | --- | --- |
| Cold open | 01–02 | 2:30 |
| The wire | 03–11 | 9:00 |
| Why build one | 12–16 | 7:00 |
| React, without a DOM | 17–20 | 6:00 |
| What's in the box | 21–26 | 10:00 |
| Under the hood | 27–29 | 4:30 |
| Make it fast | 30–33 | 6:00 |
| What it cost | 34–38 | 5:00 |
| Close | 39–40 | 1:30 |

**51:30**, three of which are slide 23. That does not fit, and the honest
thing is to decide the cuts now rather than discover them at minute 35. In
order:

1. **Showcase steps 2, 3 and 4** (−2:00). The notes already say cut to 1, 5
   and 6.
2. **Slide 07, atoms and properties** (−1:30). The "no policy" line can move
   onto slide 12, which makes the same argument.
3. **Slide 10, wire events** (−1:00). 09 and 11 carry the wire; the event mask
   is a sentence on 09.
4. **Slide 30, four budgets** (−1:30). Slide 32 names all four in its bullets
   already; the "they fight" trade-off becomes its first step.
5. **Slide 26, Fast Refresh** (−2:00). The most painful cut on the list, and
   still the right one if you are at minute 30 with nine slides left.
6. **Slide 23 down to steps 1 and 4** (−1:30). Its own notes say which two:
   the inventory and the live menu carry the claim, and *one array, three
   destinations* and *where it is empty* are what people ask about
   afterwards.

That lands **42:00** with 1–6 applied — **which is still two minutes over,
and that is the true cost of slide 23.** The last two minutes have to come
from somewhere this ladder does not reach, so decide before the day: the
coherent candidates are **slide 13** (the landscape, folded into 12's table)
and **slide 15** (what a binding gives and takes, folded into 14). Neither is
free. The alternative is to run slide 23 as a two-step slide permanently, in
which case the ladder lands 40:30 the way it did before it was added.

**Slide 16 is not on this list.** It is the hinge the three slides before it
exist to reach, and cutting it turns the whole act into a survey with no
conclusion. If you are behind at that point, lose showcase steps.
