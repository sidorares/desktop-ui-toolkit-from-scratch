---
title: Why not just a browser?
notes: |
  Be fair to the browser here — it's a great platform. The honest framing
  is "different set of things is hard". Then: this deck itself is holding a
  sleep inhibitor right now, which no web page can do.
---

# The browser is very good at the other half

A web page gets layout, text shaping and a compositor for free — and gives
up the desktop.

^^^

| the browser has | the desktop has |
| --- | --- |
| layout, fonts, compositing | the *user's* window manager |
| one sandbox, one tab | files, D-Bus, the tray, the global menu |
| `visibilitychange` | keep-awake, idle, per-monitor scale |

^^^

While this slide is on screen, the deck is holding a **sleep inhibitor** so
the screen cannot blank mid-talk. One hook: `useKeepAwake()`.
