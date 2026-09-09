// Does a launcher actually start its child under the runtime running this?
// Starts each one, waits, prints the state the panel would show, stops it.
import * as charts from '../src/chartsdemo.js';
import {
  COMMANDS as DEVTOOLS,
  missing as devtoolsMissing,
} from '../src/devtools.js';
import { backendRemedy } from '../src/devtools-backend.js';
import * as hot from '../src/hotreload.js';
import { RUNTIME, runOnNode, runScript } from '../src/runtime.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let bad = 0;

async function probe(
  label: string,
  mod: {
    start(): void;
    stop(): void;
    getState(): { app: { status: string; detail: string }; note: string };
  },
): Promise<void> {
  mod.start();
  await sleep(4000);
  const s = mod.getState();
  const ok = s.app.status === 'running';
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label.padEnd(10)} ${s.app.status}  ${s.app.detail}`);
  if (s.note) console.log(`        note: ${s.note.split('\n')[0].slice(0, 110)}`);
  mod.stop();
  await sleep(500);
}

console.log(`runtime: ${RUNTIME}   execPath: ${process.execPath}\n`);

// What the slides claim, and what will actually be spawned. These have to
// agree — the launcher slides put the command on screen precisely so the room
// leaves with the line they would type.
console.log('resolved');
for (const [label, spawn] of [
  ['charts   ', runScript('examples/charts.tsx')],
  ['devtools ', runScript('examples/devtools-demo.tsx')],
  ['x11 ex.  ', runScript('examples/x11/window.js')],
  [
    'hot      ',
    runOnNode(
      ['--enable-source-maps', '--import', 'react-x11/refresh/register'],
      'examples/hot-demo.jsx',
    ),
  ],
] as const) {
  const bin = spawn.command.split('/').pop();
  const args = spawn.args.map((a) => a.replace(/^.*\/(?=examples\/)/, ''));
  console.log(`  ${label} ${bin} ${args.join(' ')}`);
}
console.log(`  on slides  ${charts.COMMAND}  |  ${DEVTOOLS[1]}  |  ${hot.COMMAND}`);
console.log('');

// The DevTools demo has a third way to fail that a spawn cannot show: react-x11
// imports the bridge lazily and only warns, so a checkout without it runs the
// demo with no bridge at all. The launcher preflights for that; so does this.
const absent = devtoolsMissing();
if (absent.length) bad++;
console.log(
  absent.length
    ? `FAIL  devtools bridge  ${backendRemedy(absent)}`
    : 'ok    devtools bridge  react-devtools-core and ws resolve',
);
console.log('');
await probe('charts', charts);
await probe('hot-reload', hot);
console.log(bad ? `\n${bad} failed` : '\nall launchers started');
process.exit(bad ? 1 : 0);
