// The file the hot-reload slide edits — and the one to open in an editor if
// the room can see your screen.
//
// Edit either marked line below and save. The edited components re-render in
// place: the window, the X11 connection and the process all survive, and so
// does every piece of state on screen — the count, and whatever is
// half-typed in the field. The pid is the proof; it does not change.
//
// One default export, and it is a component, which is what makes this module
// a *refresh boundary*: the edit re-evaluates this file and stops here. Add
// an export that is not a component and it stops being one — the change then
// propagates up to `hot-demo.jsx`, which mounts, and the demo becomes a
// restart.
//
// `.jsx` and `React.createElement` rather than `.tsx` and the automatic
// runtime, because the loader treats `.jsx` as its hot extension and runs
// babel's *classic* JSX transform — the automatic one injects an import that
// the hot-module rewrite cannot see.
import React, { useEffect, useState } from 'react';
import { Button } from 'react-x11';
import { onReload } from 'react-x11/refresh';

// The two lines the slide's button rewrites.
const HEADLINE = 'Edit me while I run'; // hot:headline
const ACCENT = '#2980b9'; // hot:accent

/** State that must survive the edit. */
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <box style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Button size="small" onPress={() => setCount((c) => c + 1)}>
        count me
      </Button>
      <text style={{ fontSize: 22 }}>{String(count)}</text>
    </box>
  );
}

/** And the half-typed input, which is the one that gets the reaction. */
function Draft() {
  const [text, setText] = useState('');
  return (
    <box style={{ gap: 6 }}>
      <textinput
        value={text}
        onChange={(ev) => setText(ev.value)}
        placeholder="type something, then save the file"
        style={{ height: 30, borderRadius: 6 }}
      />
      <text style={{ fontSize: 12, color: '$textMuted' }}>
        {text ? `${text.length} characters, still here` : 'nothing typed yet'}
      </text>
    </box>
  );
}

/** Reloads applied, counted from the runtime's own seam — so the number says
 *  "that was a reload", not "that was a restart". */
function Reloads() {
  const [count, setCount] = useState(0);
  useEffect(() => onReload(() => setCount((n) => n + 1)), []);
  return (
    <text style={{ fontSize: 12, color: '$textMuted' }}>
      {`pid ${process.pid} · ${count} reload${count === 1 ? '' : 's'} applied`}
    </text>
  );
}

export default function App() {
  return (
    <window
      width={480}
      height={420}
      title="react-x11 — hot reload"
      style={{ backgroundColor: '$background' }}
    >
      <box style={{ flexGrow: 1, padding: 18, gap: 14 }}>
        <text style={{ fontSize: 21, color: ACCENT }}>{HEADLINE}</text>
        <text style={{ fontSize: 12, color: '$textMuted' }}>
          Save this file and watch. Nothing below moves.
        </text>
        <Counter />
        <Draft />
        <Reloads />
      </box>
    </window>
  );
}
