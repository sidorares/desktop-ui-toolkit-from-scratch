// The step machine: what `↓` / `space` advance *inside* a slide, as against
// `→`, which moves between slides.
//
// A slide's steps are not declared anywhere. They are counted from the
// source: a line of `^^^` on its own is a reveal point, so a slide with two
// of them has three steps, and adding a bullet plus a marker adds a step
// without touching any manifest. `slides.ts` does the counting; this file is
// what a demo reads to find out where the talk has got to.
import { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';

export interface StepState {
  /** 0-based, and never past `steps - 1`. */
  step: number;
  /** How many steps this slide has — at least 1. */
  steps: number;
}

const StepContext = createContext<StepState>({ step: 0, steps: 1 });

export function StepProvider({
  value,
  children,
}: {
  value: StepState;
  children: ReactNode;
}): ReactElement {
  return <StepContext value={value}>{children}</StepContext>;
}

/** Where the slide has got to. Demos read this to drive their own state. */
export function useStep(): StepState {
  return useContext(StepContext);
}

/**
 * The value for the step the slide is on, clamped at both ends:
 *
 * ```tsx
 * const preset = at(useStep().step, 'lan', 'slow-3g', 'satellite');
 * ```
 *
 * Fewer values than steps is the common case — the last one holds for every
 * step after it, which is what "and it stays like that" looks like.
 */
export function at<T>(step: number, ...values: T[]): T {
  if (values.length === 0) throw new Error('at() needs at least one value');
  return values[Math.max(0, Math.min(step, values.length - 1))]!;
}

/** Renders its children once the slide has reached step `n`. */
export function Step({
  n,
  children,
}: {
  n: number;
  children: ReactNode;
}): ReactNode {
  return useStep().step >= n ? children : null;
}
