"use client";

import Strands from "./strands";

/**
 * StrandsBackdrop — the stats-band background. Deliberately NOT the Algolia-style
 * PixelDome beam used by the brand band / hero: here we weave flowing ribbons of
 * light (React Bits "Strands", ogl/WebGL) in the brand's warm palette
 * (red -> orange -> gold) so the band feels related but distinct. Sits behind
 * the band content (z-index 0) on the same near-black base; click-through.
 * Always renders (signature element); its loop parks off-screen / during scroll.
 */
export function StrandsBackdrop() {
  return (
    <div className="band-bg" aria-hidden>
      <Strands
        colors={["#EB3B25", "#F0883B", "#F6C57A"]}
        count={6}
        speed={0.4}
        amplitude={1.5}
        waviness={1}
        thickness={0.7}
        glow={2.2}
        taper={2.4}
        spread={1.1}
        intensity={0.55}
        saturation={1.25}
        opacity={1}
        scale={1.35}
      />
    </div>
  );
}
