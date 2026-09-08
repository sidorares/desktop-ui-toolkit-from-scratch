// `<DataViz>` — a series, a sequence and a graph, one per slide step.
//
// `panel` is which one a step shows, so the stories are the steps plus the
// three-up row they came from. The row is the reason `'all'` still exists:
// the workbench is where the three get compared, and a deck that has given
// each of them the whole width cannot do that any more.
import { story } from '@react-x11/workbench/story';

import { DataViz } from '../src/components/dataviz.js';

export default { title: 'DataViz', size: { width: 1180, height: 560 } };

/** Step 3: the same numbers as the stats slide, drawn as an area. */
export const series = () => <DataViz height={480} panel="charts" />;

/** Step 4: two runs of the package's timeline, side by side. */
export const sequence = () => <DataViz height={480} panel="timeline" />;

/** Step 5: the architecture graph, with its three operable nodes. */
export const graph = () => <DataViz height={480} panel="flow" />;

/** What the three looked like sharing one row. */
export const threeUp = () => <DataViz height={480} panel="all" />;

export const playground = story(
  (args: { panel: string; height: number }) => (
    <DataViz height={args.height} panel={args.panel as never} />
  ),
  {
    args: { panel: 'flow', height: 480 },
    controls: {
      panel: ['charts', 'timeline', 'flow', 'all'],
      height: { type: 'number', min: 200, max: 620, step: 20 },
    },
  },
);
