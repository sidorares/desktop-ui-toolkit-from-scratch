---
title: From protocol to React
notes: |
  Keep the reconciler part SHORT — this is a JS meetup, they know React has
  renderers. The interesting half is the second one: with no DOM underneath,
  everything the DOM was quietly doing becomes yours.
  Read that list slowly. It is the honest scope of "from scratch".
---

# React needs a host, not a DOM

`react-reconciler` asks for a host config — how to make a thing, put it in
another thing, and update it:

```js
createInstance(type, props)      // a retained node — <box>, <text>, …
appendChild(parent, child)       // tree structure
commitUpdate(node, old, next)    // diffed props land here
```

^^^

That part is a weekend.

^^^

The rest is everything the DOM was doing for you and never mentioned:

- **Layout** — yoga, one node per element, run client-side
- **Text** — shaping, bidi, ligatures, font fallback, wrapping
- **Painting** — damage tracking, double buffering, clipping, z-order
- **Events** — hit testing front-to-back, capture and bubble, enter/leave
- **Focus** — traversal order, focus scopes, what a modal takes and returns

^^^

**That** is "from scratch". The reconciler is the easy end of it.
