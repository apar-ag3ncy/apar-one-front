"use client";

import SideRays from "./react-bits/SideRays";

/**
 * SideRaysBackdrop - the stats-band background: volumetric light rays
 * (React Bits "SideRays", ogl/WebGL) fanning across the near-black band in a
 * premium gold + orange mix. Replaces the earlier Prism. Click-through; the
 * component pauses itself when the band scrolls out of view.
 *
 * Gold/orange comes straight from props (no shader edit): rayColor1 is gold,
 * rayColor2 is APAR's brand orange, blended ~half-and-half.
 */
export function SideRaysBackdrop() {
  return (
    <div className="band-bg" aria-hidden>
      <SideRays
        origin="top-right"
        rayColor1="#F4B73E"
        rayColor2="#F0883B"
        blend={0.5}
        saturation={1.5}
        intensity={2.4}
        spread={2.3}
        falloff={1.25}
        speed={1.8}
        opacity={1}
      />
    </div>
  );
}
