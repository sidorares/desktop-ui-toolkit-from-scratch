---
title: What you actually write
notes: |
  The "is this a toy?" slide. Answer it with vocabulary, not adjectives.
  Land the CSS-shaped bits — pseudo states and container queries — because
  that is the moment a web developer stops translating and starts reading.
  CUT CANDIDATE if you are running long: the next slide is the one that
  gets the reaction.
---

# It reads like the web, because it should

```jsx
<box
  style={{
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '$surface',
    transition: 150,
    ':hover': { backgroundColor: '$surfaceHover' },
    '@container width >= 400': { flexDirection: 'column' },
  }}
>
  <text style={{ fontSize: 14 }}>Hello</text>
</box>
```

^^^

- Inline styles with **pseudo states** — `:hover`, `:focus`, `:active`,
  `:disabled`, and `:drag-over` / `:dragging` for free
- **Container queries**, including named containers, and window-size queries
- Theme tokens (`$surface`) with **transitions** on any number or colour

^^^

On top of `<window>`, `<popup>`, `<box>`, `<text>`, `<textinput>`,
`<image>`, `<canvas>`, `<svg>` and `<glarea>`: buttons, selects, sliders,
menus, dialogs, tabs, trees, split panes — and a components package with
charts, tables, terminals, maps and a markdown renderer.

**This slide is being drawn by three of them.**
