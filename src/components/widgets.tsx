// The widget bench: core's controls, a variable font and a vector drawing —
// all on one wire.
//
// Three of the slide's claims are hard to make separately and easy to make
// together, so this makes them at once. The controls down the left are
// react-x11's own — no component package, no canvas, nothing drawn by hand.
// What they move is a **variable font's axes**, read off the file on the
// machine the talk is running on rather than named here. And the same numbers
// go into an `<svg>`, which is a drawing rather than a document and is the
// one place a slide can watch a vector re-render at sixty hertz.
//
// The specimen is a `<textinput>`, so the honest demo is the presenter typing
// into it: a field, a font and a drawing, none of which know about each other.
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { fill } from './panel.js';
import {
  Button,
  Checkbox,
  Icon,
  ProgressBar,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Tooltip,
  loadFont,
  useApp,
  useTheme,
} from 'react-x11';

/** One axis, as the font file describes itself. */
interface Axis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
}

/**
 * Where a variable font lives on the desktops this talk is given on. macOS
 * ships one in the system font itself — SF Pro carries `wght`, `wdth` and
 * `opsz` — and a Linux desktop usually has a Noto or an Inter with at least a
 * weight axis. The first file that opens *and* reports axes wins.
 */
const CANDIDATES = [
  '/System/Library/Fonts/SFNS.ttf',
  '/System/Library/Fonts/SFNSRounded.ttf',
  '/usr/share/fonts/truetype/inter/InterVariable.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans[wdth,wght].ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
];

/** The axes worth a slider, in the order a type specimen puts them. */
const SHOWN = ['wght', 'wdth', 'opsz'];

/**
 * The first candidate that is on this machine and has axes.
 *
 * `loadFont` throws for a file that is not there, which is right for a font
 * an app ships and wrong for a list of guesses — so this catches per path.
 * The face is registered, so `family` is a name `fontFamily` can take; it is
 * read off the file rather than invented, because two files that both want to
 * be "Inter" are a tie the loader resolves and the caller cannot.
 */
function useVariableFont(): { family: string; axes: Axis[] } | null {
  const app = useApp();
  return useMemo(() => {
    for (const path of CANDIDATES) {
      let loaded;
      try {
        loaded = loadFont(app, path) as unknown as {
          family: string;
          font: { variationAxes?: Record<string, Omit<Axis, 'tag'>> };
        };
      } catch {
        continue; // not on this machine
      }
      const found = loaded.font.variationAxes;
      if (!found?.wght) continue;
      const axes = SHOWN.filter((tag) => found[tag]).map((tag) => ({
        tag,
        ...found[tag]!,
      }));
      return { family: loaded.family, axes };
    }
    return null;
  }, [app]);
}

/** Where a slider starts, and what `Reset` puts it back to. */
const startingAt = (axes: Axis[]): Record<string, number> =>
  Object.fromEntries(axes.map((a) => [a.tag, a.default]));

type Figure = 'atom' | 'dial' | 'bars';

const FIGURES: readonly Figure[] = ['atom', 'dial', 'bars'];

/**
 * The drawing, as markup. `<svg>` takes a source string or SVG children;
 * a string is what a demo whose shape *is* the state wants, since the whole
 * document is one interpolation and there is nothing to reconcile.
 *
 * `t` is 0-1 — where the weight axis sits between its own ends — so a font
 * with a 1-1000 range and one with 100-900 drive this identically.
 */
