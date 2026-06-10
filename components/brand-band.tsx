"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BandBackdrop } from "./band-backdrop";
import { BrandMark } from "./brand-mark";

/**
 * Brand band — the big red APAR mark scales up with a glowing reveal,
 * the glow scrubbing on scroll. Driven by GSAP + ScrollTrigger.
 */
export function BrandBand() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const band = ref.current;
    if (!band || reduce) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // the logo runs its own Apple-style focus-in reveal (framer-motion);
      // GSAP just staggers the supporting lines in.
      const bits = band.querySelectorAll(".bb-kick,.bb-line,.bb-sub");
      gsap.set(bits, { y: 28, opacity: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: band, start: "top 72%" }, defaults: { ease: "power3.out" } })
        .to(bits, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, delay: 0.35 });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, band);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="brand-band" data-screen-label="Home — Brand">
      <BandBackdrop domeY={-0.15} intensity={1.15} />
      <div className="wrap brand-band-in">
        <span className="bb-kick">This is</span>
        <BrandMark className="bb-logo" />
        <div className="bb-line">
          <span>Digital Marketing</span>
          <i />
          <span>Branding</span>
          <i />
          <span>AI Content</span>
          <i />
          <span>Campaigns</span>
        </div>
        <p className="bb-sub">
          A Mumbai-born creative &amp; performance agency, building brands that refuse to blend in.
        </p>
      </div>
    </section>
  );
}
