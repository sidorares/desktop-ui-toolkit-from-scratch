// `<Metric>` — one number, said loudly.
import { story } from '@react-x11/workbench/story';

import { Metric } from '../src/components/metric.js';

export default { title: 'Metric', size: { width: 460, height: 160 } };

export const basic = () => <Metric value={586} label="merged pull requests" />;

/** The one number a slide is actually about. */
export const emphasis = () => (
  <Metric value={983} label="commits" emphasis />
);

/** A value that is not a number at all — the prop takes what reads as one. */
export const textValue = () => <Metric value="47 days" label="elapsed" />;

export const playground = story(
  (args: { value: string; label: string; emphasis: boolean }) => (
    <Metric {...args} />
  ),
  {
    args: { value: '586', label: 'merged pull requests', emphasis: false },
    controls: { value: 'text', label: 'text', emphasis: 'boolean' },
  },
);
