---
title: All of it at once
reveal: replace
notes: |
  DEMO SLIDE — 3 min, hard stop. `reveal: replace`, so each step swaps the
  demo rather than stacking them; arrow DOWN between them.
  Order: charts (decimation), terminal (flood), flow (pan and zoom), 3D
  (display lists). Say one sentence per demo, then move.
  If you are behind schedule, cut to charts and terminal only — they carry
  the argument and the other two are eye candy.
  The real examples in the repo are richer than these; alt-tab to them if
  the room is engaged and you have time.
---

# 3,000 points, decimated to the pixels you can see

```demo
name: charts
height: 380
```

^^^

# A terminal, flooded

```demo
name: terminal
height: 380
command: bash -lc "yes 'the wire carries drawing, not pixels' | head -20000"
```

^^^

# A canvas that pans and zooms

```demo
name: flow
height: 380
note: pan/zoom over a subtree scale — see components #63
```

^^^

# And geometry, in a server-side display list

```demo
name: three
height: 380
note: <glarea> over indirect GLX — one CallList per frame
```
