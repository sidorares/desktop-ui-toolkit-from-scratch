// The app the DevTools slide inspects — a small react-x11 window whose whole
// job is to be worth looking at from somewhere else.
//
//   npx react-devtools                                       # 1. the UI
//   REACT_X11_DEVTOOLS=1 npx tsx examples/devtools-demo.tsx   # 2. the app
//
// That is the pair the slide's button runs, in that order, because the
// backend connects to a socket which has to already be listening — and the
// flag is read before the first commit, so it cannot be switched on in a
// running app. Hence a second process: the deck cannot inspect itself.
//
// Everything here exists to be poked at from the *other* window. `step` is a
// prop to edit, the name is hook state to edit, `<Ticker>` re-renders on its
// own once a second — which is what "highlight updates when components
// render" outlines — and every row has a `:hover` block, so hovering a
// component in the DevTools tree tints exactly one rect over here.
import { useEffect, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { Button, createRoot } from 'react-x11';

/** Whether this process was started the way the demo wants. Said on screen,
 *  because a window that looks fine while nothing is connected is the most
 *  confusing thing that can happen on stage. */
const BRIDGE = process.env.REACT_X11_DEVTOOLS === '1';
const HOST = process.env.REACT_X11_DEVTOOLS_HOST || 'localhost';
const PORT = process.env.REACT_X11_DEVTOOLS_PORT || '8097';

/** One labelled row. Named, because the tree should read as a list of nouns. */
function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <box
      style={{
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '$border',
        backgroundColor: '$surface',
        transition: 120,
        ':hover': { backgroundColor: '$surfaceHover' },
      }}
    >
      <text style={{ fontSize: 11, color: '$textMuted' }}>{title}</text>
      {children}
    </box>
  );
}

/** A prop worth editing: change `step` in DevTools and the buttons change. */
function Counter({ step = 1 }: { step?: number }): ReactElement {
  const [count, setCount] = useState(0);
  return (
    <Panel title={`Counter — step ${step}`}>
      <box style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Button size="small" onPress={() => setCount((c) => c - step)}>
          −
        </Button>
        <text style={{ fontSize: 22 }}>{String(count)}</text>
        <Button size="small" primary onPress={() => setCount((c) => c + step)}>
          +
        </Button>
      </box>
    </Panel>
  );
}

/** Hook state worth editing, and a control worth typing into: the value
 *  DevTools shows is the one in the field, both ways round. */
function Greeting(): ReactElement {
  const [name, setName] = useState('MelbJS');
  return (
    <Panel title="Greeting — useState, editable from the tree">
      <textinput
        value={name}
        onChange={(ev) => setName(ev.value)}
        placeholder="a name"
        style={{ height: 30, borderRadius: 6 }}
      />
      <text style={{ fontSize: 15 }}>{`Hello, ${name || 'nobody'}.`}</text>
    </Panel>
  );
}

/** Something that re-renders on its own — the subject of "highlight updates". */
function Ticker(): ReactElement {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Panel title="Ticker — one commit a second">
      <text style={{ fontSize: 15 }}>{`up ${seconds}s`}</text>
    </Panel>
  );
}

/** Four rects to hover: one component per swatch, so a hover in the tree
 *  tints exactly one of them and the picker has something to pick. */
function Swatch({ token }: { token: string }): ReactElement {
  return (
    <box
      style={{
        width: 54,
        height: 30,
        borderRadius: 6,
        backgroundColor: token,
        borderWidth: 2,
        borderColor: '$surface',
        transition: 120,
        ':hover': { borderColor: '$text' },
      }}
    />
  );
}

function Swatches(): ReactElement {
  return (
    <Panel title="Swatches — one component each">
      <box style={{ flexDirection: 'row', gap: 8 }}>
        {['$accent', '$success', '$warning', '$danger'].map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </box>
    </Panel>
  );
}

function App(): ReactElement {
  return (
    <window
      width={520}
      height={520}
      title="react-x11 — DevTools demo"
      style={{ backgroundColor: '$background' }}
    >
      <box style={{ flexGrow: 1, padding: 18, gap: 12 }}>
        <text style={{ fontSize: 19 }}>Inspect me</text>
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          {BRIDGE
            ? `bridge on — talking to ${HOST}:${PORT}`
            : 'bridge off — restart with REACT_X11_DEVTOOLS=1'}
        </text>
        <Counter step={1} />
        <Greeting />
        <Ticker />
        <Swatches />
      </box>
    </window>
  );
}

const root = await createRoot();
root.render(<App />);
