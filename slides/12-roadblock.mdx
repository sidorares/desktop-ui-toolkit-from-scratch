---
title: The roadblock — issue #4
notes: |
  My favourite slide in the talk. The impedance mismatch is real and it is
  specific to a *protocol* host. Land the line: "React's render phase is
  discardable. The X server's is not."
  Fix: no X11 calls in createInstance; realize windows top-down in commit.
---

# React's render phase is discardable

`createInstance` can be called for work React later throws away. That is
fine for a DOM node nobody appended.

^^^

It is **not** fine for `CreateWindow`. The server has already allocated it.

^^^

And there is a second problem: X11 names a window's parent *at creation
time*, but React builds children before parents.

^^^

The tempting fixes are both bad — create it detached and `ReparentWindow`
later, or stage it as an override-redirect window and adopt it.

^^^

The actual fix: **do no X11 calls in the render phase at all.** Realize
windows top-down in the *commit* phase, so every `CreateWindow` names its
real parent from the start.

`react-x11#4`
