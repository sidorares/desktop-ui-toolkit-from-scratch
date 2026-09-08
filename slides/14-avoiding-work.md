---
title: The fastest work is the work you skip
notes: |
  This is the practical half — it's the advice that transfers to their day
  jobs even if they never write an X11 client. Give each bullet a concrete
  number if you have one.
---

# Every real optimisation was "don't"

^^^

- **Don't draw what isn't visible** — clip to the viewport before painting
- **Don't handle every event** — coalesce motion, drop stale frames
- **Don't draw detail nobody can see** — decimate a 3,000-point series to
  the pixels it actually covers
- **Don't draw too often** — frame gates, and pacing that adapts to how
  long the last frame took

^^^

The terminal got 3× faster on macOS by drawing *less often*, not by drawing
faster.
