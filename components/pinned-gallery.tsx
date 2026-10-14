"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { VideoSlot } from "./video-slot";
import { FEATURED_CLIENTS } from "@/lib/cases";
import { HoverText } from "./hover-text";

// Derived from the single source of truth (lib/cases.tsx) - every case auto-appears
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

// Harshit Gold is an image-led story in /clients; add it to the film rail only
// when its own campaign film is supplied, rather than request a missing video.
const CARDS = FEATURED_CLIENTS.filter(c => c.slug !== "harshit-gold").map((c) => ({
  href: c.href,
  num: c.i,
  tag: c.cat,
  title: c.name,
  desc: c.blurb,
  year: c.year ? `'${c.year.slice(-2)}` : "",
  video: VIDEO_FILL[c.slug] ?? `/videos/${c.slug}.mp4`,
  slot: `${c.name} campaign film`,
}));

/** Native horizontal work rail: horizontal input stays horizontal; vertical input
 * continues down the page. GSAP only eases explicit previous/next actions. */
export function PinnedGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [position, setPosition] = useState({ index: 0, end: false });

  const move = (direction: number) => {
    const rail = trackRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>(".pin-card"));
    const gutter = parseFloat(getComputedStyle(rail).paddingLeft);
    const closest = cards.reduce((best, card, i) =>
      Math.abs(card.offsetLeft - gutter - rail.scrollLeft) < Math.abs(cards[best].offsetLeft - gutter - rail.scrollLeft) ? i : best, 0);
    const index = Math.max(0, Math.min(cards.length - 1, closest + direction));
    tweenRef.current?.kill();
    rail.dataset.sliding = "true";
    tweenRef.current = gsap.to(rail, {
      scrollLeft: Math.min(rail.scrollWidth - rail.clientWidth, cards[index].offsetLeft - gutter),
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.65,
      ease: "power3.out",
      onComplete: () => { delete rail.dataset.sliding; },
    });
  };

  useEffect(() => {
    const rail = trackRef.current;
    if (!rail) return;
    let pointer = -1, startX = 0, startY = 0, startScroll = 0, dragging = false, suppressClick = false;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>(".pin-card"));
    let offsets: number[] = [], maxScroll = 0, frame = 0;
    const update = () => {
      frame = 0;
      const left = rail.scrollLeft;
      const index = offsets.reduce((best, offset, i) =>
        Math.abs(offset - left) < Math.abs(offsets[best] - left) ? i : best, 0);
      const end = left >= maxScroll - 2;
      setPosition(old => old.index === index && old.end === end ? old : { index, end });
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      const gutter = parseFloat(getComputedStyle(rail).paddingLeft);
      offsets = cards.map(card => card.offsetLeft - gutter);
      maxScroll = rail.scrollWidth - rail.clientWidth;
      scheduleUpdate();
    };
    const interrupt = () => { tweenRef.current?.kill(); delete rail.dataset.sliding; };
    const wheel = (e: WheelEvent) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) interrupt(); };
    const down = (e: PointerEvent) => {
      interrupt();
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pointer = e.pointerId; startX = e.clientX; startY = e.clientY; startScroll = rail.scrollLeft;
      dragging = false; suppressClick = false;
    };
    const drag = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const dx = e.clientX - startX;
      if (!dragging && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
        dragging = true; suppressClick = true;
        rail.setPointerCapture(pointer); rail.dataset.sliding = "true";
      }
      if (dragging) { e.preventDefault(); rail.scrollLeft = startScroll - dx; }
    };
    const up = () => {
      if (pointer >= 0 && rail.hasPointerCapture(pointer)) rail.releasePointerCapture(pointer);
      pointer = -1; dragging = false; delete rail.dataset.sliding;
    };
    const click = (e: MouseEvent) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; } };
    const preventDrag = (e: DragEvent) => e.preventDefault();
    rail.addEventListener("scroll", scheduleUpdate, { passive: true });
    rail.addEventListener("pointerdown", down);
    rail.addEventListener("pointermove", drag);
    rail.addEventListener("pointerup", up);
    rail.addEventListener("pointercancel", up);
    rail.addEventListener("lostpointercapture", up);
    rail.addEventListener("click", click, true);
    rail.addEventListener("dragstart", preventDrag);
    rail.addEventListener("wheel", wheel, { passive: true });
    const ro = new ResizeObserver(measure); ro.observe(rail); cards.forEach(card => ro.observe(card)); measure();
    return () => {
      tweenRef.current?.kill(); ro.disconnect(); cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", scheduleUpdate);
      rail.removeEventListener("pointerdown", down);
      rail.removeEventListener("pointermove", drag);
      rail.removeEventListener("pointerup", up);
      rail.removeEventListener("pointercancel", up);
      rail.removeEventListener("lostpointercapture", up);
      rail.removeEventListener("click", click, true);
      rail.removeEventListener("dragstart", preventDrag);
      rail.removeEventListener("wheel", wheel);
    };
  }, []);

  return (
    <section
      className="pin"
      data-screen-label="Home - Work Gallery"
      aria-label="Selected work"
    >
      <div className="pin-sticky">
          <div className="pin-intro">
            <div className="eyebrow">
              <i className="dot" /> Selected work
            </div>
            <h2>
              Work that earns <em>attention.</em>
            </h2>
            <p>
              A focused body of branding, marketing and campaign work for jewellery and real-estate
              brands. Swipe left to explore →
            </p>
          </div>

          <div className="pin-controls">
            <span aria-live="polite">{String(Math.min(position.index + 1, CARDS.length)).padStart(2, "0")} / {CARDS.length}</span>
            <button type="button" aria-label="Previous project" aria-controls="work-rail" disabled={position.index === 0} onClick={() => move(-1)}>←</button>
            <button type="button" aria-label="Next project" aria-controls="work-rail" disabled={position.end} onClick={() => move(1)}>→</button>
          </div>
        <div ref={trackRef} id="work-rail" className="pin-track" data-lenis-prevent-horizontal tabIndex={0} role="region" aria-label="Project carousel — swipe horizontally" onKeyDown={e => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); move(e.key === "ArrowRight" ? 1 : -1); }
        }}>
          {CARDS.map((c) => (
            <Link className="pin-card" href={c.href} key={c.num}>
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
            </Link>
          ))}

          <div
            className="pin-card"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Link className="btn cream" href="/clients">
              <HoverText>See all clients</HoverText>
              <span className="arr" aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
