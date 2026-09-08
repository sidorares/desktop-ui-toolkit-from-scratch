// The packages, and which of them are not JavaScript.
//
// A layer diagram says how the thing is *organised*; this one says what you
// would actually install, and it is drawn rather than listed because the
// claim the talk makes about it is a claim about a *shape*: one spine from
// the workbench down to the socket, a couple of satellites, and — the point —
// only two nodes in the whole picture that are not JavaScript.
//
// **Three tiers, not two.** "Pure JS vs compiled" is the split the talk cares
// about, but drawn honestly it has a middle: `yoga-layout` is compiled, and
// ships as base64-inlined WebAssembly, so it needs no toolchain and no
// `node-gyp` and installs like any other package. That middle tier is the
// whole reason "no binary modules" survived fifteen years — and why breaking
// it for `@windowkit/appkit` on macOS was a real decision rather than a
// gradual slide. Colouring yoga the same red as AppKit would tell that story
// wrong.
//
// Edge direction is **A → B means A depends on B**, which is the way round a
// lockfile reads. Two edges are deliberately *not* dependencies and are drawn
// dashed and headless, so the shape says "not installed by any of this"
// before anyone reads the label: `node-x11` proxies through the visualizer
// when `DISPLAY` points at it, and react-devtools is joined by a websocket
// and nothing else.
//
// The visualizer also *depends* on react-x11 — its own UI is a react-x11 app,
// which is the nicest fact about it — and that edge is deliberately missing.
// Drawn, it crossed the entire diagram diagonally to reach react-x11 in the
// middle, and cost more legibility than the loop was worth. It is a sentence
// in the speaker notes and a phrase in the node's description instead.
//
// Every version and every edge here was read off `node_modules`, not
// remembered: `x11` is `node-x11`'s package name, `x11-dri` is
// `node-x11-dri`'s, and both arrive through `ntk` rather than through
// `react-x11`.
import { useMemo, useRef } from 'react';
import type { ReactElement } from 'react';

import { Flow, useEdgesState, useNodesState } from '@react-x11/components/flow';
import type {
  FlowEdge,
  FlowInstance,
  FlowNodeData,
  HandleSpec,
  NodeAppearance,
} from '@react-x11/components/flow';

import { useStep } from '../steps.js';
import { Caption, fill } from './panel.js';

/**
 * What a node is made of. The three tiers are the slide's argument, so they
 * are a type rather than a colour written at each call site.
 */
type Tier = 'js' | 'wasm' | 'native' | 'external';

const TIERS: Record<Tier, { accent: string; label: string }> = {
  js: { accent: '#3fb950', label: 'pure JavaScript' },
  wasm: { accent: '#d29922', label: 'compiled → inlined WASM' },
  native: { accent: '#f85149', label: 'compiled binary' },
  external: { accent: '#8b949e', label: 'not a dependency' },
};

/** Four named handles, so an edge can say which side it leaves and arrives
 *  on — the graph runs down a spine *and* sideways into satellites, and one
 *  source/target pair cannot express the second. Same reasoning as
 *  `architecture.tsx`. */
const HANDLES: readonly HandleSpec[] = [
  { id: 'l', type: 'target', position: 'left' },
  { id: 't', type: 'target', position: 'top' },
  { id: 'r', type: 'source', position: 'right' },
  { id: 'b', type: 'source', position: 'bottom' },
];

interface Pkg {
  id: string;
  label: string;
  description: string;
  tier: Tier;
  x: number;
  y: number;
  width?: number;
}

/**
 * The spine runs down the middle; everything `react-x11` pulls in sits to its
 * right, and the two things that are not dependencies sit furthest out. The
 * positions are hand-placed rather than auto-laid-out because the *reading
 * order* is the content: top is what you type `npm install` for, bottom is a
 * socket.
 */
