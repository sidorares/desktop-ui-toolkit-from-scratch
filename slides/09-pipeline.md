---
title: One update, end to end
notes: |
  Walk it left to right, once, slowly. The two things to land:
  (1) layout is yoga, not the server; (2) only damaged regions are sent.
  TODO: replace the ASCII with a drawn diagram — a `demo: pipeline` that
  animates a state change travelling through the stages.
---

# What happens when state changes

```
  setState
     │
     ▼
  reconcile ─────── render phase: pure, discardable
     │
     ▼
  commit ────────── host mutations: create, append, update
     │
     ▼
  layout ────────── yoga, client-side, no round trip
     │
     ▼
  paint ─────────── damaged regions only
     │
     ▼
  the wire ──────── drawing commands, not pixels
```

^^^

Two of those stages are the whole performance story: **layout never leaves
the process**, and **paint sends the smallest rectangle that changed**.
