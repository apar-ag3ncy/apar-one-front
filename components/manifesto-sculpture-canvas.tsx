"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group } from "three";
import type { RefObject } from "react";

type Props = {
  yaw: RefObject<number>;
  pitch: RefObject<number>;
  reducedMotion: boolean;
  onReady: () => void;
};

function Artwork({ yaw, pitch, reducedMotion, onReady }: Props) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/models/apar-manifesto-sculpture.glb");
  useEffect(() => { onReady(); }, [onReady]);
  useFrame((state, delta) => {
    if (!group.current) return;
    if (!reducedMotion) yaw.current += Math.min(delta, 0.05) * 0.08;
    const ease = 1 - Math.exp(-Math.min(delta, 0.05) * 8);
    group.current.rotation.y += (yaw.current - group.current.rotation.y) * ease;
    group.current.rotation.x += (pitch.current - group.current.rotation.x) * ease;
  });
  return <group ref={group}><primitive object={scene} /></group>;
}

export default function SculptureCanvas(props: Props) {
  return <Canvas
    className="manifesto-sculpture-canvas"
    camera={{ position: [2.75, 2.1, 3.8], fov: 42, near: 0.1, far: 30 }}
    dpr={[1, 1.5]}
    gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
  >
    <ambientLight intensity={1.7} />
    <directionalLight position={[0, 4, 5]} color="#ffe2cc" intensity={4} />
    <directionalLight position={[-3, -1, -2]} color="#ff5a3e" intensity={2.5} />
    <Suspense fallback={null}><Artwork {...props} /></Suspense>
  </Canvas>;
}