const PACKAGES: readonly Pkg[] = [
  { id: 'workbench', label: '@react-x11/workbench', description: 'stories · the dev loop', tier: 'js', x: 250, y: 0, width: 205 },
  { id: 'components', label: '@react-x11/components', description: 'charts · terminal · flow · markdown', tier: 'js', x: 250, y: 110, width: 245 },
  { id: 'reactx11', label: 'react-x11', description: 'reconciler host · style · paint', tier: 'js', x: 250, y: 240, width: 210 },
  { id: 'ntk', label: 'ntk', description: 'shaping · decode · XRender', tier: 'js', x: 250, y: 400, width: 195 },
  { id: 'nodex11', label: 'node-x11', description: 'the protocol, encoded in JS', tier: 'js', x: 250, y: 515, width: 195 },
  { id: 'xserver', label: 'X server', description: 'owns the pixels', tier: 'external', x: 250, y: 630, width: 165 },

  { id: 'reconciler', label: 'react-reconciler', description: "React's own host interface", tier: 'js', x: -20, y: 240, width: 200 },

  { id: 'yoga', label: 'yoga-layout', description: 'flexbox · no toolchain needed', tier: 'wasm', x: 545, y: 175, width: 200 },
  { id: 'dbus', label: 'dbus-native', description: 'appearance · a11y · menus', tier: 'js', x: 545, y: 265, width: 200 },
  { id: 'appkit', label: '@windowkit/appkit', description: 'the macOS backend', tier: 'native', x: 545, y: 355, width: 200 },
  { id: 'dri', label: 'node-x11-dri', description: 'direct rendering, for GL', tier: 'native', x: 545, y: 500, width: 195 },

  { id: 'vis', label: 'x11-protocol-visualizer', description: 'on the wire · UI built with react-x11', tier: 'js', x: 545, y: 630, width: 235 },
  { id: 'devtools', label: 'react-devtools', description: 'listens on ws :8097', tier: 'external', x: -30, y: 105, width: 190 },
];

/** `A → B` reads "A depends on B". The two that are not dependencies say so
 *  in their label and are drawn dashed. */
const LINKS: readonly (FlowEdge & { optional?: boolean; wire?: boolean })[] = [
  { id: 'wb-comp', source: 'workbench', sourceHandle: 'b', target: 'components', targetHandle: 't' },
  { id: 'comp-rx', source: 'components', sourceHandle: 'b', target: 'reactx11', targetHandle: 't' },
  { id: 'rx-rec', source: 'reactx11', sourceHandle: 'l', target: 'reconciler', targetHandle: 'r' },
  { id: 'rx-yoga', source: 'reactx11', sourceHandle: 'r', target: 'yoga', targetHandle: 'l' },
  { id: 'rx-dbus', source: 'reactx11', sourceHandle: 'r', target: 'dbus', targetHandle: 'l', label: 'optional', optional: true },
  { id: 'rx-appkit', source: 'reactx11', sourceHandle: 'r', target: 'appkit', targetHandle: 'l', label: 'optional · macOS', optional: true },
  { id: 'rx-ntk', source: 'reactx11', sourceHandle: 'b', target: 'ntk', targetHandle: 't' },
  { id: 'ntk-x11', source: 'ntk', sourceHandle: 'b', target: 'nodex11', targetHandle: 't' },
  { id: 'ntk-dri', source: 'ntk', sourceHandle: 'r', target: 'dri', targetHandle: 'l', label: 'optional', optional: true },
  { id: 'x11-srv', source: 'nodex11', sourceHandle: 'b', target: 'xserver', targetHandle: 't', label: 'the wire' },

  // Not dependencies. The visualizer sits *on* the wire, and happens to be
  // written in the thing it is debugging.
  { id: 'x11-vis', source: 'nodex11', sourceHandle: 'r', target: 'vis', targetHandle: 'l', label: 'DISPLAY=:1', wire: true },
  { id: 'dt-rx', source: 'devtools', sourceHandle: 'r', target: 'reactx11', targetHandle: 'l', label: 'ws :8097', wire: true },
];

const MINIMAP = { width: 150, height: 105 };
const FIT_PADDING = 0.1;

function appearance(tier: Tier, dim: boolean): NodeAppearance {
  const { accent } = TIERS[tier];
  return {
    accent: dim ? '#39414d' : accent,
    background: '#161b22',
    borderColor: dim ? '#232a33' : '#2a3038',
    color: dim ? '#5a636e' : '#e6edf3',
    borderRadius: 8,
  };
}

