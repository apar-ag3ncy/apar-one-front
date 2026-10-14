"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PhotoSlot } from "../photo-slot";
import { VideoSlot } from "../video-slot";
import { BrandSignature, type BrandSignatureHandle } from "./brand-signature";
import type { CaseData } from "../case-study";
import type { CaseAssets } from "@/lib/case-assets";
import { caseMotion } from "@/lib/case-motion";
import { getLenis } from "@/lib/scroll-state";

export function CaseGalleryJourney({ data, assets }: { data: CaseData; assets: CaseAssets }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const signature = useRef<BrandSignatureHandle>(null);
  const scrollTween = useRef<gsap.core.Tween | null>(null);
  const [preload, setPreload] = useState(false);
  const profile = caseMotion(data.slug);
  const brand = { logo: data.logo ?? `/logos/${data.slug}.png`, logoTint: data.logoTint,
    logoInvert: data.logoInvert, logoSurface: `linear-gradient(145deg, ${data.theme.bg2}, ${data.theme.bg})` };
  useEffect(() => {
    const section = root.current, viewport = stage.current, nativeViewport = viewportRef.current, track = rail.current;
    if (!section || !viewport || !nativeViewport || !track) return;
    const panels = Array.from(track.querySelectorAll<HTMLElement>(".case-reel-panel"));
    let centres: number[] = [], viewportWidth = nativeViewport.clientWidth;
    const measure = () => {
      viewportWidth = nativeViewport.clientWidth;
      // Let the final artwork centre, too. A fixed gutter leaves a narrow last
      // panel at the far right and the counter stuck on the previous artwork.
      const last = panels[panels.length - 1];
      track.style.paddingRight = `${Math.max(0, viewportWidth / 2 - (last?.offsetWidth ?? 0) / 2)}px`;
      centres = panels.map(panel => panel.offsetLeft + panel.offsetWidth / 2);
    };
    measure();
    let active = -1;
    const update = (progress: number, offset: number) => {
      section.dataset.progress = progress.toFixed(3);
      if (meter.current) meter.current.style.transform = `scaleX(${progress})`;
      signature.current?.setProgress(progress);
      // Mixed portrait/landscape widths need distance-based indexing, not a
      // fraction of the number of panels. Choose the artwork nearest the centre.
      const centre = offset + viewportWidth / 2;
      const item = centres.reduce((nearest, position, i) =>
        Math.abs(position - centre) < Math.abs(centres[nearest] - centre) ? i : nearest, 0);
      if (active !== item && count.current) { active = item; count.current.textContent = String(item + 1).padStart(2, "0"); }
    };
    let nativeFrame = 0;
    const nativeProgress = () => {
      cancelAnimationFrame(nativeFrame);
      nativeFrame = requestAnimationFrame(() => {
        if (scrollTween.current) return;
        const distance = Math.max(0, nativeViewport.scrollWidth - nativeViewport.clientWidth);
        update(distance ? nativeViewport.scrollLeft / distance : 0, nativeViewport.scrollLeft);
      });
    };
    nativeViewport.addEventListener("scroll", nativeProgress, { passive: true });
    const resizeObserver = new ResizeObserver(() => { measure(); nativeProgress(); });
    resizeObserver.observe(nativeViewport);
    const preloadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setPreload(true); preloadObserver.disconnect(); }
    }, { rootMargin: "900px" });
    preloadObserver.observe(section);
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ desktop: "(min-width: 901px) and (min-height: 600px)", motion: "(prefers-reduced-motion: no-preference)" }, context => {
      if (!context.conditions?.desktop || !context.conditions?.motion) return;
      section.dataset.pinned = "true";
      const travel = () => { measure(); return Math.max(0, track.scrollWidth - nativeViewport.clientWidth); };
      nativeViewport.scrollLeft = 0;
      const bends = panels.map(panel => gsap.quickTo(panel.querySelector(".case-panel-visual"), "skewY", { duration: .65, ease: "power3.out" }));
      const tween = gsap.to(track, {
        x: () => -travel(), ease: "none",
        onUpdate: function(this: gsap.core.Tween) {
          const trigger = this.scrollTrigger;
          update(this.progress(), this.progress() * (trigger ? trigger.end - trigger.start : 0));
        },
        scrollTrigger: {
          trigger: viewport, pin: true, start: "top 80px", end: () => `+=${travel()}`,
          scrub: profile.gallery?.scrub ?? .85, invalidateOnRefresh: true, anticipatePin: 1,
          onRefresh: measure,
          onUpdate: trigger => {
            const bend = gsap.utils.clamp(-profile.bend, profile.bend, trigger.getVelocity() / -2200);
            bends.forEach(move => move(bend));
          },
          onScrubComplete: () => bends.forEach(move => move(0)),
        },
      });
      scrollTween.current = tween;
      panels.forEach((panel, i) => {
        const choreography = profile.gallery;
        if (choreography) {
          const direction = profile.direction * (i % 2 ? -1 : 1);
          // The panel stays on the measured rail; only its children move.
          // Every photograph reaches its original scale/angle at the centre,
          // and the same timeline runs backwards when the reader scrolls up.
          gsap.timeline({ defaults: { ease: "sine.inOut" }, scrollTrigger: {
            trigger: panel, containerAnimation: tween, start: "left right", end: "right left", scrub: true,
          } })
            .fromTo(panel.querySelector(".case-panel-visual"),
              { y: direction * choreography.lift, rotation: direction * choreography.tilt, scale: choreography.restingScale },
              { y: 0, rotation: 0, scale: 1, duration: 1 }, 0)
            .to(panel.querySelector(".case-panel-visual"),
              { y: -direction * choreography.lift * .6, rotation: -direction * choreography.tilt * .45, scale: choreography.restingScale, duration: 1 }, 1)
            .fromTo(panel.querySelector("figcaption"), { y: 10, opacity: .55 }, { y: 0, opacity: 1, duration: .65 }, .35)
            .to(panel.querySelector("figcaption"), { y: -5, opacity: .55, duration: .5 }, 1.5);
          return;
        }
        gsap.fromTo(panel.querySelector(".case-panel-visual"),
          { y: (i % 2 ? 20 : -20) * profile.direction, rotation: profile.direction * (i % 2 ? -.8 : .8) },
          { y: (i % 2 ? -20 : 20) * profile.direction, rotation: 0, ease: "none", scrollTrigger: {
            trigger: panel, containerAnimation: tween, start: "left right", end: "right left", scrub: true,
          } });
      });
      return () => { delete section.dataset.pinned; scrollTween.current = null; nativeProgress(); };
    }, section);
    let refresh = 0;
    const loaded = () => { cancelAnimationFrame(refresh); refresh = requestAnimationFrame(() => ScrollTrigger.refresh()); };
    const imgs = Array.from(track.querySelectorAll("img"));
    imgs.forEach(img => img.addEventListener("load", loaded));
    return () => {
      cancelAnimationFrame(refresh); imgs.forEach(img => img.removeEventListener("load", loaded));
      preloadObserver.disconnect(); media.revert();
      cancelAnimationFrame(nativeFrame); resizeObserver.disconnect();
      nativeViewport.removeEventListener("scroll", nativeProgress);
      track.style.paddingRight = "";
    };
  }, [data.slug, profile]);

  const step = (direction: number) => {
    const tween = scrollTween.current;
    const trigger = tween?.scrollTrigger;
    if (trigger && tween && rail.current && viewportRef.current) {
      const track = rail.current, viewport = viewportRef.current;
      const travel = trigger.end - trigger.start;
      const stops = [0, ...Array.from(track.querySelectorAll<HTMLElement>(".case-reel-panel"), panel =>
        gsap.utils.clamp(0, 1, (panel.offsetLeft + panel.offsetWidth / 2 - viewport.clientWidth / 2) / travel)), 1];
      const current = tween.progress();
      const progress = direction > 0 ? stops.find(stop => stop > current + .015) ?? 1
        : [...stops].reverse().find(stop => stop < current - .015) ?? 0;
      const top = trigger.start + progress * (trigger.end - trigger.start);
      const lenis = getLenis();
      if (lenis?.isStopped) return;
      if (lenis?.scrollTo) { lenis.stop(); lenis.start(); lenis.scrollTo(top, { duration: 1.1 }); }
      else window.scrollTo({ top, behavior: "smooth" });
    } else if (viewportRef.current) {
      viewportRef.current.scrollBy({ left: direction * viewportRef.current.clientWidth * .85, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  };

  return <section ref={root} className="case-work-journey" aria-label={`${data.card.name} — the work`}>
    <div className="case-reel-heading case-wrap"><span>02 / The work</span><span>Identity, made tangible.</span></div>
    <div ref={stage} className="case-reel-stage">
      <div ref={viewportRef} className="case-reel-viewport">
      <div ref={rail} className="case-reel-track">
        <div className="case-reel-intro">
          <span className="case-reel-kicker">{data.card.name} / In motion</span>
          <h2>{data.approach.lead}</h2>
          <BrandSignature ref={signature} profile={profile} accent={data.theme.accent} />
          <span className="case-reel-note">A study in form, light and brand character.</span>
        </div>
        {data.approach.gallery.map((item, i) => {
          const hint = item.ratio.split("/").map(Number);
          const ratio = assets.photoRatios[i] ?? hint[0] / hint[1];
          return <figure key={i} className={`case-reel-panel${!assets.photoSrcs[i] && !item.video ? " is-identity" : ""}`} style={{ "--panel-ratio": ratio, "--identity-accent": data.theme.accent } as CSSProperties}>
            <div className="case-panel-visual">
              {item.video ? <VideoSlot src={item.video} placeholder={item.placeholder} radius={15} style={{ height: "100%", aspectRatio: item.ratio }} />
                : <PhotoSlot src={assets.photoSrcs[i]} placeholder={item.placeholder} radius={15} fixedRatio={String(ratio)} priority={preload} {...brand} />}
              {!assets.photoSrcs[i] && !item.video && <span className="case-identity-pattern" data-form={profile.form} aria-hidden="true"><i /><i /><i /></span>}
            </div>
            <figcaption><span>{String(i + 1).padStart(2, "0")} / {item.placeholder}</span><span>{data.card.name}</span></figcaption>
          </figure>;
        })}
      </div>
      </div>
    <div className="case-reel-toolbar case-wrap">
      <span className="case-reel-instruction"><span className="desktop-cue">Scroll to explore</span><span className="touch-cue">Swipe to explore</span><i aria-hidden="true">↔</i></span>
      <div className="case-reel-progress"><span ref={count}>01</span><span className="case-reel-meter"><i ref={meter} /></span><span>{String(data.approach.gallery.length).padStart(2, "0")}</span></div>
      <div className="case-reel-controls"><button type="button" onClick={() => step(-1)} aria-label="Previous artwork">←</button><button type="button" onClick={() => step(1)} aria-label="Next artwork">→</button></div>
    </div>
    </div>
    <div className="case-reel-skip case-wrap"><a href="#case-results">Skip to the results ↗</a></div>
  </section>;
}
