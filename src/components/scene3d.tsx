/** @jsxImportSource @react-x11/components/three */
// A three.js-shaped scene, on `<glarea>`.
//
// The file pragma above is the whole trick: inside it a lowercase tag is a
// scene object rather than a host element, which is what makes this read like
// react-three-fiber. Core's own elements are still in scope — the JSX
// namespace merges them — so the `<box>` around the fallback is a yoga box
// and the `<mesh>` beside it is a mesh.
//
// It earns its place on the showcase for a reason the other demos cannot make:
// `<glarea>` is a **real X window on its own visual**, given to GL. Nothing
// composites it into the toolkit's picture; the server does. On the Cocoa
// backend the same element is CGL into a CALayer, which is why this runs at
// all on the machine the talk is given from.
//
// Every prop below is driven by an ordinary widget above the canvas
// (`scenes.tsx`), which is the second half of the demo: a `<Slider>` laid out
// by yoga, changing a number a GL surface reads on its next frame. The two
// know nothing about each other — the slider moves state, the scene renders
// it, and the boundary between the toolkit and the GPU is a prop.
import { useRef } from 'react';
import type { ReactElement } from 'react';

import { Canvas, useFrame } from '@react-x11/components/three';
import { fill } from './panel.js';
import type { Group, Mesh } from '@react-x11/components/three';

/** The shapes the control bar offers for the body in the middle. */
export type SceneShape = 'torus' | 'sphere' | 'box';

/** Radians per second at spin 1, so the motion is the same on a slow frame. */
const SPIN = 0.6;

interface RigProps {
  spin: number;
  wireframe: boolean;
  shape: SceneShape;
  color: string;
  satellites: number;
}

function Body({ shape }: { shape: SceneShape }): ReactElement {
  if (shape === 'sphere') return <sphereGeometry args={[1.35, 32, 24]} />;
  if (shape === 'box') return <boxGeometry args={[2, 2, 2]} />;
  return <torusGeometry args={[1.15, 0.42, 24, 64]} />;
}

function Rig({
  spin,
  wireframe,
  shape,
  color,
  satellites,
}: RigProps): ReactElement {
  const knot = useRef<Mesh>(null);
  const orbit = useRef<Group>(null);
  // The escape from re-rendering: mutate what the ref holds and the next
  // frame draws it, with React uninvolved. `spin` arrives as an ordinary
  // prop and is read here rather than resubscribing, so dragging the slider
  // does not remount anything.
  useFrame((_state, delta) => {
    if (knot.current) {
      knot.current.rotation.x += delta * SPIN * spin;
      knot.current.rotation.y += delta * SPIN * spin * 0.7;
    }
    if (orbit.current) orbit.current.rotation.y += delta * SPIN * spin * 0.5;
  });
  return (
    <group>
      <mesh ref={knot}>
        <Body shape={shape} />
        <meshStandardMaterial
          color={color}
          wireframe={wireframe}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      <group ref={orbit}>
        {Array.from({ length: satellites }, (_, i) => {
          const a = (i / satellites) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 2.6, Math.sin(a * 2) * 0.5, Math.sin(a) * 2.6]}
              rotation={[a, a, 0]}
            >
              <boxGeometry args={[0.42, 0.42, 0.42]} />
              <meshStandardMaterial
                color={i % 2 ? '#e6edf3' : '#8b949e'}
                wireframe={wireframe}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export interface Scene3DProps {
  /** Pinned, for a story. Left out, the surface takes the space it is in. */
  height?: number;
  /** 0 stops it; 1 is the resting speed. */
  spin?: number;
  wireframe?: boolean;
  shape?: SceneShape;
  /** The body's material colour. */
  color?: string;
  /** How many cubes orbit it. */
  satellites?: number;
}

export function Scene3D({
  height,
  spin = 1,
  wireframe = false,
  shape = 'torus',
  color = '#58a6ff',
  satellites = 6,
}: Scene3DProps): ReactElement {
  return (
    <Canvas
      camera={{ position: [0, 2.2, 6], fov: 45 }}
      frameloop="always"
      clearColor="#0e1116"
      glx={{ DEPTH_SIZE: 24 }}
      style={{ ...fill(height), borderRadius: 8 }}
      fallback={(err) => (
        <box
          style={{
            ...fill(height),
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderWidth: 1,
            borderColor: '$border',
            borderRadius: 8,
            backgroundColor: '$surface',
          }}
        >
          <text style={{ fontSize: 13, color: '$textMuted' }}>
            No GL on this connection.
          </text>
          <text style={{ fontSize: 11, color: '$textMuted' }}>{err.message}</text>
        </box>
      )}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <pointLight position={[-4, -2, -3]} intensity={0.5} color="#58a6ff" />
      <Rig
        spin={spin}
        wireframe={wireframe}
        shape={shape}
        color={color}
        satellites={satellites}
      />
    </Canvas>
  );
}
