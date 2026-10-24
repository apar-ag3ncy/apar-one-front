"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Environment, MeshRefractionMaterial } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOBILE_LAYOUT_QUERY } from "@/lib/motion-policy";

/**
 * ExplodedRing - a scroll-driven exploded view of a piece of jewellery.
 *
 * The visitor scrolls through a tall section; a sticky stage holds a
 * react-three-fiber scene in which the ring's parts (stone, prongs, head,
 * band) travel to their exploded positions and back, while the piece slowly
 * turns and the camera moves in. One GSAP ScrollTrigger timeline (scrub 1.2,
 * fed by the site's Lenis) drives every part; the canvas renders on demand, so
 * a still page costs nothing.
 *
 * Built against a PLACEHOLDER ring (parametric primitives). The real piece
 * arrives as a GLB made from the jeweller's CAD with named nodes - see
 * docs/research/exploded-view-brief (the pipeline: re-mesh in Rhino, split
 * parts in Blender, gltfpack -kn). Swap <PlaceholderRing> for a useGLTF scene
 * and register the same part names; everything else stays.
 *
 * Materials: MeshPhysicalMaterial (gold) and drei's MeshRefractionMaterial
 * (stones) lit by a studio HDR at /hdr/studio_small_09_1k.hdr (Poly Haven,
 * CC0). Fallbacks: no WebGL2 -> a static panel; reduced motion -> the ring at
 * rest, no scrub.
 */

const HDR = "/hdr/studio_small_09_1k.hdr";
const GOLD = "#F1D08C";

// Where each part travels when the ring is fully open (world units; the band's
// radius is 1). A GLB from CAD would instead compute these radially from the
// stone's centre - the shape of `PartTargets` is the same either way.
type PartName = "band" | "head" | "prong-0" | "prong-1" | "prong-2" | "prong-3" | "stone";
const EXPLODE: Record<PartName, THREE.Vector3> = {
  band: new THREE.Vector3(0, -0.85, 0),
  head: new THREE.Vector3(0, -0.28, 0),
  "prong-0": new THREE.Vector3(0.55, 0.22, 0.55),
  "prong-1": new THREE.Vector3(-0.55, 0.22, 0.55),
  "prong-2": new THREE.Vector3(-0.55, 0.22, -0.55),
  "prong-3": new THREE.Vector3(0.55, 0.22, -0.55),
  stone: new THREE.Vector3(0, 0.78, 0),
};

export type ExplodedRingProps = {
  /** The tall scrolling section (trigger). Rendered by the page around the stage. */
  sectionRef: React.RefObject<HTMLElement | null>;
  /** Caption elements revealed as the ring opens (in order: band, prongs, stone). */
  captionRefs: React.RefObject<(HTMLElement | null)[]>;
  /** The scroll hint, dissolved as soon as the scrub starts. */
  hintRef: React.RefObject<HTMLDivElement | null>;
};

/* ---------------------------------------------------------------------------
 * Placeholder geometry - a round brilliant approximated as a faceted crown +
 * pavilion (flat facets: non-indexed, per-face normals), a torus band, a
 * tapered head and four prongs.
 * ------------------------------------------------------------------------ */
function facet(geometry: THREE.BufferGeometry) {
  const g = geometry.toNonIndexed();
  g.computeVertexNormals();
  geometry.dispose();
  return g;
}

function PlaceholderRing({ register, envMap }: { register: (name: PartName, obj: THREE.Object3D) => void; envMap: THREE.Texture }) {
  const crown = useMemo(() => facet(new THREE.CylinderGeometry(0.3, 0.5, 0.17, 8)), []);
  const pavilion = useMemo(() => facet(new THREE.ConeGeometry(0.5, 0.46, 8)), []);
  const prongGeo = useMemo(() => new THREE.CylinderGeometry(0.03, 0.05, 0.44, 12), []);
  const metal = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 1, roughness: 0.22, envMapIntensity: 1.15 }),
    []
  );
  useEffect(() => () => { crown.dispose(); pavilion.dispose(); prongGeo.dispose(); metal.dispose(); }, [crown, pavilion, prongGeo, metal]);

  const ref = (name: PartName) => (o: THREE.Object3D | null) => { if (o) register(name, o); };
  const prongAngles = [45, 135, 225, 315];

  return (
    <group rotation={[0.12, 0, 0]}>
      {/* band */}
      <mesh ref={ref("band")} name="band" material={metal}>
        <torusGeometry args={[1, 0.11, 48, 160]} />
      </mesh>
      {/* head / gallery under the stone */}
      <mesh ref={ref("head")} name="head" position={[0, 1.05, 0]} material={metal}>
        <cylinderGeometry args={[0.36, 0.26, 0.22, 32]} />
      </mesh>
      {/* prongs */}
      {prongAngles.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const r = 0.34;
        return (
          <mesh
            key={deg}
            ref={ref(`prong-${i}` as PartName)}
            name={`prong-${i}`}
            geometry={prongGeo}
            material={metal}
            position={[Math.cos(a) * r, 1.3, Math.sin(a) * r]}
            rotation={[Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2]}
          />
        );
      })}
      {/* stone: crown + pavilion share one group so it explodes as one part */}
      <group ref={ref("stone")} name="stone" position={[0, 1.42, 0]}>
        <mesh geometry={crown} position={[0, 0.085, 0]}>
          <MeshRefractionMaterial envMap={envMap} bounces={2} ior={2.42} fresnel={1} aberrationStrength={0.02} fastChroma toneMapped={false} />
        </mesh>
        <mesh geometry={pavilion} rotation={[Math.PI, 0, 0]} position={[0, -0.23, 0]}>
          <MeshRefractionMaterial envMap={envMap} bounces={2} ior={2.42} fresnel={1} aberrationStrength={0.02} fastChroma toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * Scene - lighting, the ring, and the ScrollTrigger timeline that drives it.
 * ------------------------------------------------------------------------ */
