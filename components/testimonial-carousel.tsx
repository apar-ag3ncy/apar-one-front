"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { PhotoSlot } from "./photo-slot";
import { createTestimonialDrum } from "./testimonial-drum";

export interface TestimonialStory {
  slug: string;
  name: string;
  category: string;
  image?: string;
  imageAlt: string;
  logo: string;
  logoTint?: string;
  logoInvert?: boolean;
  surface: string;
  quote: ReactNode;
  by: string;
  kind: "Client words" | "Campaign line";
}

export function TestimonialCarousel({ pages }: { pages: TestimonialStory[] }) {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const sources = useRef<HTMLDivElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  // The drum duplicates the visible cards into 24 strips apiece. Building it
  // during hydration costs a long main-thread task even though this section is
  // many screens below the hero. Keep the ordinary first card as a usable
  // fallback, then prepare the drum before the visitor reaches it.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "1400px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!nearViewport) return;
    const root = stage.current, source = sources.current, host = visual.current;
    if (!root || !source || !host || !pages.length) return;
    const cards = Array.from(source.children) as HTMLElement[];
    const model = { position: 0 };
    const wrap = gsap.utils.wrap(0, pages.length);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, current = 0, destination = 0;
    let drum: ReturnType<typeof createTestimonialDrum> | undefined;
    let tween: gsap.core.Tween | undefined;
    let drag: { x: number; y: number; lastX: number; time: number; velocity: number; origin: number; id: number; locked: boolean } | null = null;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    const paint = () => { if (!reduced.matches) drum?.render(model.position); };
    const finish = (target: number) => {
      model.position = wrap(target); current = model.position; destination = current;
      setActive(current); paint(); root.dataset.moving = "false";
    };
    const settle = (target: number) => {
      tween?.kill(); clearTimeout(wheelTimer);
      destination = Math.round(target);
      if (reduced.matches) { finish(destination); return; }
      root.dataset.moving = "true";
      tween = gsap.to(model, { position: destination, duration: .8, ease: "power3.out", onUpdate: paint, onComplete: () => finish(destination) });
    };
    const measure = () => {
      const nextWidth = cards[0].offsetWidth;
      const nextHeight = cards[0].offsetHeight;
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth; height = nextHeight;
      tween?.kill(); drag = null; clearTimeout(wheelTimer);
      drum?.destroy(); drum = createTestimonialDrum(cards, host, width, height);
      finish(Math.round(model.position));
    };
    const motionChange = () => {
      tween?.kill(); drag = null;
      root.dataset.motion = reduced.matches ? "reduced" : "full";
      finish(destination);
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      tween?.kill(); clearTimeout(wheelTimer);
      drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, time: event.timeStamp, velocity: 0, origin: model.position, id: event.pointerId, locked: false };
      root.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.locked) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; settle(current); return; }
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        drag.locked = true; root.dataset.moving = "true";
      }
      drag.velocity = (event.clientX - drag.lastX) / Math.max(1, event.timeStamp - drag.time);
      drag.lastX = event.clientX; drag.time = event.timeStamp;
      model.position = drag.origin - dx / (width * .85);
      paint();
    };
    const up = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const g = drag; drag = null;
      const velocity = event.timeStamp - g.time < 100 ? g.velocity : 0;
      const projected = model.position - gsap.utils.clamp(-.7, .7, velocity * 180 / (width * .85));
      settle(g.locked ? Math.round(projected) : current);
    };
    const cancel = () => { if (drag) { drag = null; settle(current); } };
    const key = (event: KeyboardEvent) => {
      if (event.target !== root) return;
      const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (direction) { event.preventDefault(); settle(destination + direction); }
      if (event.key === "Home" || event.key === "End") { event.preventDefault(); settle(event.key === "Home" ? 0 : pages.length - 1); }
    };
    const wheel = (event: WheelEvent) => {
      // Leave ordinary vertical scrolling to the page/Lenis.
      if (drag || event.ctrlKey || (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY))) return;
      event.preventDefault(); tween?.kill(); clearTimeout(wheelTimer);
      const delta = (event.shiftKey ? event.deltaY || event.deltaX : event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1);
      model.position += delta / (width * .85);
      root.dataset.moving = "true"; paint();
      wheelTimer = setTimeout(() => settle(Math.round(model.position)), 140);
    };
    root.dataset.motion = reduced.matches ? "reduced" : "full";
    measure(); root.dataset.ready = "true";
    const observer = new ResizeObserver(measure); observer.observe(cards[0]);
    root.addEventListener("pointerdown", down); root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up); root.addEventListener("pointercancel", cancel);
    root.addEventListener("lostpointercapture", cancel); root.addEventListener("keydown", key);
    root.addEventListener("wheel", wheel, { passive: false }); reduced.addEventListener("change", motionChange);
    return () => {
      tween?.kill(); clearTimeout(wheelTimer); observer.disconnect(); drum?.destroy();
      root.removeEventListener("pointerdown", down); root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up); root.removeEventListener("pointercancel", cancel);
      root.removeEventListener("lostpointercapture", cancel); root.removeEventListener("keydown", key);
      root.removeEventListener("wheel", wheel); reduced.removeEventListener("change", motionChange);
      delete root.dataset.ready; delete root.dataset.motion;
    };
  }, [pages.length, nearViewport]);

  if (!pages.length) return null;
  const renderPage = (index: number) => {
    const page = pages[index];
    return <article className="tc-page" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${pages.length}: ${page.name}`} aria-hidden={index !== active || undefined} data-active={index === active} key={page.slug} data-brand={page.slug}>
      <div className="tc-hero" style={{ "--tc-brand": page.surface } as CSSProperties}>
        <PhotoSlot src={page.image} placeholder={page.imageAlt} fixedRatio="1/1" radius={0}
          logo={page.logo} logoTint={page.logoTint} logoInvert={page.logoInvert} logoSurface={page.surface} />
        <span className="tc-image-caption">{page.name}<span>{page.category}</span></span>
      </div>
      <div className="tc-copy">
        <div className="tc-page-top"><span>{page.kind}</span></div>
        <span className="tc-quote-mark" aria-hidden="true">“</span>
        <blockquote>{page.quote}</blockquote>
        <p className="tc-by">{page.by}</p>
        <span className="tc-page-brand">{page.name}</span>
      </div>
    </article>;
  };
  return <section id="testimonials" className="section testimonial-carousel" data-screen-label="Home - Testimonials" aria-labelledby="tc-title">
    <div className="wrap">
      <div className="tc-heading"><div><h2 id="tc-title">Every brand.<br /><em>A different story.</em></h2></div></div>
    </div>
    <div ref={stage} className="tc-stage" role="region" aria-roledescription="carousel" aria-label="Brand stories. Swipe or drag left and right. Use arrow keys, Home or End." tabIndex={0} data-moving="false" onDragStart={event => event.preventDefault()}>
      <div ref={sources} className="tc-sources">{(nearViewport ? pages : pages.slice(0, 1)).map((_, index) => renderPage(index))}</div>
      <div ref={visual} className="tc-visual" aria-hidden="true" />
    </div>
    <span className="tc-sr-only" aria-live="polite" aria-atomic="true">{pages[active].name} — story {active + 1} of {pages.length}</span>
  </section>;
}
