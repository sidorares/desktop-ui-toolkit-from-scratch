// Which runtime to spawn a child with, and what to print on the slide.
//
// Every launcher used to spawn `process.execPath` with `--import tsx`, on the
// reasoning that the runtime the deck is already working under is the safest
// one to hand a child — no bin lookup, no PATH. That is right, and it broke
// the moment the deck was started with `bun src/main.tsx`, because then
// `process.execPath` is **bun**:
//
//   bun --import tsx examples/charts.tsx
//     → error: Cannot find module './cjs/index.cjs' from ''
//
// `tsx` is a Node loader and bun does not want it — bun transpiles TS and JSX
// on its own, so the fix for that family is to drop the flag rather than to
// force Node. Which is the first of the two rules here.
//
// The second is the exception. `react-x11/refresh/register` needs Node's
// `module.registerHooks`, and bun does not implement it:
//
//   bun --import react-x11/refresh/register examples/hot-demo.jsx
//     → throws: typeof nodeModule.registerHooks !== 'function'
//
// So Fast Refresh is Node-only, and saying so is better than a demo that
// fails on stage with a stack trace about loader hooks. `runOnNode` asks for
// Node by name when the deck itself is not Node, which costs a PATH lookup
// and reports a missing `node` through the panel like any other failure.
//
// **`display` is not decoration.** The launcher slides put the command on
// screen because what the room should leave with is the line they would
// type — so it has to be the line that actually ran, which means deriving it
// here rather than writing it out twice and letting the two drift.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repo root. Exported because every launcher needs it as a `cwd`. */
export const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** What is running this deck. */
export const RUNTIME: 'bun' | 'node' = 'Bun' in globalThis ? 'bun' : 'node';

/** Files Node cannot run without a loader, and bun can. */
const NEEDS_LOADER = /\.(tsx?|jsx)$/;

export interface Spawn {
  command: string;
  args: string[];
  /** The same thing, as a presenter would type it. */
  display: string;
}

function resolve(file: string): { abs: string; shown: string } {
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  return { abs, shown: path.isAbsolute(file) ? file : file };
}

/**
 * Run a script with the deck's own runtime.
 *
 * Under bun that is bun, with nothing in front of the filename. Under Node it
 * is Node, with `--import tsx` only when the file is TypeScript or JSX — the
 * plain `.js` examples the visualizer runs need no loader and should not
 * carry the cost of one.
 */
export function runScript(file: string, extra: string[] = []): Spawn {
  const { abs, shown } = resolve(file);
  if (RUNTIME === 'bun') {
    return {
      command: process.execPath,
      args: [abs, ...extra],
      display: `bun ${shown}${extra.length ? ' ' + extra.join(' ') : ''}`,
    };
  }
  const loader = NEEDS_LOADER.test(abs) ? ['--import', 'tsx'] : [];
  return {
    command: process.execPath,
    args: [...loader, abs, ...extra],
    display: `${loader.length ? 'npx tsx' : 'node'} ${shown}${
      extra.length ? ' ' + extra.join(' ') : ''
    }`,
  };
}

/**
 * Run a script on Node specifically, for the one demo that needs Node's own
 * loader hooks. When the deck is Node this is `process.execPath` and costs
 * nothing; when it is bun this is a PATH lookup for `node`, and a machine
 * without one fails visibly in the panel rather than quietly.
 */
export function runOnNode(flags: string[], file: string): Spawn {
  const { abs, shown } = resolve(file);
  return {
    command: RUNTIME === 'node' ? process.execPath : 'node',
    args: [...flags, abs],
    display: `node ${flags.join(' ')} ${shown}`.replace(/\s+/g, ' '),
  };
}
