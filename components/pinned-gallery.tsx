"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ImageSlot } from "./image-slot";

const CARDS = [
  { href: "/work/chheda", num: "01", tag: "Jewellery", title: "Chheda Jewellers", desc: "Brand identity, festive campaigns & social growth", year: "'26", slot: "Drop Chheda image" },
  { href: "/work/girvaan", num: "02", tag: "Jewellery", title: "Girvaan", desc: "Identity & content for a modern jewellery label", year: "'25", slot: "Drop Girvaan image" },
  { href: "/work/diarah", num: "03", tag: "Jewellery", title: "Diarah", desc: "Luxury rebrand & performance campaigns", year: "'25", slot: "Drop Diarah image" },
  { href: "/clients", num: "04", tag: "Lifestyle", title: "High on Smiles", desc: "Brand world & always-on social", year: "'24", slot: "Drop High on Smiles image" },
];

/**
 * Pinned horizontal-scroll work gallery — projects slide sideways through a
 * sticky stage with a live progress bar. GSAP ScrollTrigger scrubs the track.
 */
export function PinnedGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    // Only drive the horizontal scrub above the mobile breakpoint; below it the
    // CSS collapses the pin into a normal vertical stack.
    mm.add("(min-width: 761px)", () => {
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) {
              progressRef.current.style.width = (8 + self.progress * 92).toFixed(1) + "%";
            }
          },
        },
      });
      return () => tween.scrollTrigger?.kill();
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pin"
      data-screen-label="Home — Work Gallery"
      style={{ height: "440vh" }}
    >
      <div className="pin-sticky">
        <div ref={trackRef} className="pin-track">
          <div className="pin-intro">
            <div className="eyebrow">
              <i className="dot" /> Selected work
            </div>
            <h2>
              Work that earns <em>attention.</em>
            </h2>
            <p>
              A focused body of branding, marketing and campaign work for jewellery and real-estate
              brands. Keep scrolling →
            </p>
          </div>

          {CARDS.map((c) => (
            <a className="pin-card" href={c.href} key={c.num}>
              <div className="frame">
                <span className="num">{c.num}</span>
                <span className="tagpill">{c.tag}</span>
                <ImageSlot shape="rounded" radius={5} placeholder={c.slot} style={{ width: "100%" }} />
              </div>
              <div className="cap">
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
                <span>{c.year}</span>
              </div>
            </a>
          ))}

          <div
            className="pin-card"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <a className="btn cream" href="/clients">
              <span>See all clients</span>
              <span className="arr">↗</span>
            </a>
          </div>
        </div>
        <div className="pin-progress">
          <i ref={progressRef} />
        </div>
        <div className="pin-hint">Drag · Scroll</div>
      </div>
    </section>
  );
}
