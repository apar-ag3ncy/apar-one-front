"use client";

import { useMobileLayout } from "@/lib/motion-policy";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const SculptureCanvas = dynamic(() => import("@/components/manifesto/manifesto-sculpture-canvas"), { ssr: false });

export function ManifestoSculpture() {
  const mobile = useMobileLayout();
  const [activated, setActivated] = useState(false);
  const section = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const markReady = useCallback(() => setModelReady(true), []);
  const interactive = inView && webgl === true && (!mobile || activated);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) setModelReady(false);
    }, {
      rootMargin: "240px 0px",
    });
    observer.observe(node);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => { observer.disconnect(); media.removeEventListener("change", syncMotion); };
  }, []);

  useEffect(() => {
    if (!inView || (mobile && !activated) || webgl !== null) return;
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWebgl(Boolean(context));
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setWebgl(false);
    }
  }, [inView, webgl, mobile, activated]);

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    last.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return <section className="manifesto-sculpture" ref={section} aria-labelledby="manifesto-sculpture-title">
    <div className="manifesto-sculpture-inner wrap">
      <div className="manifesto-sculpture-copy">
        <span className="manifesto-kicker">A thought made tangible</span>
        <h2 id="manifesto-sculpture-title">Ideas don’t<br />stand <em>still.</em></h2>
        <p>Turn it. See what changes.</p>
      </div>
      <div
        className="manifesto-sculpture-viewport"
        role="group"
        aria-label={interactive ? "Interactive APĀR sculpture. Drag horizontally to turn it, or use the left and right arrow keys." : "APĀR sculptural ribbon"}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={(event) => {
          if (!interactive || event.target instanceof HTMLButtonElement) return;
          last.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!last.current) return;
          yaw.current += (event.clientX - last.current.x) * 0.008;
          pitch.current = Math.max(-0.4, Math.min(0.4, pitch.current + (event.clientY - last.current.y) * 0.004));
          last.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (!interactive) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            yaw.current += event.key === "ArrowLeft" ? -0.35 : 0.35;
          }
        }}
      >
        <div className="manifesto-sculpture-halo" aria-hidden="true" />
        <Image
          className="manifesto-sculpture-still"
          src="/models/apar-manifesto-sculpture.png"
          width={840}
          height={840}
          alt=""
          loading="lazy"
          unoptimized
          style={{ opacity: interactive && modelReady ? 0 : 1 }}
        />
        {interactive && <SculptureCanvas yaw={yaw} pitch={pitch} reducedMotion={reducedMotion} onReady={markReady} />}
        {mobile && !activated && <button type="button" className="manifesto-sculpture-activate" onClick={() => setActivated(true)}>Explore in 3D ↗</button>}
        {webgl && (!mobile || activated) && <span className="manifesto-sculpture-cue" aria-hidden="true">← Drag to turn →</span>}
      </div>
    </div>
  </section>;
}
