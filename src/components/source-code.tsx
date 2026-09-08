// The demo's own source, on the slide beside it.
//
// A talk about a toolkit spends most of its time claiming things about code
// nobody in the room can see, and the usual fix — paste a snippet into the
// slide — creates a second copy that goes stale the first time the demo is
// edited. This reads the file off disk instead. The code on the slide is the
// code that is running, because it is the same bytes, and a save is enough to
// update it: `slides/` is watched, and this is read on the render that
// follows.
//
// Reading the file is a thing this deck can do and a web deck cannot — the
// same argument the terminal on slide 2 makes, in a quieter way.
//
// `from`/`to` are text to look for rather than line numbers, deliberately. A
// slide that says "lines 42-70" is wrong the moment somebody adds a comment
// above; a slide that says "from `function Rig`" is still right.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { useMemo } from 'react';
import type { ReactElement } from 'react';

import { Code } from '@react-x11/components/code';

import { fill } from './panel.js';

/** The repo root: this file is `src/components/`, two levels down. */
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** A fence tag for a filename, for the common cases in this repo. */
function langOf(file: string): string {
  const ext = /\.([a-z]+)$/.exec(file)?.[1] ?? '';
  if (ext === 'mjs' || ext === 'cjs') return 'js';
  if (ext === 'mdx') return 'md';
  return ext || 'txt';
}

export interface SourceCodeProps {
  /**
   * Repo-relative, e.g. `src/components/scene3d.tsx`.
   *
   * Optional, like every prop on every component a slide may name: the
   * `components` map hands a tag whatever attributes it was written with,
   * so a required prop is a slide that type-checks and crashes. A tag with
   * no file says so in the block instead.
   */
  file?: string;
  /** Start at the first line containing this text. Omit for the top. */
  from?: string;
  /** Stop before the first line after that containing this. */
  to?: string;
  /** Pinned, for a story. Left out, the listing fills its parent. */
  height?: number;
  /** 14 reads from the back of a room; the workbench uses less. */
  fontSize?: number;
  /** Override the tag derived from the extension. */
  lang?: string;
}

export function SourceCode({
  file = '',
  from,
  to,
  height,
  fontSize = 14,
  lang,
}: SourceCodeProps): ReactElement {
  const source = useMemo(() => {
    if (!file) return '// <SourceCode file="…" /> — no file named';
    let text: string;
    try {
      text = readFileSync(`${ROOT}${file}`, 'utf8');
    } catch (err) {
      return `// ${file}: ${(err as Error).message}`;
    }
    const lines = text.split('\n');
    let start = 0;
    let end = lines.length;
    if (from) {
      const at = lines.findIndex((line) => line.includes(from));
      if (at >= 0) start = at;
    }
    if (to) {
      const at = lines.findIndex((line, n) => n > start && line.includes(to));
      if (at >= 0) end = at;
    }
    return lines.slice(start, end).join('\n').replace(/\s+$/, '');
  }, [file, from, to]);

  return (
    <box style={{ gap: 6, ...fill(height) }}>
      <box style={{ flexGrow: 1, minHeight: 0, overflow: 'scroll' }}>
        <Code
          source={source}
          lang={lang ?? langOf(file)}
          fontSize={fontSize}
          lineNumbers
        />
      </box>
      <text style={{ fontSize: 11, color: '$textMuted' }}>
        {from ? `${file} — from “${from}”` : file}
      </text>
    </box>
  );
}
