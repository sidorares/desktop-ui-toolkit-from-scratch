// Slides are markdown files on disk, read at startup and re-read on `r`.
//
// Keeping them as plain `.md` — rather than `.tsx`, or the `.mdx` this deck
// will move to once `@react-x11/components` grows an MDX parser — is what
// makes the deck editable *while* the talk is being written: a file save and
// one keypress, no rebuild. Live demos come in through `<Markdown>`'s
// existing `fences` seam (see `prose.tsx`), which is the seam that already
// turns a ```math fence into a `<Formula>`.
import { readdir, readFile } from 'node:fs/promises';

export type SlideLayout = 'default' | 'title' | 'full';

export interface Slide {
  /** The filename without its number prefix or extension — a stable id. */
  id: string;
  title: string;
  /** Speaker notes, for the presenter view. */
  notes: string;
  layout: SlideLayout;
  /** Markdown, cumulative: `chunks[n]` is everything visible at step n. */
  chunks: string[];
  steps: number;
}

/** A line of `^^^` on its own — the reveal marker. */
const REVEAL = /^\^{3,}\s*$/;
/** ```` ```lang ```` or `~~~lang`, opening or closing a fenced block. */
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * Split on reveal markers, but not on one that fell inside a fenced code
 * block — a `^^^` in a shell transcript is a caret, not a slide step.
 */
export function splitReveals(body: string): string[] {
  const parts: string[][] = [[]];
  let fence: string | null = null;
  for (const line of body.split('\n')) {
    const f = FENCE.exec(line);
    if (f) {
      const marker = f[1]!;
      if (fence === null) fence = marker[0]!;
      else if (marker[0] === fence) fence = null;
    } else if (fence === null && REVEAL.test(line)) {
      parts.push([]);
      continue;
    }
    parts[parts.length - 1]!.push(line);
  }
  // Cumulative: a step shows everything up to and including its own part, so
  // the reveal is additive rather than a replacement.
  const out: string[] = [];
  let seen = '';
  for (const part of parts) {
    seen = seen ? `${seen}\n${part.join('\n')}` : part.join('\n');
    out.push(seen.replace(/\s+$/, ''));
  }
  return out;
}

/** `--- key: value ---` at the top of a file. `notes` may be a `|` block. */
export function parseFrontmatter(text: string): {
  meta: Record<string, string>;
  body: string;
} {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };
  const meta: Record<string, string> = {};
  const lines = m[1]!.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(lines[i]!);
    if (!kv) continue;
    const [, key, rawValue] = kv as unknown as [string, string, string];
    if (rawValue.trim() === '|') {
      // A block scalar: every following line indented at least two spaces.
      const block: string[] = [];
      while (i + 1 < lines.length && /^(\s{2,}|\s*$)/.test(lines[i + 1]!)) {
        block.push(lines[++i]!.replace(/^ {2}/, ''));
      }
      meta[key] = block.join('\n').trim();
    } else {
      meta[key] = rawValue.trim().replace(/^["']|["']$/g, '');
    }
  }
  return { meta, body: text.slice(m[0].length) };
}

function isLayout(v: string | undefined): v is SlideLayout {
  return v === 'default' || v === 'title' || v === 'full';
}

export function parseSlide(filename: string, text: string): Slide {
  const { meta, body } = parseFrontmatter(text);
  const chunks = splitReveals(body);
  const id = filename.replace(/\.md$/, '').replace(/^\d+[-_]?/, '');
  return {
    id,
    // A slide with no `title:` takes its first `# heading`, and failing that
    // its filename — so a new file is presentable before it is finished.
    title:
      meta.title ??
      /^#{1,2}\s+(.+)$/m.exec(body)?.[1]?.trim() ??
      id.replace(/-/g, ' '),
    notes: meta.notes ?? '',
    layout: isLayout(meta.layout) ? meta.layout : 'default',
    chunks,
    steps: chunks.length,
  };
}

/** Every `NN-name.md` in `dir`, in filename order. */
export async function loadSlides(dir: string): Promise<Slide[]> {
  const names = (await readdir(dir))
    .filter((n) => n.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b, 'en'));
  return Promise.all(
    names.map(async (n) =>
      parseSlide(n, await readFile(`${dir}/${n}`, 'utf8')),
    ),
  );
}
