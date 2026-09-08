// The two demos that are not a picture of a thing but the thing: a map you
// pan, and a scene that spins.
//
// They make the same claim from opposite ends, which is why they were one
// step and are now two. The map is a **software rasterizer** — vector tiles
// decoded and drawn on the CPU, each tile into its own surface, so a pan
// composites and rasterizes nothing. The scene is the other extreme:
// geometry handed to the GPU through `<glarea>`, which is a real X window on
// its own visual. Same window, same layout pass, same theme; two entirely
// different ideas about who draws.
//
// **The map is live.** Nothing in the components package fetches — a source
// is a `fetch` function the application writes — so this one is ours, and it
// is talking to OpenStreetMap's tile server while the slide is on screen. If
// the room's network is down the map draws its style's background and says
// so, which is the honest failure and worth showing rather than hiding.
//
// The scene comes with its source beside it, on the other tab. A snippet
// pasted into a slide is a second copy that goes stale; `<SourceCode>` reads
// the file the demo is running from, so the two cannot disagree — and the
// widgets above the canvas are driving exactly the props on screen.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { Radio, RadioGroup, Slider, Switch } from 'react-x11';
import { ColorField } from '@react-x11/components/color-picker';
import {
  Map,
  openMapTilesStyle,
  osmVectorSource,
} from '@react-x11/components/maps';
import type { MapMarker, TileRequest } from '@react-x11/components/maps';
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from '@react-x11/components/tabs';

import { Caption, fill } from './panel.js';
import { Scene3D } from './scene3d.js';
import type { SceneShape } from './scene3d.js';
import { SourceCode } from './source-code.js';

/** Where the talk is. The camera opens on it and the pin stands on it. */
const MELBJS = { lon: 144.9909632, lat: -37.8234386 };

const MARKERS: readonly MapMarker[] = [
  { id: 'melbjs', position: MELBJS, title: 'MelbJS', size: 16 },
];

/**
 * A tile server asks for a user-agent that identifies the application, which
 * is the other half of why `fetch` is the caller's: a component whose default
 * made requests would be choosing, on your behalf, whose servers you talk to
 * and whose policy you are bound by.
 */
const USER_AGENT =
  'making-a-desktop-ui-toolkit-from-scratch/0.0 (talk demo; andrey.sidorov@gmail.com)';

/**
 * **OpenFreeMap**, which is the right answer for a demo like this one:
 * a free planet-wide vector pyramid with no key, no sign-up and no rate
 * limit — where OpenStreetMap's own server is explicitly not a CDN and asks
 * you not to point an audience at it.
 *
 * Two things follow from the choice and both are visible below. The tiles
 * are cut in the **OpenMapTiles** schema rather than Shortbread, so the
 * style has to be `openMapTilesStyle()` — the same cartography written
 * against the other schema, which is exactly why the package ships both.
 * And the tile URL is *versioned by planet build*
 * (`/planet/<date>/{z}/{x}/{y}.pbf`), so it is read from the TileJSON at
 * startup rather than hardcoded: a template pasted into this file is a
 * template that stops resolving the week they publish the next planet, and
 * finding that out on stage is not a plan.
 */
const OFM_TILEJSON = 'https://tiles.openfreemap.org/planet';

/** Plain text, because the corner draws text: OpenFreeMap's own TileJSON
 *  says this in HTML, and an `<a>` in a `<text>` is an `<a>` in a `<text>`. */
const OFM_ATTRIBUTION =
  '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors';

/** The cartography for the schema OpenFreeMap cuts. Module scope: a fresh
 *  style object per render is a fresh style, and the map throws away every
 *  rasterized tile when the style changes. */
const MAP_STYLE = openMapTilesStyle({ dark: true });

const SHAPES: readonly SceneShape[] = ['torus', 'sphere', 'box'];

function MapPanel({
  height,
  captionSize,
}: {
  height?: number;
  captionSize: number;
}): ReactElement {
  const [offline, setOffline] = useState(false);

  const load = useCallback(
    async (url: string, signal: TileRequest['signal']) => {
      try {
        const response = await fetch(url, {
          // The map's signal is declared structurally — it is an AbortSignal.
          signal: signal as AbortSignal | undefined,
          headers: { 'user-agent': USER_AGENT },
        });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setOffline(false);
        return new Uint8Array(await response.arrayBuffer());
      } catch (err) {
        // An abort is the map changing its mind, not the network failing.
        if ((err as Error)?.name !== 'AbortError') setOffline(true);
        throw err;
      }
    },
    [],
  );

  // The tile template, resolved from OpenFreeMap's TileJSON. Until it lands
  // there is no source at all, which is the same picture as a network that
  // is down: the style's background, and the caption saying so.
  const [template, setTemplate] = useState<string | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    fetch(OFM_TILEJSON, {
      signal: abort.signal,
      headers: { 'user-agent': USER_AGENT },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        const url = (json as { tiles?: string[] }).tiles?.[0];
        if (url) setTemplate(url);
        else setOffline(true);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setOffline(true);
      });
    return () => abort.abort();
  }, []);

  // One source object for the life of the slide: a new one is a new pyramid,
  // and the tiles already rasterized would be thrown away on every render.
  //
  // `osmVectorSource` with a `url` is the seam it documents for "a mirror, a
  // proxy, a local tile server" — what it does is fetch, un-gzip and hand
  // back vector bytes, and none of that is OpenStreetMap-specific. The id and
  // the attribution are, so both are named here.
  const sources = useMemo(
    () =>
      template
        ? [
            osmVectorSource({
              fetch: load,
              url: template,
              id: 'openfreemap',
              attribution: OFM_ATTRIBUTION,
              maxZoom: 14,
            }),
          ]
        : [],
    [load, template],
  );

  return (
    <box style={{ gap: 8, ...fill(height) }}>
      <Caption size={captionSize}>
        {offline
          ? 'maps — no tiles reaching us; this is the style’s background'
          : 'maps — vector tiles, decoded and drawn here. Drag it.'}
      </Caption>
      <Map
        sources={sources}
        mapStyle={MAP_STYLE}
        defaultCamera={{ center: MELBJS, zoom: 14 }}
        markers={MARKERS}
        // **Under test.** Tile surfaces rasterize at the display's scale and
        // a fractional zoom composites those surfaces *scaled* rather than
        // re-rasterizing; markers never go through a tile surface and are
        // drawn per frame. If the two disagree about scale on a retina panel,
        // the basemap slides under a stationary pin — which is what a marker
        // that "drifts as I zoom" looks like. Pinning the surfaces to 1×
        // takes the display scale out of that half of the sum. The cost is a
        // softer basemap (about 1.6× quicker to rasterize); labels, markers
        // and overlays are unaffected either way. Take this line out if it
        // makes no difference.
        rasterScale={1}
        style={{ flexGrow: 1, minHeight: 0, borderRadius: 8 }}
      />
    </box>
  );
}

