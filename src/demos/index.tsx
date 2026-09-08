// The demo registry: what a ```demo fence in a slide resolves to.
//
// A slide says *which* demo and how tall it is; it never imports one. That
// keeps the slides plain markdown — the property this deck is built around —
// and it keeps every demo in one place, which is where the talk's second
// half does its arguing. A demo reads `useStep()` to find out where the
// slide has got to, so the same component can be the "before" and the
// "after" of a performance story without the slide knowing.
import type { ComponentType, ReactElement } from 'react';

import { Charts } from './charts.js';
import { Placeholder } from './placeholder.js';
import { VtTerminal } from './terminal.js';

/** Everything after `name:` in a ```demo fence, as strings. */
export interface DemoProps {
  options: Record<string, string>;
}

const DEMOS: Record<string, ComponentType<DemoProps>> = {
  charts: Charts,
  terminal: VtTerminal,
};

/** `key: value` lines in a fence body. Unknown keys reach the demo intact. */
export function parseOptions(text: string): Record<string, string> {
  const options: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const kv = /^\s*([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kv) options[kv[1]!] = kv[2]!.trim();
  }
  return options;
}

/**
 * A demo, or — for one that is still an outline — a labelled box the right
 * size, so a slide's layout is honest before its demo exists.
 */
export function DemoSlot({ options }: DemoProps): ReactElement {
  const name = options.name ?? '';
  const Demo = DEMOS[name];
  if (!Demo) return <Placeholder options={options} />;
  return <Demo options={options} />;
}
