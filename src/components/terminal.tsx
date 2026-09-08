// A real terminal on a slide, on the in-process vt backend — the one that
// needs no xterm and works on the Cocoa backend, which is what this deck is
// presented on.
//
// `command` takes argv as an array, which is the thing the ```demo fence
// this replaced could not express: a fence attribute was a string, so a
// shell one-liner with quotes and a pipe in it had to survive being split on
// whitespace, and did not. An MDX attribute is JSON, so
// `command={["bash", "-lc", "yes … | head -20000"]}` arrives as the array it
// looks like. A bare string is still accepted and split, because most
// commands are one word and a slide should not have to say `["bash"]`.
//
// Either way it is held in a memo: `<Terminal>` restarts the child when it
// is handed a new array, and a fresh literal every render is a new array.
import { useMemo } from 'react';
import type { ReactElement } from 'react';

import { Terminal as VtTerminal } from '@react-x11/components/terminal';

export interface TerminalProps {
  /** argv, or a shell line split on spaces. Omit for a login shell. */
  command?: string | readonly string[];
  height?: number;
  fontSize?: number;
}

const LOGIN_SHELL = ['bash', '-l'];

export function Terminal({
  command = '',
  height = 320,
  fontSize = 14,
}: TerminalProps): ReactElement {
  const argv = useMemo(() => {
    if (Array.isArray(command)) return command.length ? [...command] : LOGIN_SHELL;
    const line = String(command).trim();
    return line ? line.split(/\s+/) : LOGIN_SHELL;
  }, [command]);
  return (
    <VtTerminal
      backend="vt"
      command={argv}
      fontSize={fontSize}
      style={{ height }}
      fallback={
        <box style={{ height, justifyContent: 'center', padding: 24 }}>
          <text style={{ fontSize: 13, color: '$textMuted' }}>
            The vt backend is unavailable — install `@lydell/node-pty`.
          </text>
        </box>
      }
    />
  );
}
