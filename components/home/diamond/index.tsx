"use client";

import { DESKTOP_MOTION_QUERY, useMobileLayout } from "@/lib/motion-policy";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DiamondFallback } from "@/components/home/diamond/diamond-fallback";
import { HoverText } from "@/components/motion/hover-text";

type Scene = { render: () => void; dispose: () => void };

/** The MJ client experience, presented as an optional hands-on portfolio piece. */
export function MJShowcase() {
  const mobile = useMobileLayout();
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const motion = useRef({ burst: 1, progress: 0, baseYaw: -.12, yaw: 0, pitch: 0, hoverYaw: 0, hoverPitch: 0 });
  const phaseRef = useRef(0);
  const [phase, setPhase] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"preview" | "loading" | "ready" | "fallback">("preview");
  const [requested, setRequested] = useState(false);
  const paint = () => {
    stage.current?.style.setProperty("--diamond-burst", String(motion.current.burst));
    if (track.current) track.current.dataset.burst = motion.current.burst.toFixed(3);
    const next = motion.current.progress < .37 ? 0 : motion.current.progress > .7 ? 2 : 1;
    if (phaseRef.current !== next) { phaseRef.current = next; setPhase(next); }
    scene.current?.render();
  };

  // Reuse the copied Manish scene unchanged; only its progress driver belongs
  // to APAR. Lazy-load near the section and scrub burst with page scrolling.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (mobile) {
      Object.assign(motion.current, { burst: 0, progress: .5, baseYaw: -.12 });
      setExpanded(false);
      paint();
      const state = motion.current;
      return () => { gsap.killTweensOf(state); };
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatus("loading"); setRequested(true); io.disconnect(); }
    // Phones use the interactive SVG; desktop loads the 3D scene near the section.
    }, { rootMargin: "400px" });
    io.observe(el);
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
      let refreshFrame = 0;
      Object.assign(motion.current, { burst: 1, progress: 0, baseYaw: -.12 });
      // Keep the client's three chapters, timing and camera choreography.
      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" }, onUpdate: paint,
        scrollTrigger: {
          trigger: el, start: "top 100px", end: "bottom bottom", scrub: 1.1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(paint);
          },
        },
      });
      timeline.addLabel("scatter", 0)
        .to(motion.current, { progress: 1, duration: 3.1, ease: "none" }, 0)
        .to(motion.current, { burst: 0, duration: 1.25 }, .08)
        .to(motion.current, { baseYaw: .08, duration: 1.95, ease: "none" }, 0)
        .addLabel("gather", 1.6)
        .addLabel("radiate", 2.1)
        .to(motion.current, { burst: 1, baseYaw: .2, duration: 1 }, "radiate");
      return () => cancelAnimationFrame(refreshFrame);
    });
    media.add("(prefers-reduced-motion: reduce)", () => {
      Object.assign(motion.current, { burst: 0, progress: .5, baseYaw: -.12 });
      paint();
    });
    return () => { io.disconnect(); media.revert(); };
  }, [mobile]);

  useEffect(() => {
    if (!requested || mobile || !host.current) return;
    const el = host.current;
    let disposed = false;
    let runtime: Scene | null = null;
    // A finite wait always returns to the usable SVG preview, including offline use.
    const timeout = window.setTimeout(() => {
      disposed = true;
      runtime?.dispose();
      scene.current = null;
      setStatus("fallback");
    }, 15000);
    import("@/components/home/diamond/create-scene").then(({ createDiamondScene }) => {
      if (disposed) return;
      runtime = createDiamondScene(el, motion.current,
        () => { window.clearTimeout(timeout); if (!disposed) setStatus("ready"); },
        () => { window.clearTimeout(timeout); if (!disposed) setStatus("fallback"); },
        () => { window.clearTimeout(timeout); });
      scene.current = runtime;
    }).catch(() => { window.clearTimeout(timeout); if (!disposed) setStatus("fallback"); });
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      runtime?.dispose();
      scene.current = null;
    };
  }, [requested, mobile]);

  useEffect(() => {
    const el = stage.current;
    if (!el || mobile) return;
    const state = motion.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const turn = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced.matches || !scene.current) return;
      const rect = el.getBoundingClientRect();
      gsap.to(state, { hoverYaw: ((event.clientX - rect.left) / rect.width - .5) * .32,
        hoverPitch: ((event.clientY - rect.top) / rect.height - .5) * .1,
        duration: .65, ease: "power2.out", overwrite: "auto", onUpdate: paint });
    };
    const leave = () => { gsap.to(state, { hoverYaw: 0, hoverPitch: 0, duration: .7, overwrite: "auto", onUpdate: paint }); };
    el.addEventListener("pointermove", turn);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", turn); el.removeEventListener("pointerleave", leave); gsap.killTweensOf(state); };
  }, [mobile]);

  const toggle = () => {
    if (!mobile && !requested) { setStatus("loading"); setRequested(true); }
    const next = !expanded;
    setExpanded(next);
    gsap.to(motion.current, { burst: next ? 1 : 0, progress: next ? 1 : .5,
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.8,
      ease: "power3.inOut", overwrite: "auto", onUpdate: paint });
  };

  return (
    <section className="mj-showcase" aria-labelledby="mj-showcase-title" data-screen-label="Home - Manish Jewellers experience">
      <div className="wrap">
        <div className="mj-showcase-heading">
          <div>
            <h2 id="mj-showcase-title">From a product.<br />To an <em>experience.</em></h2></div>
        </div>
        <div ref={track} className="mj-scroll-track" id="diamond-experience" data-renderer={!mobile && status === "ready" ? "webgl" : "fallback"} data-phase={["scatter", "gather", "radiate"][phase]}><div ref={stage} className="mj-showcase-stage" data-ready={!mobile && status === "ready"}>
          <div className="mj-showcase-label">
            <span className="mj-brand-lockup">
              {/* Preserve the supplied wordmark artwork, including its original type. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brands/manish-jewellers/wordmark.png" alt="Manish Jewellers" width="961" height="503" loading="lazy" decoding="async" />
            </span>
          </div>
          <DiamondFallback loadTexture={requested && !mobile} />
          <div ref={host} className="mj-showcase-canvas" aria-hidden="true" />
          <div className="mj-showcase-controls">
            <span className="tc-sr-only" role="status">{status === "loading" ? "Loading interactive scene" : status === "fallback" ? "Interactive preview available" : ""}</span>
            <a href="#clients" className="mj-skip"><HoverText>Continue to clients</HoverText> <span aria-hidden="true">↓</span></a>
            <button type="button" className="btn cream mj-manual" onClick={toggle} aria-pressed={expanded} aria-label={expanded ? "Gather the diamond" : "Burst the diamond"}>
              <HoverText>{expanded ? "Gather the diamond" : "Burst the diamond"}</HoverText><span aria-hidden="true">{expanded ? "↙" : "↗"}</span>
            </button>
          </div>
        </div>
        </div>
        <div className="mj-showcase-caption"><Link href="/start">Build something with us ↗</Link></div>
      </div>
    </section>
  );
}
