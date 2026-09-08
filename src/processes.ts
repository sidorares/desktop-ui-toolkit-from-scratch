// Child processes a slide can start, and the store shape a slide watches
// them through. Two demos need this — the DevTools pair and the hot-reload
// example — and both need the same three unobvious things.
//
// **Module scope, not component state.** `<Prose>` is keyed on `slide:step`,
// so every keypress remounts the whole slide. A demo that owned its children
// in `useState` would kill and respawn them on every `↓`, and stepping away
// and back would lose the window the audience is looking at. The processes
// live outside React; a component is a view of them.
//
// **Their own process group.** `react-devtools` is a node script that spawns
// Electron as a *child*, so signalling the script alone leaves a window on
// screen with nothing owning it. `detached` makes each child a group leader
// and `kill(-pid)` takes the group.
//
// **Not outliving the deck.** A detached child survives its parent, and
// Ctrl+C reaches the deck's group but not theirs — so the deck has to say so
// explicitly. The hooks are armed only while something is running, so a deck
// that never opens these slides keeps its default signal handling.
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';

export type Status = 'idle' | 'starting' | 'running' | 'exited' | 'failed';

export interface ProcessState {
  status: Status;
  /** One line for the slide: a pid, a port, or why it did not start. */
  detail: string;
}

export const IDLE: ProcessState = { status: 'idle', detail: '' };

/** True while a demo has anything of its own on screen. */
export function isLive(...states: ProcessState[]): boolean {
  return states.some((p) => p.status === 'starting' || p.status === 'running');
}

// ---------------------------------------------------------------------------
// The store `useSyncExternalStore` reads
// ---------------------------------------------------------------------------

export interface Store<T> {
  get(): T;
  set(patch: Partial<T>): void;
  subscribe(listener: () => void): () => void;
}

/**
 * A snapshot replaced only when something changed, which is what
 * `useSyncExternalStore` requires of `getSnapshot` — a fresh object per call
 * is an infinite render loop rather than a subtle bug.
 */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Spawning, and taking it all down again
// ---------------------------------------------------------------------------

const live = new Set<ChildProcess>();

function teardown(): void {
  for (const child of live) killGroup(child);
  live.clear();
}

const onExit = (): void => teardown();
const onSignal = (): void => {
  teardown();
  // 130 is the shell's "terminated by Ctrl+C", which is what happened.
  process.exit(130);
};

function arm(): void {
  if (live.size !== 1) return;
  process.on('exit', onExit);
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);
}

function disarm(): void {
  if (live.size !== 0) return;
  process.off('exit', onExit);
  process.off('SIGINT', onSignal);
  process.off('SIGTERM', onSignal);
}

/**
 * Lines from a child that are not about the child. macOS logs input-method
 * chatter through NSLog on any process that opens a window — `+[IMKClient
 * subclass]: chose IMKClient_Modern` — and a slide that paints the last
 * stderr line in red would show that as the demo's error.
 */
const NOISE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+ \S+\[\d+:\w+\]/;

/** A child that thinks it is talking to a terminal colours its output. */
const ANSI = /\u001B\[[0-9;]*m/g;

export interface SpawnRequest {
  command: string;
  args: string[];
  cwd: string;
  /** Merged over the deck's own environment. */
  env?: NodeJS.ProcessEnv;
  /** The last line the child wrote to stderr, as it arrives. */
  onStderr?: (line: string) => void;
  /** It never started — a missing binary, usually. */
  onError?: (message: string) => void;
  /** It is gone, and this says how. */
  onExit?: (detail: string) => void;
}

export function spawnDetached({
  command,
  args,
  cwd,
  env,
  onStderr,
  onError,
  onExit: onChildExit,
}: SpawnRequest): ChildProcess {
  const child = spawn(command, args, {
    cwd,
    detached: true,
    env: env ? { ...process.env, ...env } : process.env,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  live.add(child);
  arm();

  // Neither the child nor its pipe is a reason for the deck to stay up; the
  // exit hook is what takes them down with it.
  child.unref();
  // A pipe is a Socket at runtime, and `Readable` in the types.
  (child.stderr as unknown as { unref?: () => void } | null)?.unref?.();
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', (chunk: string | Buffer) => {
    const line = String(chunk)
      .replace(ANSI, '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !NOISE.test(l))
      .at(-1);
    if (line) onStderr?.(line.slice(0, 160));
  });

  const forget = (): void => {
    live.delete(child);
    disarm();
  };
  child.on('error', (err) => {
    forget();
    onError?.(err instanceof Error ? err.message : String(err));
  });
  child.on('exit', (code, signal) => {
    forget();
    onChildExit?.(signal ? `stopped (${signal})` : `exited (code ${code ?? 0})`);
  });
  return child;
}

/** The child's whole process group — see `detached`, above. */
export function killGroup(child: ChildProcess | null | undefined): void {
  if (!child?.pid) return;
  live.delete(child);
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone, which is the outcome being asked for
    }
  }
  disarm();
}
