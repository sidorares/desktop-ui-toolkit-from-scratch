// The hot-reload demo: the example, run under react-x11's refresh loader,
// and the edit the slide can make to it.
//
// The edit is here because of where the demo is given. The honest version is
// a second screen with an editor on it, and if the room can see that, use it
// — but a talk that has one projector still has to *show* a save landing in
// a running window, so the slide can make the edit itself. It rewrites two
// marked lines in the example and lets the loader's watcher do exactly what
// it would do for an editor.
//
// The variants cycle, and index 0 is the text as committed, so pressing the
// button all the way round leaves the working tree clean — which matters
// when the file being edited live is a file under version control.
import { readFile, writeFile } from 'node:fs/promises';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createStore,
  IDLE,
  isLive,
  killGroup,
  spawnDetached,
} from './processes.js';
import type { ProcessState } from './processes.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** What gets run, relative to the root — the entry that mounts. */
export const EXAMPLE = 'examples/hot-demo.jsx';

/** What gets edited. A module is a refresh boundary when every export of it
 *  is a component, so the components live one file away from the mount: an
 *  edit re-evaluates *this* file and stops, where an edit to the entry would
 *  re-run `createRoot` and open a second window. */
export const EDITED = 'examples/hot-demo-app.jsx';

/** What the button does, in the form a presenter would type. */
export const COMMAND = `node --import react-x11/refresh/register ${EXAMPLE}`;

/** What "apply an edit" cycles through. [0] is the file as committed. */
export const EDITS = [
  { headline: 'Edit me while I run', accent: '#2980b9' },
  { headline: 'Same window. Same state.', accent: '#8e44ad' },
  { headline: 'The count did not move.', accent: '#16a085' },
] as const;

export interface HotReloadState {
  app: ProcessState;
  /** Which of `EDITS` is in the file right now. */
  edit: number;
  note: string;
}

const store = createStore<HotReloadState>({ app: IDLE, edit: 0, note: '' });

export const subscribe = store.subscribe;
export const getState = store.get;

export function isRunning(state: HotReloadState = store.get()): boolean {
  return isLive(state.app);
}

let app: ChildProcess | null = null;
let generation = 0;

export function start(): void {
  if (isRunning()) return;
  const run = ++generation;
  store.set({ note: '', app: { status: 'starting', detail: `${EXAMPLE}, refresh loader` } });
  app = spawnDetached({
    // The loader is a `--import`, so this is `npm run example:hot` with the
    // deck's own node rather than a shell.
    command: process.execPath,
    args: [
      '--enable-source-maps',
      '--import',
      'react-x11/refresh/register',
      path.join(ROOT, EXAMPLE),
    ],
    cwd: ROOT,
    onStderr: (note) => run === generation && store.set({ note }),
    onError: (detail) => {
      app = null;
      if (run === generation) store.set({ app: { status: 'failed', detail } });
    },
    onExit: (detail) => {
      app = null;
      if (run === generation) store.set({ app: { status: 'exited', detail } });
    },
  });
  if (run !== generation) return;
  store.set({ app: { status: 'running', detail: `pid ${app.pid} — watching for saves` } });
}

/** Down, and the file back to the text it is committed with. */
export function stop(): void {
  generation++;
  killGroup(app);
  app = null;
  store.set({ app: IDLE, note: '' });
  void writeEdit(0).then(
    () => store.set({ edit: 0 }),
    (err: unknown) => store.set({ note: reason(err) }),
  );
}

/** The next variant, written to disk — which is all a save is. */
export async function applyEdit(): Promise<void> {
  const next = (store.get().edit + 1) % EDITS.length;
  try {
    await writeEdit(next);
    store.set({ edit: next, note: '' });
  } catch (err) {
    store.set({ note: reason(err) });
  }
}

const MARKERS = [
  {
    line: /^const HEADLINE = .*\/\/ hot:headline$/m,
    write: (edit: (typeof EDITS)[number]) =>
      `const HEADLINE = ${JSON.stringify(edit.headline)}; // hot:headline`,
  },
  {
    line: /^const ACCENT = .*\/\/ hot:accent$/m,
    write: (edit: (typeof EDITS)[number]) =>
      `const ACCENT = '${edit.accent}'; // hot:accent`,
  },
] as const;

async function writeEdit(index: number): Promise<void> {
  const file = path.join(ROOT, EDITED);
  const source = await readFile(file, 'utf8');
  const edit = EDITS[index]!;
  let next = source;
  for (const marker of MARKERS) {
    if (!marker.line.test(next)) {
      throw new Error(`${EDITED}: the ${marker.line.source} marker is gone`);
    }
    // A function replacement, so a `$` in the text is a `$`.
    next = next.replace(marker.line, () => marker.write(edit));
  }
  if (next !== source) await writeFile(file, next);
}

function reason(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message.length > 160 ? `${message.slice(0, 157)}…` : message;
}
