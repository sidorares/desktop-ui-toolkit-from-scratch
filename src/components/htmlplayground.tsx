// An HTML editor beside the document it is: `<CodeEditor>` on the left,
// `<Html>` on the right, a draggable divider between them.
//
// Three components from the package and one from core, wired with a
// `useState` — which is the point of the slide it is on. The right-hand pane
// is not a webview: the markup is parsed, the CSS cascaded, the boxes laid
// out and the text painted by `@react-x11/components/html`, in this process,
// onto the same window as everything else.
//
// The editor does not autofocus, deliberately. A demo that takes the
// keyboard on arrival takes `→` with it, and the deck stops moving; click
// into it to type, `Esc` to hand the keys back.
import { useState } from 'react';
import type { ReactElement } from 'react';

import { SplitPane } from 'react-x11';
import { CodeEditor } from '@react-x11/components/code-editor';
import { Html } from '@react-x11/components/html';

import { html } from '../html-language.js';
import { fill } from './panel.js';

const SAMPLE = `<h1>Hello from an X11 window</h1>

<p>Everything on the right is <strong>parsed, styled, laid out and
painted</strong> by <code>@react-x11/components/html</code>. There is no
browser here, and no webview.</p>

<ul>
  <li>The cascade: selectors, inheritance, <em>media queries</em></li>
  <li>Tables, lists, forms &amp; images</li>
  <li>Selection and copy, because it is a real document</li>
</ul>

<table>
  <tr><th>pane</th><th>component</th></tr>
  <tr><td>left</td><td>&lt;CodeEditor&gt;</td></tr>
  <tr><td>right</td><td>&lt;Html&gt;</td></tr>
</table>

<style>
  h1 { font-size: 21px; margin: 0 0 10px }
  li { margin: 2px 0 }
  code { padding: 1px 4px; border-radius: 3px; background: rgba(127,127,127,.2) }
  th, td { text-align: left; padding: 2px 14px 2px 0 }
</style>
`;

export interface HtmlPlaygroundProps {
  /** Pinned, for a story. Left out, the split fills the slide — a demo that
   *  names a height is a demo with a gap under it (see `panel.tsx`). */
  height?: number;
  /** The document to open with. */
  source?: string;
  /** The editor's width, in pixels — the divider moves it from there. */
  split?: number;
}

export function HtmlPlayground({
  height,
  source = SAMPLE,
  split = 520,
}: HtmlPlaygroundProps): ReactElement {
  const [text, setText] = useState(source);
  return (
    <box style={{ minHeight: 0, ...fill(height) }}>
      <SplitPane direction="row" defaultSize={split} min={220} minSecond={220}>
        <CodeEditor
          language={html}
          value={text}
          onChange={(ev) => setText(ev.value)}
          lineNumbers
          activeLine
          style={{
            flexGrow: 1,
            fontSize: 13,
            borderWidth: 1,
            borderColor: '$border',
            borderRadius: 6,
          }}
        />
        <Html
          source={text}
          // The document is whole on every keystroke, so the parser is not
          // being streamed: `partial` left true would try to write each
          // edit as a delta on the last one.
          partial={false}
          style={{
            flexGrow: 1,
            padding: 14,
            marginLeft: 10,
            borderWidth: 1,
            borderColor: '$border',
            borderRadius: 6,
            backgroundColor: '$background',
          }}
        />
      </SplitPane>
    </box>
  );
}
