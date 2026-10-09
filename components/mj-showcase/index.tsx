"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { DiamondFallback } from "./diamond-fallback";

type Scene = { render: () => void; dispose: () => void };

/** The MJ client experience, presented as an optional hands-on portfolio piece. */
export function MJShowcase() {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const motion = useRef({ burst: 0, baseYaw: -.12, yaw: 0, pitch: 0, hoverYaw: 0, hoverPitch: 0 });
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"preview" | "loading" | "ready" | "fallback">("preview");
  const [requested, setRequested] = useState(false);
  const paint = () => {
    stage.current?.style.setProperty("--diamond-burst", String(motion.current.burst));
    scene.current?.render();
  };

  useEffect(() => {
    if (!requested || !host.current) return;
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
    import("./create-scene").then(({ createDiamondScene }) => {
      if (disposed) return;
      runtime = createDiamondScene(el, motion.current,
        () => { window.clearTimeout(timeout); if (!disposed) setStatus("ready"); },
        () => { window.clearTimeout(timeout); if (!disposed) setStatus("fallback"); });
      scene.current = runtime;
    }).catch(() => { window.clearTimeout(timeout); if (!disposed) setStatus("fallback"); });
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      runtime?.dispose();
      scene.current = null;
    };
  }, [requested]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
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
  }, []);

  const toggle = () => {
    if (!requested) { setStatus("loading"); setRequested(true); }
    const next = !expanded;
    setExpanded(next);
    gsap.to(motion.current, { burst: next ? .86 : 0,
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1.8,
      ease: "power3.inOut", overwrite: "auto", onUpdate: paint });
  };

  return (
    <section className="mj-showcase" aria-labelledby="mj-showcase-title" data-screen-label="Home - Manish Jewellers experience">
      <div className="wrap">
        <div className="mj-showcase-heading">
          <div><div className="eyebrow"><i className="dot" /> Made by APĀR</div>
            <h2 id="mj-showcase-title">From a product.<br />To an <em>experience.</em></h2></div>
          <p>A closer look at what we build. Explore the diamond burst created for Manish Jewellers — light, detail and motion, brought together.</p>
        </div>
        <div ref={stage} className="mj-showcase-stage" data-ready={status === "ready"}>
          <div className="mj-showcase-label"><span>Manish Jewellers</span><span>Interactive brand experience / 01</span></div>
          <DiamondFallback />
          <div ref={host} className="mj-showcase-canvas" aria-hidden="true" />
          <div className="mj-showcase-controls">
            <span role="status">{status === "loading" ? "Preparing the interactive scene…" : status === "fallback" ? "Preview mode · the diamond is still yours to explore" : expanded ? "Every facet, a different perspective." : "One diamond. A world of possibilities."}</span>
            <button type="button" className="btn cream" onClick={toggle} aria-pressed={expanded} aria-label={expanded ? "Gather the diamond" : "Burst the diamond"}>
              <span>{expanded ? "Gather the diamond" : "Burst the diamond"}</span><span aria-hidden="true">{expanded ? "↙" : "↗"}</span>
            </button>
          </div>
        </div>
        <div className="mj-showcase-caption"><span>Creative direction · Web design · Interactive 3D</span><Link href="/start">Build something with us ↗</Link></div>
      </div>
    </section>
  );
}