/** The control bar: four ordinary widgets, four props on a GL surface. */
function SceneControls({
  spin,
  setSpin,
  wireframe,
  setWireframe,
  shape,
  setShape,
  color,
  setColor,
}: {
  spin: number;
  setSpin: (n: number) => void;
  wireframe: boolean;
  setWireframe: (on: boolean) => void;
  shape: SceneShape;
  setShape: (shape: SceneShape) => void;
  color: string;
  setColor: (color: string) => void;
}): ReactElement {
  return (
    <box style={{ flexDirection: 'row', alignItems: 'center', gap: 22 }}>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <text style={{ fontSize: 13, color: '$textMuted' }}>spin</text>
        <Slider
          min={0}
          max={2}
          step={0.05}
          value={spin}
          onChange={(ev) => setSpin(ev.value)}
          style={{ width: 130 }}
        />
      </box>
      <box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Switch
          checked={wireframe}
          onChange={(ev) => setWireframe(ev.value)}
        />
        <text style={{ fontSize: 13 }}>wireframe</text>
      </box>
      <RadioGroup
        value={shape}
        onChange={(ev) => setShape(ev.value as SceneShape)}
        style={{ flexDirection: 'row', gap: 14 }}
      >
        {SHAPES.map((name) => (
          <Radio key={name} value={name} label={name} />
        ))}
      </RadioGroup>
      <ColorField
        value={color}
        onChange={(ev) => setColor(ev.value)}
        style={{ width: 130 }}
      />
    </box>
  );
}

function ThreePanel({
  height,
  defaultTab,
}: {
  height?: number;
  defaultTab: string;
}): ReactElement {
  const [spin, setSpin] = useState(1);
  const [wireframe, setWireframe] = useState(false);
  const [shape, setShape] = useState<SceneShape>('torus');
  const [color, setColor] = useState('#58a6ff');

  // The panels grow inside the tab root rather than naming a height: the
  // strip is what it is, and everything under it is the rest.
  const panel = { flexGrow: 1, flexShrink: 1, minHeight: 0 } as const;
  return (
    <Tabs defaultValue={defaultTab} variant="enclosed" style={fill(height)}>
      <TabsList>
        <TabsIndicator />
        <TabsTrigger value="scene">Scene</TabsTrigger>
        <TabsTrigger value="source">Source</TabsTrigger>
      </TabsList>

      <TabsContent value="scene" style={{ ...panel, gap: 10, padding: 4 }}>
        <SceneControls
          spin={spin}
          setSpin={setSpin}
          wireframe={wireframe}
          setWireframe={setWireframe}
          shape={shape}
          setShape={setShape}
          color={color}
          setColor={setColor}
        />
        <Scene3D
          spin={spin}
          wireframe={wireframe}
          shape={shape}
          color={color}
        />
      </TabsContent>

      {/* The other tab is this demo's own file, read off disk — from the
          props the bar above is driving, so the two tabs are the same
          thing said twice. */}
      <TabsContent value="source" style={{ ...panel, padding: 4 }}>
        <SourceCode
          file="src/components/scene3d.tsx"
          from="function Rig({"
        />
      </TabsContent>
    </Tabs>
  );
}

export type ScenePanel = 'map' | 'three' | 'all';

export interface ScenesProps {
  /** Pinned, for a story. A slide leaves it out and the panel fills. */
  height?: number;
  /** Which of the two a step is showing. `'all'` is the side-by-side row. */
  panel?: ScenePanel;
  /** Which tab the scene panel opens on: `'scene'` or `'source'`. */
  defaultTab?: string;
}

export function Scenes({
  height,
  panel = 'all',
  defaultTab = 'scene',
}: ScenesProps): ReactElement {
  if (panel === 'map') return <MapPanel height={height} captionSize={18} />;
  if (panel === 'three')
    return <ThreePanel height={height} defaultTab={defaultTab} />;

  return (
    <box style={{ flexDirection: 'row', gap: 20, ...fill(height) }}>
      <box style={{ flexGrow: 1, flexBasis: 0, minHeight: 0 }}>
        <MapPanel captionSize={15} />
      </box>
      <box style={{ flexGrow: 1, flexBasis: 0, minHeight: 0, gap: 8 }}>
        <Caption size={15}>
          {'three — a scene graph over <glarea>, on its own GL visual'}
        </Caption>
        <Scene3D />
      </box>
    </box>
  );
}
