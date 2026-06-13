"use client";

import Link from "next/link";
import Strands from "@/components/react-bits/Strands";

/**
 * Floating contact orb — a refractive glass "siri" (react-bits Strands) docked
 * bottom-right on every page, linking to the home contact section. Lit with the
 * brand's exact strand palette (red → orange → gold), matching the stats band.
 * The label no longer sits beside it: a soft, small "Talk to us" message fades
 * in only on hover/focus. The orb is a tiny capped-DPR canvas that parks when
 * the tab is hidden and respects prefers-reduced-motion, off the scroll budget.
 */
export function TalkToUs() {
  return (
    <Link href="/#contact" className="ttu" aria-label="Talk to us">
      <span className="ttu-orb" aria-hidden="true">
        <Strands
          colors={["#EB3B25", "#F0883B", "#F6C57A"]}
          count={5}
          speed={0.85}
          amplitude={1.3}
          waviness={1.1}
          thickness={0.85}
          glow={2.8}
          taper={1.8}
          spread={1}
          intensity={0.85}
          saturation={1.5}
          opacity={1}
          scale={1.4}
          glass
          refraction={1.1}
          dispersion={1}
          glassSize={1.05}
        />
      </span>
      <span className="ttu-tip" aria-hidden="true">Talk to us</span>
    </Link>
  );
}
