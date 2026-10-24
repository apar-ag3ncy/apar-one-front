"use client";

import { useEffect, useState } from "react";
import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";
import type Strands from "@/components/effects/strands";

const ORB_PROPS = {
  colors: ["#EB3B25", "#F0883B", "#F6C57A"], count: 5, speed: .85,
  amplitude: 1.3, waviness: 1.1, thickness: .85, glow: 2.8, taper: 1.8,
  spread: 1, intensity: .85, saturation: 1.5, opacity: 1, scale: 1.4,
  glass: true, refraction: 1.1, dispersion: 1, glassSize: 1.05,
};

/** The contact target never depends on a shader, a timer or an animation chunk. */
export function ContactOrb() {
  const [Canvas, setCanvas] = useState<typeof Strands | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MOTION_QUERY);
    let active = true;
    let frame = 0;
    const enhance = () => {
      cancelAnimationFrame(frame);
      if (!media.matches) { setCanvas(null); setReady(false); return; }
      // Give the visible, functional CSS orb its first paint; start enhancement
      // next frame instead of imposing the old fixed 1.8-second hold.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          import("@/components/effects/strands").then(module => {
            if (active && media.matches) setCanvas(() => module.default);
          }).catch(() => { /* The CSS orb remains usable offline. */ });
        });
      });
    };
    enhance();
    media.addEventListener("change", enhance);
    return () => { active = false; cancelAnimationFrame(frame); media.removeEventListener("change", enhance); };
  }, []);

  return <span className="ttu-orb" aria-hidden="true">
    <span className="ttu-orb-placeholder" />
    {Canvas && <span className="ttu-orb-effect" data-ready={ready}>
      <Canvas {...ORB_PROPS} onReadyChange={setReady} />
    </span>}
  </span>;
}