function Scene({ sectionRef, captionRefs, hintRef, reduce }: ExplodedRingProps & { reduce: boolean }) {
  const hdr = useLoader(RGBELoader, HDR);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  const { invalidate, camera } = useThree();
  const parts = useRef(new Map<PartName, THREE.Object3D>());
  const rig = useRef<THREE.Group>(null);
  const register = (name: PartName, obj: THREE.Object3D) => parts.current.set(name, obj);

  useLayoutEffect(() => {
    camera.position.set(0, 1.05, 4.6);
    camera.lookAt(0, 0.8, 0);
    invalidate();
  }, [camera, invalidate]);

  useEffect(() => {
    const section = sectionRef.current;
    const group = rig.current;
    if (!section || !group || reduce) return;
    gsap.registerPlugin(ScrollTrigger);

    // Rest positions are read once; targets are rest + the exploded offset.
    const rest = new Map<PartName, THREE.Vector3>();
    for (const [name, obj] of parts.current) rest.set(name, obj.position.clone());

    const look = new THREE.Vector3(0, 0.8, 0);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: () => {
          camera.lookAt(look);
          invalidate();
        },
      },
    });
    // 0-0.62: parts open (stone first, band last); 0.62-1: hold, keep turning.
    const order: PartName[] = ["stone", "prong-0", "prong-1", "prong-2", "prong-3", "head", "band"];
    order.forEach((name, i) => {
      const obj = parts.current.get(name);
      const r = rest.get(name);
      if (!obj || !r) return;
      const t = r.clone().add(EXPLODE[name]);
      tl.to(obj.position, { x: t.x, y: t.y, z: t.z, duration: 0.5, ease: "power2.inOut" }, 0.02 * i);
    });
    tl.to(group.rotation, { y: 1.1, duration: 1 }, 0);
    tl.to(camera.position, { z: 3.7, y: 1.25, duration: 1 }, 0);
    // captions + hint (HTML, outside the canvas)
    const caps = captionRefs.current ?? [];
    if (!window.matchMedia(MOBILE_LAYOUT_QUERY).matches) {
      caps.forEach((el, i) => { if (el) tl.to(el, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" }, 0.18 + i * 0.16); });
      if (hintRef.current) tl.to(hintRef.current, { opacity: 0, duration: 0.08 }, 0);
    }

    // Lenis/GSAP already sync; a refresh after mount picks up the section's height.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(raf);
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [sectionRef, captionRefs, hintRef, reduce, camera, invalidate]);

  return (
    <>
      <Environment map={hdr} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.1} color="#FFF3E2" />
      <group ref={rig} rotation={[0, -0.35, 0]}>
        <PlaceholderRing register={register} envMap={hdr} />
      </group>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Public component - capability gate + canvas.
 * ------------------------------------------------------------------------ */
export function ExplodedRing(props: ExplodedRingProps) {
  const [support, setSupport] = useState<"unknown" | "ok" | "none">("unknown");
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    setSupport(gl ? "ok" : "none");
    setReduce(matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (support === "none") {
    return (
      <div className="xr-fallback" role="img" aria-label="A gold solitaire ring, opened into its stone, prongs, head and band">
        <span className="xr-fallback-eyebrow">3D view</span>
        <p>This browser has no WebGL, so the ring can&apos;t be opened here. The still sequence plays in any modern browser.</p>
      </div>
    );
  }
  if (support === "unknown") return <div className="xr-canvas" aria-hidden="true" />;

  return (
    <div className="xr-canvas">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ fov: 30, near: 0.1, far: 50, position: [0, 1.05, 4.6] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Scene {...props} reduce={reduce} />
      </Canvas>
    </div>
  );
}
