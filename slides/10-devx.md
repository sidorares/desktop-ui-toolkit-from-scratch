---
title: Your tooling still works
notes: |
  THE APPLAUSE SLIDE. Don't rush it — this is where "clever hack" becomes
  "I could actually use this".
  If the room is warm, do it live: alt-click a slide and let your editor
  jump to the JSX that drew it. Have the editor already open on a second
  desktop. If anything is flaky, just describe it — the list alone lands.
---

# React DevTools. On an X11 window.

^^^

- The component tree, props and hook state, **live** — and editing them
  re-renders the app
- The crosshair picks an element by clicking it **in the window**
- "Highlight updates" outlines the rects that just re-rendered
- The Profiler records the mount

^^^

**Fast Refresh**, too. Save a file and the edited components update in
place — the X11 connection, the window, and component state all survive.
Half-typed text in an input is still there.

^^^

And **alt-click any element to open the JSX line that drew it**.

```
REACT_X11_EDITOR=code npm start
```

^^^

None of that is bespoke. It is React's own tooling, talking to a renderer
that happens to draw on a display server.
