// Whether the DevTools *backend* can be loaded at all — the third state of
// the DevTools slide, and the only one that used to be silent.
//
// react-x11 imports `react-devtools-core` and `ws` lazily, inside the branch
// `REACT_X11_DEVTOOLS=1` takes, and it warns on stdout and carries on when
// that import throws. So a checkout without them puts up an app window that
// looks exactly right and a DevTools window that sits on "Waiting for React
// to connect…" forever — which from the back of the room is indistinguishable
// from a bridge that is merely slow, and the only evidence is a line of
// stdout nobody is looking at.
//
// One check, in one place, read by both halves: the launcher refuses to start
// a demo that cannot work (`devtools.ts`), and the demo names the reason on
// its own window (`examples/devtools-demo.tsx`). Two copies of this would be
// two answers to one question, and the wrong one would be the one on screen.
import { createRequire } from 'node:module';

/** What react-x11 imports when the flag is set. These are `dependencies` of
 *  this repo rather than devDependencies for exactly this reason: they are
 *  what a demo that ships here needs in order to run, so `--omit=dev` — or a
 *  prune — must not be able to take the bridge away. */
export const BACKEND_PACKAGES = ['react-devtools-core', 'ws'] as const;

/**
 * Which of them cannot be resolved from `from` — a file path or `file:` URL
 * in the resolution root the demo will run in.
 *
 * Resolution rather than `import()`: this asks the question the lazy import
 * is about to ask, without paying for the megabyte of backend bundle behind
 * it and without half-loading anything if the answer is no.
 */
export function missingBackend(from: string): string[] {
  const require = createRequire(from);
  return BACKEND_PACKAGES.filter((pkg) => {
    try {
      require.resolve(pkg);
      return false;
    } catch {
      return true;
    }
  });
}

/** The remedy, in one line, or `''` when there is nothing to remedy. Said in
 *  the imperative because it is read by somebody standing in front of an
 *  audience with a slide that did not start. */
export function backendRemedy(missing: string[]): string {
  if (!missing.length) return '';
  const verb = missing.length > 1 ? 'are' : 'is';
  return `${missing.join(' and ')} ${verb} not installed — run \`npm install\``;
}
