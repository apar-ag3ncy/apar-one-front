"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import type { ExplodedRingProps } from "@/components/work/exploded/exploded-ring";

// The 3D bundle (three + R3F + drei + the BVH gem shader) loads only on this
// route and only in the browser; the page shell renders immediately.
const ExplodedRing = dynamic<ExplodedRingProps>(() => import("@/components/work/exploded/exploded-ring").then((m) => m.ExplodedRing), {
  ssr: false,
  loading: () => <div className="xr-canvas xr-loading" aria-hidden="true" />,
});

const CAPTIONS = [
  { k: "Band", v: "18k yellow gold · comfort fit" },
  { k: "Prongs & head", v: "Four-claw setting, open gallery" },
  { k: "Stone", v: "Round brilliant · 1.20 ct" },
];

/**
 * The scroll stage: a tall section whose sticky viewport holds the canvas,
 * three captions that surface as the parts separate, and the scroll hint.
 */
export function ExplodedRingStage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const captionRefs = useRef<(HTMLElement | null)[]>([]);

  return (
    <section ref={sectionRef} className="xr" aria-label="Exploded view of the ring">
      <div className="xr-stage">
        <ExplodedRing sectionRef={sectionRef} captionRefs={captionRefs} hintRef={hintRef} />
        <div className="xr-caps" aria-hidden="true">
          {CAPTIONS.map((c, i) => (
            <div
              key={c.k}
              className={`xr-cap xr-cap-${i}`}
              ref={(el) => {
                captionRefs.current[i] = el;
              }}
            >
              <span className="xr-cap-k">{c.k}</span>
              <span className="xr-cap-v">{c.v}</span>
            </div>
          ))}
        </div>
        <div ref={hintRef} className="xr-hint">
          <span className="cue-mouse" aria-hidden="true" />
          <span>Scroll to open the ring</span>
        </div>
      </div>
    </section>
  );
}
