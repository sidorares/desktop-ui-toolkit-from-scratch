// The chrome the two launcher demos share: a panel, a process with a light
// beside it, and the command that process is.
//
// The commands are on the slide on purpose. A button that starts two
// processes is a convenience for the four minutes it has to work in; what
// the audience should leave with is the two lines they would type, and a
// button whose label agrees with a command nobody can see is a magic trick
// rather than a demo.
import type { ReactElement, ReactNode } from 'react';

import type { ProcessState, Status } from '../processes.js';
import { fill } from './panel.js';

const LIGHT: Record<Status, string> = {
  idle: '$border',
  starting: '$warning',
  running: '$success',
  exited: '$textMuted',
  failed: '$danger',
};

/**
 * A launcher's own chrome. Unlike the showcase's panels this is content-sized
 * by default rather than growing: what is in it is four lines of status, and
 * a box that grew to fill a slide would be four lines of status in the middle
 * of nothing. `height` still goes through `fill()`, so a story can pin it.
 */
export function Panel({
  height,
  children,
}: {
  height?: number;
  children: ReactNode;
}): ReactElement {
  return (
    <box
      style={{
        ...(height === undefined ? {} : fill(height)),
        gap: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: '$border',
        borderRadius: 8,
        backgroundColor: '$surface',
      }}
    >
      {children}
    </box>
  );
}

export function ProcessRow({
  label,
  state,
}: {
  label: string;
  state: ProcessState;
}): ReactElement {
  return (
    <box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <box
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: LIGHT[state.status],
          transition: 150,
        }}
      />
      <text style={{ fontSize: 13, fontFamily: '$monoFamily' }}>{label}</text>
      <text style={{ fontSize: 12, color: '$textMuted' }}>
        {state.detail || state.status}
      </text>
    </box>
  );
}

/** A command, as a presenter would type it. */
export function Command({ children }: { children: string }): ReactElement {
  return (
    <text
      style={{ fontSize: 12, fontFamily: '$monoFamily', color: '$textMuted' }}
    >
      {`$ ${children}`}
    </text>
  );
}

/**
 * Whatever a child last said on stderr — the difference between a demo that
 * failed and a demo that failed *for a reason you can read*. Muted rather
 * than red: most of what a healthy child says here is a log line, and a
 * demo that paints "conn #1 open" in alarm colours has cried wolf before it
 * has anything to report. What went wrong is on the light beside the
 * process, which is where the room is already looking.
 */
export function Note({ children }: { children: string }): ReactElement | null {
  if (!children) return null;
  return (
    <text
      style={{ fontSize: 11, color: '$textMuted', fontFamily: '$monoFamily' }}
    >
      {children}
    </text>
  );
}
