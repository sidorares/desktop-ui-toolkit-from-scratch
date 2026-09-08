// `npm start` — the deck, reading `slides/` from disk.
//
// Slides are re-read on `r` rather than watched, because a talk is written
// by editing one file and looking at it: a watcher that reloads mid-sentence
// is a worse experience than a keypress that reloads when asked.
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { fileURLToPath } from 'node:url';

import { createRoot } from 'react-x11';

import { Deck } from './deck.js';
import { loadSlides } from './slides.js';
import type { Slide } from './slides.js';

const SLIDES_DIR = fileURLToPath(new URL('../slides', import.meta.url));

function App({ initial }: { initial: Slide[] }): ReactElement {
  const [slides, setSlides] = useState(initial);
  const [generation, setGeneration] = useState(0);

  const reload = useCallback(() => setGeneration((n) => n + 1), []);

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
