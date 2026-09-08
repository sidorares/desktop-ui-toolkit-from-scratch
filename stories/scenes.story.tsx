// `<Scenes>` — the live map, and the GL scene with its own source beside it.
//
// The two demos that cannot be checked by looking at a screenshot: one is
// talking to a tile server and the other is running a clock. Both have a
// failure that only shows up somewhere, which is the reason they have stories
// at all — the map says so in its caption when tiles stop arriving, and
// `<Canvas fallback>` is what a connection with no GL gets. Neither path is
// reachable on demand from the deck.
//
// Running the map story makes real requests to OpenStreetMap. That is the
// same thing the slide does, and it is the component's whole design: nothing
// in the components package fetches, so the `fetch` is ours.
import { story } from '@react-x11/workbench/story';

import { Scenes } from '../src/components/scenes.js';
import { Scene3D } from '../src/components/scene3d.js';

export default { title: 'Scenes', size: { width: 1180, height: 560 } };

/** Step 6: the map, with the whole width. */
export const map = () => <Scenes height={480} panel="map" />;

/** Step 7: the scene, its control bar, and the file it is running from. */
export const scene = () => <Scenes height={480} panel="three" />;

/** The same panel, opened on the other tab. */
export const sceneSource = () => (
  <Scenes height={480} panel="three" defaultTab="source" />
);

/** The bare canvas, which is where a dropped frame is visible. */
export const canvasOnly = () => <Scene3D height={480} />;

/** Every scene prop away from its default, so the controls have something
 *  to be checked against. */
export const wireframeBox = () => (
  <Scene3D height={480} shape="box" wireframe spin={0.3} color="#f2cc60" />
);

export const playground = story(
  (args: { panel: string; defaultTab: string; height: number }) => (
    <Scenes
      height={args.height}
      panel={args.panel as never}
      defaultTab={args.defaultTab}
    />
  ),
  {
    args: { panel: 'three', defaultTab: 'scene', height: 480 },
    controls: {
      panel: ['map', 'three', 'all'],
      defaultTab: ['scene', 'source'],
      height: { type: 'number', min: 200, max: 620, step: 20 },
    },
  },
);
