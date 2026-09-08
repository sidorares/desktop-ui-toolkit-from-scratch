// `npm start` — the deck, reading `slides/` from disk.
//
// Slides are watched, not bundled: the file on disk *is* the deck, so a save
// in the editor is the whole dev loop. `r` re-reads on demand as well, which
// is what a presenter wants when a slide is edited from another machine —
// and the fallback for the platforms where a watch does not fire.
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { createRoot } from 'react-x11';

import { Deck } from './deck.js';
import { isSlideFile, loadSlides } from './slides.js';
import type { Slide } from './slides.js';

const SLIDES_DIR = fileURLToPath(new URL('../slides', import.meta.url));

/** How long to wait for a save to settle before re-reading. */
const SETTLE_MS = 80;

function App({ initial }: { initial: Slide[] }): ReactElement {
  const [slides, setSlides] = useState(initial);
  const [generation, setGeneration] = useState(0);

  const reload = useCallback(() => setGeneration((n) => n + 1), []);

  // Watch the *directory*, not the files in it. Most editors save by writing
  // a temp file and renaming it over the original, which leaves a per-file
  // watch pointed at an inode nothing will ever write to again — a directory
  // watch sees that rename either way, and sees a *new* slide file too.
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const watcher = watch(SLIDES_DIR, (_event, name) => {
      // `name` is null on the platforms that do not report one; a reload we
      // did not need is cheaper than an edit we missed.
      if (name !== null && !isSlideFile(name.toString())) return;
      // One save is often a rename *and* a write, sometimes several of each.
      // A burst of events is still one edit.
      clearTimeout(timer);
      timer = setTimeout(reload, SETTLE_MS);
    });
    watcher.on('error', (err: unknown) => console.error('watch failed:', err));
    return () => {
      clearTimeout(timer);
      watcher.close();
    };
  }, [reload]);

  // The deck's own state — which slide, which step, zoom, fullscreen — lives
  // in `<Deck>` and is untouched by this: only the slide *data* is replaced,
  // so a reload lands on the slide being edited, at the step it was on.
  useEffect(() => {
    if (generation === 0) return;
    let live = true;
    loadSlides(SLIDES_DIR).then(
      (next) => {
        if (live) setSlides(next);
      },
      (err: unknown) => console.error('reload failed:', err),
    );
    return () => {
      live = false;
    };
  }, [generation]);

  return <Deck slides={slides} onReload={reload} />;
}

const initial = await loadSlides(SLIDES_DIR);
const root = await createRoot();
root.render(<App initial={initial} />);
