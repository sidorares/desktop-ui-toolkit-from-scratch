// react-x11, drawn by react-x11: what actually happens between a `setState`
// and a pixel, as a graph you can drag.
//
// It is here rather than in a slide's prose because a list of layers is not
// the shape of the thing. Two claims only a picture makes: the paint pipeline
// is a *pipeline*, five stages deep, with the backend swapped in one place at
// the bottom; and the desktop-integration hooks do not go through any of it —
// `useBadge` on this deck reaches the Dock down the wing along the bottom,
// which never touches yoga, paint or the X connection.
//
// **Three of the nodes are forms.** `<Flow>`'s node types normally `paint`
// themselves, because a graph of ten thousand cards cannot afford a React
// subtree each; a type that wants a `<Switch>` rather than a picture of one
// asks for `render` instead, and gets an ordinary react-x11 tree mounted in
// the box the pane reserved and scaled with the viewport. So the controls
// here are the same widgets as step 1's, inside a drawn graph, and what they
// change is the graph: the backend radio hides the branch you did not pick,
// the paint switch re-labels and animates the edge under it, and the three
// checkboxes build the D-Bus wing.
//
// No menus in a node body, deliberately. A popup anchors itself off the
// geometry of the widget that owns it, and a widget inside the pane's scale
// box is the one place that is worth confirming somewhere other than on
// stage. Every control here settles in place.
import { useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { Checkbox, Radio, RadioGroup, Switch } from 'react-x11';
import { Flow, useEdgesState, useNodesState } from '@react-x11/components/flow';
import type {
  FlowEdge,
  FlowInstance,
  FlowNode,
  FlowNodeData,
  FlowNodeType,
  HandleSpec,
} from '@react-x11/components/flow';

import { Caption, fill } from './panel.js';

type Backend = 'x11' | 'cocoa';
type Hook = 'badge' | 'tray' | 'notifications';

const HOOKS: readonly Hook[] = ['badge', 'tray', 'notifications'];

/** What the three form nodes read and write. One object, put on every node's
 *  `data`, so the type registry can stay at module scope: a `nodeTypes` built
 *  in a render would be a new registry on every keystroke. */
interface Controls {
  cache: boolean;
  setCache: (on: boolean) => void;
  backend: Backend;
  setBackend: (backend: Backend) => void;
  hooks: readonly Hook[];
  toggleHook: (hook: Hook, on: boolean) => void;
}

interface ArchData extends FlowNodeData {
  controls?: Controls;
}

/**
 * Four handles, named. A graph that runs left to right *and* drops down a
 * column at the end has two directions in it, and a node carrying one source
 * and one target cannot express the second — so every edge below says which
 * side it leaves and arrives on, and the routing follows the reading order
 * rather than the shortest line.
 */
const HANDLES: readonly HandleSpec[] = [
  { id: 'l', type: 'target', position: 'left' },
  { id: 't', type: 'target', position: 'top' },
  { id: 'r', type: 'source', position: 'right' },
  { id: 'b', type: 'source', position: 'bottom' },
];

/** The body of a form node: below the header, which stays draggable. */
function panelBody(children: ReactElement): ReactElement {
  return (
    <box style={{ padding: 10, gap: 8, flexGrow: 1 }}>{children}</box>
  );
}

const NODE_TYPES: Readonly<Record<string, FlowNodeType<ArchData>>> = {
  step: { handles: HANDLES },

  paint: {
    handles: HANDLES,
    render: ({ node }) => {
      const c = node.data?.controls;
      return panelBody(
        <box style={{ gap: 8 }}>
          <box style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Switch
              checked={c?.cache ?? true}
              onChange={(ev) => c?.setCache(ev.value)}
            />
            <text style={{ fontSize: 13 }}>paint cache</text>
          </box>
          <text style={{ fontSize: 12, color: '$textMuted' }}>
            {c?.cache ? 'repaint the damage' : 'repaint everything'}
          </text>
        </box>,
      );
    },
  },

  backend: {
    handles: HANDLES,
    render: ({ node }) => {
      const c = node.data?.controls;
      return panelBody(
        <RadioGroup
          value={c?.backend ?? 'cocoa'}
          onChange={(ev) => c?.setBackend(ev.value as Backend)}
          style={{ gap: 6 }}
        >
          <Radio value="x11" label="node-x11" />
          <Radio value="cocoa" label="cocoa" />
        </RadioGroup>,
      );
    },
  },

  desktop: {
    handles: HANDLES,
    render: ({ node }) => {
      const c = node.data?.controls;
      return panelBody(
        <box style={{ gap: 6 }}>
          {HOOKS.map((hook) => (
            <Checkbox
              key={hook}
              checked={c?.hooks.includes(hook) ?? false}
              onChange={(ev) => c?.toggleHook(hook, ev.value)}
              label={hook}
            />
          ))}
        </box>,
      );
    },
  },
};

/**
 * The graph, without the live values — those are merged in per render, so a
 * drag keeps the position the pane reported and a checkbox does not move
 * anything. Positions are graph units, laid out to fit the pane at a zoom
 * where the form nodes still mount: below 0.6 `<Flow>` does not mount a node
 * body at all, which is the budget that makes the drawn path the default.
 */
const NODES: FlowNode<ArchData>[] = [
  { id: 'app', type: 'step', position: { x: 0, y: 0 }, width: 165,
    data: { label: 'your components', description: 'JSX' } },
  { id: 'reconciler', type: 'step', position: { x: 215, y: 0 }, width: 175,
    data: { label: 'react-reconciler', description: 'commit · effects' } },
  { id: 'nodes', type: 'step', position: { x: 440, y: 0 }, width: 170,
    data: { label: 'node tree', description: 'box · text · window · svg' } },

  { id: 'styles', type: 'step', position: { x: 660, y: -110 }, width: 215,
    data: { label: 'styles', description: '$tokens · :hover · @container' } },
  { id: 'yoga', type: 'step', position: { x: 660, y: 80 }, width: 170,
    data: { label: 'yoga', description: 'flexbox' } },

  { id: 'paint', type: 'paint', position: { x: 920, y: -55 }, width: 200, height: 125,
    data: { label: 'paint' } },
  { id: 'ntk', type: 'step', position: { x: 1290, y: -110 }, width: 170,
    data: { label: 'ntk', description: 'shaping · decode · XRender' } },

  { id: 'backend', type: 'backend', position: { x: 1280, y: 60 }, width: 190, height: 120,
    data: { label: 'backend' } },
  { id: 'x11', type: 'step', position: { x: 1290, y: 250 }, width: 160,
    data: { label: 'node-x11', description: 'the wire' } },
  { id: 'xserver', type: 'step', position: { x: 1290, y: 350 }, width: 160,
    data: { label: 'X server' } },
  { id: 'cocoa', type: 'step', position: { x: 1290, y: 250 }, width: 160,
    data: { label: 'cocoa', description: 'CoreGraphics · CGL' } },
  { id: 'appkit', type: 'step', position: { x: 1290, y: 350 }, width: 160,
    data: { label: 'AppKit' } },

  { id: 'desktop', type: 'desktop', position: { x: 170, y: 190 }, width: 200, height: 150,
    data: { label: 'desktop hooks' } },
  { id: 'dbus', type: 'step', position: { x: 440, y: 235 }, width: 160,
    data: { label: 'session bus', description: 'D-Bus' } },
  { id: 'launcher', type: 'step', position: { x: 650, y: 235 }, width: 175,
    data: { label: 'Dock · launcher', description: 'this deck’s badge' } },
];

const EDGES: FlowEdge[] = [
  { id: 'app-rec', source: 'app', sourceHandle: 'r', target: 'reconciler', targetHandle: 'l' },
  { id: 'rec-nodes', source: 'reconciler', sourceHandle: 'r', target: 'nodes', targetHandle: 'l' },
  { id: 'nodes-styles', source: 'nodes', sourceHandle: 'r', target: 'styles', targetHandle: 'l', label: 'resolve' },
  { id: 'nodes-yoga', source: 'nodes', sourceHandle: 'r', target: 'yoga', targetHandle: 'l', label: 'measure' },
  { id: 'styles-paint', source: 'styles', sourceHandle: 'r', target: 'paint', targetHandle: 'l' },
  { id: 'yoga-paint', source: 'yoga', sourceHandle: 'r', target: 'paint', targetHandle: 'l' },
  { id: 'paint-ntk', source: 'paint', sourceHandle: 'r', target: 'ntk', targetHandle: 'l' },
  { id: 'ntk-backend', source: 'ntk', sourceHandle: 'b', target: 'backend', targetHandle: 't' },
  { id: 'backend-x11', source: 'backend', sourceHandle: 'b', target: 'x11', targetHandle: 't' },
  { id: 'x11-server', source: 'x11', sourceHandle: 'b', target: 'xserver', targetHandle: 't' },
  { id: 'backend-cocoa', source: 'backend', sourceHandle: 'b', target: 'cocoa', targetHandle: 't' },
  { id: 'cocoa-appkit', source: 'cocoa', sourceHandle: 'b', target: 'appkit', targetHandle: 't' },
  { id: 'app-desktop', source: 'app', sourceHandle: 'b', target: 'desktop', targetHandle: 't', label: 'useBadge · useTray' },
  { id: 'desktop-dbus', source: 'desktop', sourceHandle: 'r', target: 'dbus', targetHandle: 'l' },
  { id: 'dbus-launcher', source: 'dbus', sourceHandle: 'r', target: 'launcher', targetHandle: 'l' },
];

/**
 * The half of the graph a backend choice puts away.
 *
 * The two branches sit at the *same* coordinates, which is not a mistake:
 * only ever one of them is visible, so sharing the column keeps the graph
 * a column narrower — the whole picture is width-limited when it is fitted
 * — and, better, means `fitView`'s bounds do not change when the radio
 * moves. The diagram swaps in place instead of jumping.
 */
const BRANCH: Record<Backend, readonly string[]> = {
  x11: ['cocoa', 'appkit', 'backend-cocoa', 'cocoa-appkit'],
  cocoa: ['x11', 'xserver', 'backend-x11', 'x11-server'],
};

const WING = ['dbus', 'launcher', 'desktop-dbus', 'dbus-launcher'];

/**
 * The minimap, a size down from its default, and the fit that keeps the
 * graph out from under it.
 *
 * `fitView` frames the *graph*: it knows nothing about the panels the pane
 * draws over itself, so a graph fitted hard to the edges puts its
 * bottom-right node under the minimap. Padding is a margin **per side**, so
 * every point costs twice — and the ceiling is sharp, because below zoom 0.6
 * `<Flow>` stops mounting node bodies and the three forms here quietly
 * become empty cards. 0.1 fits at about 0.64: clear of the furniture, and
 * clear of the cliff.
 */
const MINIMAP = { width: 160, height: 110 };
const FIT_PADDING = 0.1;

export interface ArchitectureProps {
  /** Pinned, for a story. A slide leaves it out and the pane takes the
   *  space the slide has. */
  height?: number;
}

export function Architecture({ height }: ArchitectureProps): ReactElement {
  // The pane owns positions from here on; these keep a drag across a
  // checkbox, which is the whole reason the controlled form is worth it.
  const [nodes, , onNodesChange] = useNodesState<ArchData>(NODES);
  const [edges, , onEdgesChange] = useEdgesState(EDGES);

  const [cache, setCache] = useState(true);
  const [backend, setBackend] = useState<Backend>('cocoa');
  const [hooks, setHooks] = useState<readonly Hook[]>(['badge']);

  const controls = useMemo<Controls>(
    () => ({
      cache,
      setCache,
      backend,
      setBackend,
      hooks,
      toggleHook: (hook, on) =>
        setHooks((was) =>
          on ? [...was, hook] : was.filter((h) => h !== hook),
        ),
    }),
    [cache, backend, hooks],
  );

  const flow = useRef<FlowInstance>(null);
  // What the last fit was made for. `onLayout` also fires when the box only
  // *moves*, and re-framing then would throw away a pan the room just made.
  const framedFor = useRef('');

  const gone = BRANCH[backend];
  const wingGone = hooks.length === 0;

  const shown = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        hidden: gone.includes(node.id) || (wingGone && WING.includes(node.id)),
        data: { ...node.data, controls },
      })),
    [nodes, gone, wingGone, controls],
  );

  const wired = useMemo(
    () =>
      edges.map((edge) => {
        if (edge.id === 'paint-ntk') {
          return {
            ...edge,
            label: cache ? 'damage only' : 'every frame',
            animated: !cache,
          };
        }
        if (edge.id === 'desktop-dbus') {
          return { ...edge, label: hooks.join(' · ') };
        }
        return {
          ...edge,
          hidden: gone.includes(edge.id) || (wingGone && WING.includes(edge.id)),
        };
      }),
    [edges, cache, hooks, gone, wingGone],
  );

  return (
    <box style={{ gap: 8, ...fill(height) }}>
      <Caption>flow — the architecture, with three nodes you can operate</Caption>
      {/* `controls` and `minimap` are the pane's own furniture — zoom in,
          zoom out and frame-the-graph in one corner, a map of where the
          viewport is in the other. Props rather than child components,
          because the pane *draws* them: they are part of the same picture
          as the graph, not boxes stacked over it.

          `fitView` alone is not enough here, and the reason is the panel
          growing rather than naming a height: the prop frames the graph once,
          on the *first* layout that has a size, and the first layout is not
          the last one. The graph came out framed for a pane it had already
          stopped being, sitting high in the one it ended up in. So the box
          around it reports its own geometry — `onLayout` fires after the
          pass and only when the rect changed — and the pane re-frames on a
          new size. Which also means ⌘+ re-centres it, rather than leaving
          the graph where a smaller slide put it. */}
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
          nodes={shown}
          edges={wired}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          fitView
          fitViewOptions={{ padding: FIT_PADDING }}
          background="dots"
          controls
          minimap={{ width: MINIMAP.width, height: MINIMAP.height }}
          style={{ flexGrow: 1, minHeight: 0, borderRadius: 8 }}
        />
      </box>
    </box>
  );
}
