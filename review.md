# An editorial read

The deck read as a member of the audience would read it — prose only, no
speaker notes, start to finish — and judged as a story rather than as slides.
The question was: *is it interesting, and is it coherent?*

**Short answer: coherent, yes — much more than a month ago. Interesting, yes,
in most places, with one long stretch where the room has no stake yet and
three places where it says the same thing twice.** The spine holds: the
thesis is stated on 02, and by 39 it has been demonstrated at six layers
without anyone having to be told it was being demonstrated. That is the hard
part and it is done.

What follows is ranked by how much it would change the talk.

---

## 1. The wire act comes before the room has a reason to care

Slides 03–11 are nine slides on X11: two concept slides, three dense ones on
ids, windows and atoms, a tool, and three live demos. They are the most
*original* material in the deck — nobody at a JS meetup has watched X11
decode itself — and they are well written. But at slide 05 the audience does
not yet know why a JavaScript developer should care what a resource id is.
The motivation (12–16: what a toolkit is, what exists, the two ceilings, the
boundary) comes *after*.

The wire act is also structurally sound on its own terms: 05–07 are setup and
09–11 are their payoff, with the tool in between. Say-then-show. The problem
is only that the whole block is early.

**The fix worth considering: move 12–16 before 05–11.** The story would run:

> 03 X11 is a protocol → 04 node-x11 sat there for fifteen years → 12 so what
> *is* a toolkit → 13 what exists → 14 the browser's ceiling → 15 the
> binding's ceiling → 16 **put the boundary at the socket** → *"so let us look
> at that socket"* → 05–07 what it gives you → 08–11 on the wire → 17 and
> here is what is left for you to write.

Two things happen. The wire demos land on an audience that already knows
*this is the boundary I would choose*, which is a far better way to watch
twenty-two messages crawl across a screen. And 16 becomes a hinge in both
directions: "below the wire is somebody else's problem — let me show you how
much of a problem it is not — and above it is mine, which is the next act."

It is the single biggest improvement available, and it is also the most
expensive: a renumber of ten files, two hand-offs rewritten (04's and 16's),
`acts.ts`, and the narration. Twenty minutes. **It is your call, and I have
not made it** — but if the first rehearsal shows the room drifting around
slide 06, this is why.

The cheap alternative, if the order stays: make 04's hand-off carry a stake.
Right now it says "it is worth ten minutes on what that library talks to" —
an announcement. It should promise the payoff: *"and the reason it sat there
for fifteen years is that I had not understood what those bytes were* for.
*Ten minutes on that, because it turns out to be the whole argument."*

## 2. Three diagrams of overlapping things in six slides

- **21 step 5** — the architecture as an operable `<Flow>`: five stages from
  `setState` to the wire, backend swapped at the bottom, real widgets in the
  nodes. The notes call it the showcase's best three minutes. They are right.
- **26** — the ecosystem as a `<Flow>`: the packages and their dependencies.
- **27** — the pipeline, in ASCII: the same five stages as 21 step 5, drawn
  in text.

