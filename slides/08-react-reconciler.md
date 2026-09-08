---
title: From protocol to React
notes: |
  Keep the reconciler explanation SHORT — this audience is a JS meetup, they
  know React. The interesting part isn't "React can have renderers", it's
  which host operations X11 forces you to implement.
---

# React needs a host, not a DOM

`react-reconciler` asks for a host config: how to create an instance,
append a child, commit an update, and measure.

^^^

```js
createInstance(type, props)      // a retained node — <box>, <text>, …
appendChild(parent, child)       // tree structure
commitUpdate(node, old, next)    // diffed props land here
```

^^^

There is no DOM underneath. The nodes are **ours** — they hold a yoga
layout node, a style, and enough state to paint themselves.
