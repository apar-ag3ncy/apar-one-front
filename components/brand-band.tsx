"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
      const logo = band.querySelector(".bb-logo");
      const glow = band.querySelector(".brand-band-glow");
      const bits = band.querySelectorAll(".bb-kick,.bb-line,.bb-sub");

      gsap.set(logo, { scale: 0.8, opacity: 0, y: 50 });
      gsap.set(bits, { y: 28, opacity: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: band, start: "top 72%" }, defaults: { ease: "power3.out" } })
        .to(logo, { scale: 1, opacity: 1, y: 0, duration: 1.15, ease: "power4.out" })
        .to(bits, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12 }, "-=0.6");

      if (glow) {
        gsap.fromTo(
          glow,
          { scale: 0.6, opacity: 0.4 },
          {
            scale: 1.18,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, band);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="brand-band" data-screen-label="Home — Brand">
      <div className="brand-band-glow" aria-hidden />
      <div className="wrap brand-band-in">
        <span className="bb-kick">This is</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bb-logo" src="/assets/apar-logo-red.svg" alt="APAR" />
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
