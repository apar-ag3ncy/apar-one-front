"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VideoSlot } from "./video-slot";
import { FEATURED_CLIENTS } from "@/lib/cases";

// Derived from the single source of truth (lib/cases.tsx) — every case auto-appears
// in the horizontal scroll, in order, with no manual sync as cases are added.
// Each frame plays /videos/<slug>.mp4 (drop the file in and it appears).

// Temporary fills so no frame sits empty while per-client films are produced:
// clients without their own /videos/<slug>.mp4 cycle through the available
// brand films (no two adjacent frames repeat). To replace one, drop a real
// <slug>.mp4 into /public/videos and delete the slug from this map.
const VIDEO_FILL: Record<string, string> = {
  diarah: "/videos/girvaan-hanuman-jayanti.mp4",
  "maison-mireyaa": "/videos/girvaan-fathers-day.mp4",
  achal: "/videos/girvaan-mahavir.mp4",
  "high-on-smiles": "/videos/girvaan.mp4",
  "silver-emporium": "/videos/chheda.mp4",
  "a-paramount": "/videos/girvaan-hanuman-jayanti.mp4",
  "kundan-jewellers": "/videos/girvaan-fathers-day.mp4",
  "jatubhai-velji": "/videos/girvaan-mahavir.mp4",
  signi: "/videos/girvaan.mp4",
  tarava: "/videos/chheda.mp4",
};

const CARDS = FEATURED_CLIENTS.map((c) => ({
  href: c.href,
  num: c.i,
  tag: c.cat,
  title: c.name,
  desc: c.blurb,
  year: c.year ? `'${c.year.slice(-2)}` : "",
  video: VIDEO_FILL[c.slug] ?? `/videos/${c.slug}.mp4`,
  slot: `Drop ${c.name} video`,
}));

// Scroll length scales with card count (+2 fixed panels: intro & CTA) so the pin
// pacing stays consistent as cases are added. 4 cards ≈ 440vh baseline.
const PIN_HEIGHT = `${Math.round((CARDS.length + 2) * 74)}vh`;

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
              progressRef.current.style.setProperty(
                "--pp-scale",
                String(0.08 + self.progress * 0.92)
              );
            }
            const skew = Math.max(-1, Math.min(1, self.getVelocity() * 0.00003));
            section.style.setProperty("--scroll-skew", skew.toFixed(3));
          },
          onScrubComplete: () => section.style.setProperty("--scroll-skew", "0"),
          onLeave: () => section.style.setProperty("--scroll-skew", "0"),
          onLeaveBack: () => section.style.setProperty("--scroll-skew", "0"),
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        section.style.removeProperty("--scroll-skew");
      };
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pin"
      data-screen-label="Home — Work Gallery"
      style={{ height: PIN_HEIGHT }}
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
                <VideoSlot src={c.video} radius={5} placeholder={c.slot} style={{ width: "100%" }} />
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