/** One swatch in the legend under the graph. */
function Key({ tier, dim }: { tier: Tier; dim: boolean }): ReactElement {
  const { accent, label } = TIERS[tier];
  return (
    <box style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <box
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          backgroundColor: dim ? '#39414d' : accent,
          transition: 200,
        }}
      />
      <text style={{ fontSize: 13, color: dim ? '$textMuted' : '$text' }}>
        {label}
      </text>
    </box>
  );
}

export interface EcosystemProps {
  /** Pinned, for a story. A slide leaves it out and takes what it is given. */
  height?: number;
  /**
   * The step that dims everything still written in JavaScript, leaving the
   * two compiled nodes lit. `0` opts out and shows the whole graph at full
   * strength, which is what a story wants.
   */
  revealAt?: number;
}

export function Ecosystem({
  height,
  revealAt = 1,
}: EcosystemProps): ReactElement {
  const { step } = useStep();
  const focusCompiled = revealAt !== 0 && step >= revealAt;

  // The pane owns positions once it has them, so a drag survives the reveal.
  const [nodes, , onNodesChange] = useNodesState<FlowNodeData>(
    useMemo(
      () =>
        PACKAGES.map((p) => ({
          id: p.id,
          position: { x: p.x, y: p.y },
          width: p.width,
          data: { label: p.label, description: p.description },
        })),
      [],
    ),
  );
  const [edges, , onEdgesChange] = useEdgesState(
    useMemo(() => LINKS.map(({ optional, wire, ...e }) => e), []),
  );

  const painted = useMemo(
    () =>
      nodes.map((node) => {
        const pkg = PACKAGES.find((p) => p.id === node.id)!;
        // On the reveal, everything that is *not* compiled steps back. The
        // X server dims too — it is not a package, and the question on this
        // step is "what did you have to build".
        const dim = focusCompiled && pkg.tier !== 'wasm' && pkg.tier !== 'native';
        return { ...node, style: appearance(pkg.tier, dim), handles: HANDLES };
      }),
    [nodes, focusCompiled],
  );

  const wired = useMemo(
    () =>
      edges.map((edge) => {
        const link = LINKS.find((l) => l.id === edge.id)!;
        return {
          ...edge,
          type: 'smoothstep' as const,
          animated: link.wire,
          markerEnd: link.wire ? null : edge.markerEnd,
          style: {
            stroke: link.wire ? '#58a6ff' : link.optional ? '#4a5560' : '#3d4753',
            dash: link.wire || link.optional ? [6, 4] : undefined,
          },
        };
      }),
    [edges],
  );

  const flow = useRef<FlowInstance>(null);
  // `fitView` frames on the first layout that has a size, and a panel that
  // grows is not that size yet. Re-frame when the box actually changes —
  // same reason, same fix, as `architecture.tsx`.
  const framedFor = useRef('');

  return (
    <box style={{ gap: 8, ...fill(height) }}>
      <Caption>flow — what you would install, and what had to be built</Caption>
      <box
        style={{ flexGrow: 1, minHeight: 0 }}
        onLayout={(ev) => {
          const size = `${Math.round(ev.width)}x${Math.round(ev.height)}`;
          if (size === framedFor.current) return;
          framedFor.current = size;
          flow.current?.fitView({ padding: FIT_PADDING });
        }}
      >
        <Flow
          ref={flow}
          nodes={painted}
          edges={wired}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          fitView
          fitViewOptions={{ padding: FIT_PADDING }}
          background="dots"
          controls
          minimap={{ width: MINIMAP.width, height: MINIMAP.height }}
          style={{ flexGrow: 1, minHeight: 0, borderRadius: 8 }}
        />
      </box>
      <box style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
        <Key tier="js" dim={focusCompiled} />
        <Key tier="wasm" dim={false} />
        <Key tier="native" dim={false} />
        <Key tier="external" dim={focusCompiled} />
      </box>
    </box>
  );
}
