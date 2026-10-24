"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { gsap } from "gsap";
import type { CaseMotionProfile } from "@/lib/case-motion";

export interface BrandSignatureHandle { setProgress: (progress: number) => void }
type Scene = { render: (progress: number, yaw?: number, pitch?: number) => void; dispose: () => void };

export const BrandSignature = forwardRef<BrandSignatureHandle, { profile: CaseMotionProfile; accent: string }>(function BrandSignature({ profile, accent }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const state = useRef({ progress: 0, yaw: 0, pitch: 0 });
  const paint = () => scene.current?.render(state.current.progress, state.current.yaw, state.current.pitch);
  useImperativeHandle(ref, () => ({ setProgress: value => { state.current.progress = value; paint(); } }), []);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add(DESKTOP_MOTION_QUERY, () => {
    const motionState = state.current;
    let alive = true;
    let initialized = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || initialized) return;
      initialized = true;
      import("./create-brand-scene").then(({ createBrandScene }) => {
        if (!alive) return;
        try { scene.current = createBrandScene(el, profile, accent); paint(); }
        catch { el.dataset.renderer = "fallback"; }
      }).catch(() => { if (alive) el.dataset.renderer = "fallback"; });
    }, { rootMargin: "150px" });
    observer.observe(el);
    const yaw = gsap.quickTo(state.current, "yaw", { duration: .75, ease: "power3.out", onUpdate: paint });
    const pitch = gsap.quickTo(state.current, "pitch", { duration: .75, ease: "power3.out", onUpdate: paint });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      yaw((event.clientX - rect.left - rect.width / 2) / rect.width * .4);
      pitch((event.clientY - rect.top - rect.height / 2) / rect.height * .25);
    };
    const leave = () => { yaw(0); pitch(0); };
    el.addEventListener("pointermove", move, { passive: true }); el.addEventListener("pointerleave", leave);
    return () => {
      alive = false; observer.disconnect(); scene.current?.dispose(); scene.current = null;
      el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(motionState);
      el.dataset.renderer = "fallback";
    };
    });
    return () => media.revert();
  }, [profile, accent]);
  return <div ref={root} className="brand-signature" data-form={profile.form} data-renderer="fallback" aria-hidden="true">
    <span className="brand-signature-static"><i /><i /><i /></span>
  </div>;
});