function figureSource(
  figure: Figure,
  t: number,
  wide: number,
  outline: boolean,
  grid: boolean,
  ink: string,
  faint: string,
): string {
  const stroke = 1 + t * 15;
  const fill = outline ? 'none' : ink;
  const parts: string[] = [];
  if (grid) {
    for (let n = 20; n < 200; n += 20) {
      parts.push(
        `<line x1="${n}" y1="0" x2="${n}" y2="200" stroke="${faint}" stroke-width="0.5"/>`,
        `<line x1="0" y1="${n}" x2="200" y2="${n}" stroke="${faint}" stroke-width="0.5"/>`,
      );
    }
  }
  if (figure === 'atom') {
    for (const angle of [0, 60, 120]) {
      parts.push(
        `<ellipse cx="100" cy="100" rx="${72 * wide}" ry="${28 / wide}"` +
          ` transform="rotate(${angle} 100 100)" fill="${outline ? 'none' : ink}"` +
          ` fill-opacity="0.12" stroke="${ink}" stroke-width="${stroke / 2}"/>`,
      );
    }
    parts.push(
      `<circle cx="100" cy="100" r="${6 + t * 14}" fill="${ink}" fill-opacity="${outline ? 0 : 1}" stroke="${ink}" stroke-width="${stroke / 3}"/>`,
    );
  } else if (figure === 'dial') {
    for (let i = 0; i <= 40; i++) {
      const a = (Math.PI * 1.5 * i) / 40 + Math.PI * 0.75;
      const lit = i / 40 <= t;
      const r0 = 62 * wide;
      const r1 = r0 + (lit ? 8 + t * 12 : 8);
      parts.push(
        `<line x1="${100 + Math.cos(a) * r0}" y1="${100 + Math.sin(a) * r0}"` +
          ` x2="${100 + Math.cos(a) * r1}" y2="${100 + Math.sin(a) * r1}"` +
          ` stroke="${lit ? ink : faint}" stroke-width="${lit ? 1 + t * 4 : 2}"` +
          ' stroke-linecap="round"/>',
      );
    }
    const needle = Math.PI * 0.75 + Math.PI * 1.5 * t;
    parts.push(
      `<line x1="100" y1="100" x2="${100 + Math.cos(needle) * 54 * wide}"` +
        ` y2="${100 + Math.sin(needle) * 54}" stroke="${ink}"` +
        ` stroke-width="${stroke}" stroke-linecap="round"/>`,
      `<circle cx="100" cy="100" r="7" fill="${fill}" stroke="${ink}" stroke-width="3"/>`,
    );
  } else {
    for (let i = 0; i < 7; i++) {
      const h = 30 + 150 * (0.25 + 0.75 * t) * (0.4 + 0.6 * Math.sin((i + 1) / 2.4));
      const w = 16 * wide;
      const x = 14 + i * 26 - w / 2 + 13;
      parts.push(
        `<rect x="${x}" y="${190 - h}" width="${w}" height="${h}" rx="${3 + t * 5}"` +
          ` fill="${fill}" fill-opacity="0.85" stroke="${ink}" stroke-width="${outline ? stroke / 3 : 0}"/>`,
      );
    }
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}

export interface WidgetsProps {
  /** Pinned, for a story. A slide leaves it out and the bench fills. */
  height?: number;
  /** The word the specimen starts on. The presenter may type over it. */
  specimen?: string;
}

export function Widgets({
  height,
  specimen = 'Handgloves',
}: WidgetsProps): ReactElement {
  const font = useVariableFont();
  const axes = font?.axes ?? [];
  const theme = useTheme();
  const [word, setWord] = useState(specimen);
  const [values, setValues] = useState(() => startingAt(axes));
  const [outline, setOutline] = useState(false);
  const [grid, setGrid] = useState(true);
  const [figure, setFigure] = useState<Figure>('atom');

  const weight = axes.find((a) => a.tag === 'wght');
  const width = axes.find((a) => a.tag === 'wdth');
  // 0-1 along the weight axis, whatever ends this particular file has — the
  // one number the drawing and the progress bar both read.
  const t = weight
    ? ((values.wght ?? weight.default) - weight.min) / (weight.max - weight.min)
    : 0.5;
  const wide = width ? (values.wdth ?? width.default) / width.default : 1;

  const source = useMemo(
    () =>
      figureSource(
        figure,
        t,
        wide,
        outline,
        grid,
        String(theme.accent),
        String(theme.border),
      ),
    [figure, t, wide, outline, grid, theme.accent, theme.border],
  );

  return (
    <box style={{ flexDirection: 'row', gap: 24, ...fill(height) }}>
      <box style={{ width: 360, gap: 12 }}>
        <textinput
          value={word}
          onChange={(ev) => setWord(ev.target.value)}
          placeholder="type a specimen"
          style={{
            fontSize: 15,
            padding: 8,
            borderWidth: 1,
            borderColor: '$border',
            borderRadius: 6,
            backgroundColor: '$surface',
            ':focus': { borderColor: '$borderFocus' },
          }}
        />

        {axes.map((axis) => (
          <box key={axis.tag} style={{ gap: 2 }}>
            <box style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <text style={{ fontSize: 12, color: '$textMuted' }}>
                {`${axis.name} (${axis.tag})`}
              </text>
              <text style={{ fontSize: 12, color: '$textMuted' }}>
                {String(Math.round(values[axis.tag] ?? axis.default))}
              </text>
            </box>
            <Slider
              min={axis.min}
              max={axis.max}
              step={1}
              value={values[axis.tag] ?? axis.default}
              onChange={(ev) =>
                setValues((v) => ({ ...v, [axis.tag]: ev.value }))
              }
            />
          </box>
        ))}

        {font ? null : (
          <text style={{ fontSize: 12, color: '$textMuted' }}>
            No variable font on this machine — the controls below still work.
          </text>
        )}

        <box style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch checked={outline} onChange={(ev) => setOutline(ev.value)} />
            <text style={{ fontSize: 13 }}>Outline</text>
          </box>
          <Checkbox
            checked={grid}
            onChange={(ev) => setGrid(ev.value)}
            label="Grid"
          />
        </box>

        {/* The radio group and the select below it are the same state, on
            purpose: move one and the other moves, which is a controlled
            widget behaving like one and takes no wiring to show. */}
        <RadioGroup
          value={figure}
          onChange={(ev) => setFigure(ev.value as Figure)}
          style={{ flexDirection: 'row', gap: 16 }}
        >
          {FIGURES.map((name) => (
            <Radio key={name} value={name} label={name} />
          ))}
        </RadioGroup>

        <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Select
            value={figure}
            options={FIGURES.map((f) => ({ value: f, label: `figure: ${f}` }))}
            onChange={(ev) => setFigure(ev.value as Figure)}
            style={{ flexGrow: 1 }}
          />
          <Button
            size="small"
            variant="outline"
            onPress={() => setValues(startingAt(axes))}
          >
            <box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="dash" size={10} />
              <text style={{ fontSize: 13 }}>Reset</text>
            </box>
          </Button>
        </box>

        <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ProgressBar value={t} style={{ flexGrow: 1 }} />
          <Tooltip
            label={
              font
                ? `${font.family} — ${axes.length} axes, read off the file`
                : 'no variable font found on this machine'
            }
          >
            <text style={{ fontSize: 12, color: '$textMuted' }}>
              {font ? font.family : 'static font'}
            </text>
          </Tooltip>
        </box>
      </box>

      <box style={{ flexGrow: 1, gap: 12, justifyContent: 'center' }}>
        <text
          style={{
            fontFamily: font?.family,
            fontSize: 64,
            lineHeight: 1.15,
            fontVariationSettings: values,
            color: '$text',
          }}
        >
          {word || ' '}
        </text>
        <box style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <svg source={source} viewBox="0 0 200 200" style={{ width: 190, height: 190 }} />
          <box style={{ gap: 6, flexShrink: 1 }}>
            <text style={{ fontSize: 13, color: '$textMuted' }}>
              {'One <svg>, re-sourced on every slider step.'}
            </text>
            <text style={{ fontSize: 13, color: '$textMuted' }}>
              {axes.length
                ? axes
                    .map(
                      (a) => `${a.tag} ${Math.round(values[a.tag] ?? a.default)}`,
                    )
                    .join('   ')
                : 'no axes'}
            </text>
          </box>
        </box>
      </box>
    </box>
  );
}
