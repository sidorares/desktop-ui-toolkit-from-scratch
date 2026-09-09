// Throwaway: the pacemaker's arithmetic, without a window.
//
// The line itself needs a foreground window to photograph, so this checks the
// half that can be wrong silently: that pause banks time instead of losing or
// double-counting it, that reset really zeroes, and that the colour thresholds
// fire where they are supposed to.
import { TALK_MS, elapsed, armed, running, reset, toggle } from '../src/pacemaker.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  — ' + detail : ''}`);
  if (!ok) failures++;
}

check('TALK_MS is forty minutes', TALK_MS === 2_400_000, `${TALK_MS}`);
check('idle: not armed', !armed() && !running() && elapsed() === 0);

toggle();
check('after p: running and armed', running() && armed());
await sleep(600);
const first = elapsed();
check('clock advanced', first >= 550 && first < 900, `${Math.round(first)}ms`);

toggle();
const banked = elapsed();
check('after second p: paused, still armed', !running() && armed());
await sleep(400);
check(
  'paused clock does not move',
  Math.abs(elapsed() - banked) < 5,
  `${Math.round(elapsed() - banked)}ms drift`,
);

toggle();
await sleep(400);
const resumed = elapsed();
check(
  'resume adds to the bank rather than restarting',
  resumed > banked + 300 && resumed < banked + 700,
  `${Math.round(banked)} -> ${Math.round(resumed)}ms`,
);

reset();
check('after P: zeroed and stopped', !armed() && !running() && elapsed() === 0);

// The colour rule, as arithmetic: amber once the clock leads the slides by
// more than the tolerance, red once the slot is spent.
const TOLERANCE = 120_000;
const colour = (ms: number, progress: number) =>
  ms >= TALK_MS
    ? 'danger'
    : ms - progress * TALK_MS > TOLERANCE
      ? 'warning'
      : 'muted';

check('on pace -> muted', colour(TALK_MS * 0.5, 0.5) === 'muted');
check('one minute ahead of the slides -> still muted', colour(TALK_MS * 0.5 + 60_000, 0.5) === 'muted');
check('three minutes ahead -> warning', colour(TALK_MS * 0.5 + 180_000, 0.5) === 'warning');
check('slides ahead of the clock -> muted', colour(TALK_MS * 0.2, 0.6) === 'muted');
check('out of time -> danger', colour(TALK_MS, 1) === 'danger');
check('over time -> danger', colour(TALK_MS + 60_000, 1) === 'danger');

console.log(failures ? `\n${failures} failed` : '\nall passed');
process.exit(failures ? 1 : 0);
