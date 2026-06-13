"use client";

import Link from "next/link";
import Strands from "@/components/react-bits/Strands";

/**
 * Floating "Talk to us" action button — a refractive glass-orb (react-bits
 * Strands) docked bottom-right on every page, linking to the home contact
 * section. The orb is a tiny capped-DPR canvas that parks when the tab is
 * hidden and respects prefers-reduced-motion, so it stays off the scroll budget.
 */
export function TalkToUs() {
  return (
    <Link href="/#contact" className="ttu" aria-label="Talk to us">
      <span className="ttu-orb" aria-hidden="true">
        <Strands
          colors={["#F97316", "#7C3AED", "#06B6D4"]}
          count={6}
          speed={0.9}
          amplitude={2.4}
          waviness={1.3}
          thickness={0.55}
          glow={2.2}
          taper={2.2}
          spread={1.5}
          intensity={0.7}
          saturation={1.7}
          opacity={1}
          scale={1.1}
          glass
          refraction={1.1}
          dispersion={1}
          glassSize={1.02}
        />
      </span>
      <span className="ttu-label">Talk to us</span>
    </Link>
  );
}
