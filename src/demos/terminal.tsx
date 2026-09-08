// A real terminal on a slide, on the in-process vt backend — the one that
// needs no xterm and works on the Cocoa backend, which is what this deck is
// presented on.
//
// `command` is held at module scope because `<Terminal>` restarts the child
// when it is handed a new argv, and a fresh array literal every render is a
// new argv.
import type { ReactElement } from 'react';

import { Terminal } from '@react-x11/components/terminal';

import type { DemoProps } from './index.js';

const SHELL = ['bash', '-l'] as const;

export function VtTerminal({ options }: DemoProps): ReactElement {
  return (
    <Terminal
      backend="vt"
      command={options.command ? options.command.split(' ') : SHELL}
      fontSize={Number(options.fontSize ?? 14)}
      style={{ height: Number(options.height ?? 320) }}
      fallback={
        <box style={{ height: 320, justifyContent: 'center', padding: 24 }}>
          <text style={{ fontSize: 13, color: '$textMuted' }}>
            The vt backend is unavailable — install `@lydell/node-pty`.
          </text>
        </box>
      }
    />
  );
}
