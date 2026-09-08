// Three document engines behind one strip of tabs.
//
// `<Tabs>` is the demo as much as its panels are: it is the components
// package's, Chakra's API spelled flat, and the panels behind it stay mounted
// so a scroll position or a half-filled form survives a trip to another tab.
// That is the whole reason to show these three together — they are the three
// *documents* react-x11 can be handed, and a slide that gave each of them its
// own step would spend three steps saying the same sentence.
//
// What is in the panels is chosen to be checkable rather than pretty. The
// markdown is a document about markdown, rendered by the same `<Markdown>`
// drawing the slide around it. The maths is KaTeX's layout, not an image. The
// HTML has a `<select>` and an `<input>` in it, and those are not drawings of
// controls: they are the same widgets as the ones on the previous step.
import type { ReactElement } from 'react';

import { fill } from './panel.js';
import { Formula } from '@react-x11/components/formula';
import { Html } from '@react-x11/components/html';
import { Markdown } from '@react-x11/components/markdown';
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from '@react-x11/components/tabs';

import { useZoom } from '../zoom.js';

const MARKDOWN = `## GFM, streaming, selectable

This panel is a \`<Markdown>\` **inside** the \`<Markdown>\` that drew the
slide. Same parser, same block cache, same selection.

| what | where |
| --- | --- |
| block cache | per block, keyed on its source |
| fences | a \`math\` fence becomes a \`<Formula>\` |
| components | a tag is a component iff it is in the map |

\`\`\`ts
const parts = splitReveals(body, 'replace');
\`\`\`

> Nothing is fetched. A document is text an application already has.
`;

// Written with two-row vectors rather than the three-row homogeneous matrix
// it wanted to be, and that is a bug worth an issue rather than a preference:
// this KaTeX layout draws a `\left`/`\right` delimiter only while it is one
// glyph tall. A three-row matrix needs a delimiter *assembled* from pieces,
// and those come out invisible — a bare grid of numbers, which reads as
// broken. `{bmatrix}`'s implied fences are never drawn either. Two rows is
// inside the working range, and says the same thing: a pan is a scale and an
// offset, which is why panning a map renders nothing.
const PAN = String.raw`\left[\begin{matrix} x' \\ y' \end{matrix}\right]
= s\left[\begin{matrix} x \\ y \end{matrix}\right]
+ \left[\begin{matrix} t_x \\ t_y \end{matrix}\right]`;

const DECIMATE = String.raw`\text{drawn} \;=\; \min\bigl(n,\; 2\,w\,\rho\bigr)`;

const BUDGET = String.raw`\frac{1}{60\ \mathrm{Hz}} \approx 16.7\ \mathrm{ms}`;

const HTML = `<h3>Release notes</h3>
<p>A document an application is <em>handed</em> — mail, a help page, an
exported report — with selectable text and <strong>real widgets</strong> for
its form controls.</p>
<table>
  <tr><th>package</th><th>version</th></tr>
  <tr><td>react-x11</td><td>2.9.0</td></tr>
  <tr><td>@react-x11/components</td><td>0.6.0</td></tr>
</table>
<p><label>Backend
  <select><option>Cocoa</option><option>X11</option></select>
</label></p>
<p><label><input type="checkbox" checked> Keep the screen awake</label></p>
<p><input type="text" value="that select is a real menu"></p>`;

export interface DocumentsProps {
  /** Pinned, for a story. A slide leaves it out and the tabs fill. */
  height?: number;
  /** Which tab the slide opens on. */
  defaultValue?: string;
}

export function Documents({
  height,
  defaultValue = 'markdown',
}: DocumentsProps): ReactElement {
  const { px } = useZoom();
  // No height on the panel. `<TabsContent>` already grows into whatever the
  // strip above it leaves, and what the strip leaves *moves*: its triggers
  // are set in the theme's face at the theme's size, so a zoom that makes the
  // slide readable from the back row makes the strip taller too. Subtracting
  // a hardcoded 56 for it was right at 100% and pushed the panel out of the
  // box everywhere else.
  const panel = { overflow: 'scroll' as const, padding: px(4) };
  return (
    <Tabs defaultValue={defaultValue} variant="enclosed" style={fill(height)}>
      <TabsList>
        <TabsIndicator />
        <TabsTrigger value="markdown">Markdown</TabsTrigger>
        <TabsTrigger value="maths">Maths</TabsTrigger>
        <TabsTrigger value="html">HTML</TabsTrigger>
      </TabsList>

      <TabsContent value="markdown" style={panel}>
        <Markdown source={MARKDOWN} partial={false} fontSize={px(15)} />
      </TabsContent>

      <TabsContent value="maths" style={panel}>
        <box style={{ gap: px(18), paddingTop: px(8) }}>
          <text style={{ fontSize: px(13), color: '$textMuted' }}>
            A pan is a scale and an offset, which is why panning a map
            renders nothing:
          </text>
          <Formula tex={PAN} display />
          <text style={{ fontSize: px(13), color: '$textMuted' }}>
            …and why three million points cost a screenful:
          </text>
          <box style={{ flexDirection: 'row', gap: px(40), alignItems: 'center' }}>
            <Formula tex={DECIMATE} display />
            <Formula tex={BUDGET} display />
          </box>
        </box>
      </TabsContent>

      <TabsContent value="html" style={panel}>
        <Html source={HTML} partial={false} fontSize={px(15)} />
      </TabsContent>
    </Tabs>
  );
}