27 is the weakest of the three and it duplicates the strongest. **Make 27's
content the operable architecture graph** — the one from the showcase —
with the two prose points ("layout never leaves the process", "paint sends
the smallest rectangle") beside it. The best demo in the deck then sits under
the argument it illustrates instead of in a tour, and the ASCII goes. The
showcase drops to six steps, which the notes already say is one too many.

## 3. The showcase is a tour, not a claim

Read the headings of 21 in order: *All of this is core · Three documents · A
series · a sequence · a graph · A map · a scene.* None is a claim, and it is
seven steps between two slides (20, 22) that are both making arguments. It
reads as the moment the talk stops arguing and starts showing off — which is
fine for two minutes and not for four.

**Cut to steps 1, 5 and 7** (core widgets; the graph, if it does not move to
27; GL beside its source) — which is what the notes already recommend — and
give the slide's title a claim to sit under. The obvious one is a callback:
17 listed everything the DOM was doing for you; this is *"Everything the DOM
was doing — done."* That turns a tour into evidence.

## 4. The same chart, three times

`<Charts>` — the commit history — is on 21 ("a series"), 32 (under the
million-point launcher), and 36 (the axis rescale). Only 36 uses the data as
*data*. On 21 it could be any series; on 32 it is filler under a button that
is the real demo. Three appearances of one dataset reads as "I only had one
dataset." **Drop it from 32** — the launcher is the slide — and if 21 keeps
its chart step, let it be any series but this one.

## 5. 35 and 36 are one beat, twice

35 lands "seven weeks" with the dot colour. 36 lands it again with the axis.
36's own prose admits it: *"same story, counted instead of dated."* The
rescale is a lovely moment, but it is the second punchline to the same joke,
and the pause 35 asked for gets spent twice. **Either cut 36, or cut 35's
prose to just the timeline and let 36 be the only place the number is
said.** One slide's worth of pause, not two.

## 6. Two questions the room will ask, unanswered

**"Why X11 in 2026? Wayland is the future."** ~~Unanswered.~~ **Answered:**
slide 34, *Do we still need X11?*, immediately after Cocoa — because the good
answer leans on the presenter seam and the seam is only proved on 33. Opens by
conceding ("mostly, no"), then makes the case for X11 as a *first* backend on
build-time grounds (specified, observable, universal via XWayland), then lands
the sting: Wayland dropped network transparency deliberately, and remote
display is a layer on top rather than a hole in it. Slide 03 carries a
one-clause promissory note so the wire act is not heard by a room composing an
objection.

**"Why not React Native for desktop?"** It is the third thing a React room
thinks of, after Electron and Tauri. 13's notes have the answer (same shape as
the right-hand column — a JS tree driving a native widget tree over a bridge).
It should be a row in 13's table so the slide answers it before the Q&A does.

## 7. Small things that would trip on stage

Applied, because none of them is a judgement call:

- **12** opened with "rectangles that take clicks, *text drawn by id*, and a
  key-value store" — but text-by-id is slide 30, which nobody has seen yet.
  Now "ids you invent".
- **19** closed on "Act I's dozen conversations" — the audience does not know
  acts by number. Now names the slide.
- **33** never says it is the decision 26 promised to defend; only the
  narration did. Now it does.
- **34**'s third step is the markdown-fence example, which is stale and
  unverifiable. Replaced with the one that happened to this deck between two
  `npm install`s — the desktop calendar moving from components into core —
  which is exactly the loop, and is what the narration already says.
- **37** "every API on the previous twelve slides" — stale count. Now "every
  API you have seen tonight".
- **39** drops the Electron line, which is the intellectual peak of the first
  half. Added.

---

## Where the interest is

For calibration, the slides that a smart audience member would remember
tomorrow, as I read it:

| slide | the moment |
| --- | --- |
| 02 | the deck is the demo |
| 05 | an id is a future; the protocol gave the names away at the door |
| 07 | the clipboard is a negotiation — *that* is why quitting loses it |
| 14 | an Electron app is also a protocol client, one you invented |
| 16 | you cannot remove the boundary, only place it |
| 18 | `bun app.jsx`, and there is a window |
| 22 | the calendar asked for nothing — no OAuth, no token to leak |
| 28 | a bug that can only exist when your host is a protocol |
| 30 | a glyph does not have to be a letter |
| 32 | a million points and the byte count does not move |
| 38 | the bug that has been on screen all evening |

Eleven in thirty-nine, spaced every three or four slides. That is a good
rhythm. The sags are 15, 23, 27, 29, 34 and 36 — of which two are
redundancies (27, 36), two are setup slides that could fold into what follows
(23, 29), and two are content that is needed but flat (15, 34). Nothing
sags for more than one slide at a time, except the stretch in §1.

## Does it meet the brief?

*Tell a story* — yes. One thesis, six layers, stated and paid off.

*Explain what and why* — yes, and the "why" is now the strongest part: 12–16
is a real argument, not a survey.

*Teach something new* — yes, in the wire act above all. Resource ids as
futures and the clipboard as a negotiation are things most of the room has
used for twenty years without knowing.

*Provoke questions* — mostly. The confession on 38 will produce one. The two
in §6 should be pre-empted so the questions that come are the interesting
ones rather than the predictable ones.
