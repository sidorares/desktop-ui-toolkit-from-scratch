---
title: Make it work, then make it fast
notes: |
  Section opener. The reason perf is *interesting* here is that there are
  several independent budgets and they trade against each other — which is
  unusual. Name all four, then spend the next slides on them.
---

# Four budgets, and they fight

^^^

- **Network** — latency and throughput to the display server
- **Local CPU** — layout, shaping, diffing, in our process
- **Server CPU** — what the X server does with what we send
- **The raster gate** — how often we are allowed to draw at all

^^^

Optimising one usually spends another. Sending fewer, larger requests helps
the network and costs server memory. Caching glyphs helps the server and
costs a round trip to set up.
