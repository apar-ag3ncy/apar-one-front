"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "@/lib/scroll-state";
import { Hero } from "../hero";
import { HERO_REVEAL_PROGRESS, JOURNEY_SECONDS } from "./journey";

let playedThisVisit = false;
type Runtime = { render: (progress: number) => void; dispose: () => void };

function HyperspaceIntro({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const skipAction = useRef(() => {});
  const resumeAction = useRef(() => {});

  useLayoutEffect(() => {
    const root = rootRef.current, track = trackRef.current, host = canvasRef.current;
    if (!root || !track || !host) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    if (playedThisVisit || reduce.matches || location.hash || window.scrollY > 80) {
      onReveal(); onDone(); return;
    }
    gsap.registerPlugin(ScrollTrigger);
    let disposed = false, finished = false, revealed = false, keyboardUsed = false;
    let runtime: Runtime | null = null;
    let lenis: Lenis | null = null;
    let auto: gsap.core.Tween | null = null;
    let trigger: ScrollTrigger | null = null;
    let progressTween: gsap.core.Tween | null = null;
    let skipTween: gsap.core.Tween | null = null;
    const state = { progress: 0 };
    const drive = { scroll: 0 };
    const bar = root.querySelector<HTMLElement>(".hyperspace-progress-fill")!;
    const percent = root.querySelector<HTMLElement>(".hyperspace-percent")!;
    const progress = root.querySelector<HTMLElement>("[role=progressbar]")!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const pageLenis = getLenis();
    pageLenis?.stop();
    // SmoothScroll registers its instance in a passive effect, after this
    // layout effect on first load. Re-acquire it once those effects finish.
    const pageLock = window.setTimeout(() => getLenis()?.stop(), 0);
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.hyperspace = "active";
    root.dataset.state = "preparing";
    // Isolate only the background, preserving the intro's keyboard controls.
    const inert: Array<[HTMLElement, boolean]> = [];
    let branch: HTMLElement = root;
    while (branch.parentElement && branch.parentElement !== document.documentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling instanceof HTMLElement && sibling !== branch && !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) {
          inert.push([sibling, sibling.inert]); sibling.inert = true;
        }
      }
      branch = branch.parentElement;
    }
    const release = () => {
      clearTimeout(pageLock);
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.hyperspace;
      inert.forEach(([element, value]) => { element.inert = value; });
      getLenis()?.start();
    };
    const reveal = () => { if (!revealed) { revealed = true; onReveal(); } };
    const finish = () => {
      if (finished || disposed) return;
      finished = true; playedThisVisit = true;
      clearTimeout(bootTimeout);
      reveal(); auto?.kill(); trigger?.kill(); progressTween?.kill();
      release();
      // Native document scroll has never moved: removing this overlay causes no jump.
      const hadFocus = root.contains(document.activeElement);
      onDone();
      if (hadFocus && keyboardUsed) {
        const target = document.querySelector<HTMLElement>(".hero-actions a");
        (target ?? previousFocus)?.focus({ preventScroll: true });
      }
    };
    const render = () => {
      if (disposed || finished) return;
      runtime?.render(state.progress);
      bar.style.transform = `scaleX(${state.progress})`;
      const value = Math.round(state.progress * 100);
      percent.textContent = `${String(value).padStart(2, "0")} / 100`;
      progress.setAttribute("aria-valuenow", String(value));
      root.style.setProperty("--intro-ui", String(1 - gsap.utils.clamp(0, 1, (state.progress - .83) / .15)));
      if (state.progress >= HERO_REVEAL_PROGRESS) reveal();
      if (state.progress >= .9995) finish();
    };
    const takeControl = () => {
      if (finished || root.dataset.state !== "ready") return;
      auto?.kill(); auto = null;
      root.dataset.mode = "manual";
    };
    const distance = () => Math.max(1, track.scrollHeight - root.clientHeight);
    const play = () => {
      if (!lenis || finished) return;
      auto?.kill(); root.dataset.mode = "auto";
      drive.scroll = root.scrollTop;
      auto = gsap.to(drive, {
        scroll: distance(), duration: Math.max(.35, JOURNEY_SECONDS * (1 - state.progress)), ease: "none",
        onUpdate: () => lenis?.scrollTo(drive.scroll, { immediate: true }),
      });
    };
    const skip = () => {
      if (finished) return;
      auto?.kill(); trigger?.kill(); progressTween?.kill();
      reveal();
      if (!runtime || reduce.matches) { finish(); return; }
      root.dataset.mode = "exit";
      // A short dissolve also works when skipping before the tunnel has formed.
      skipTween = gsap.to(root, { opacity: 0, duration: .45, ease: "power2.out", onComplete: finish });
    };
    skipAction.current = skip;
    resumeAction.current = play;
    const key = (event: KeyboardEvent) => {
      keyboardUsed = true;
      if (event.key === "Escape") { event.preventDefault(); skip(); }
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(event.key) && event.target === root) takeControl();
      if (event.key === "Tab") {
        const controls = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).filter(el => el.offsetParent !== null);
        const index = controls.indexOf(document.activeElement as HTMLButtonElement);
        event.preventDefault(); controls[(index + (event.shiftKey ? controls.length - 1 : 1)) % controls.length]?.focus();
      }
    };
    root.addEventListener("wheel", takeControl, { passive: true });
    root.addEventListener("touchstart", takeControl, { passive: true });
    root.addEventListener("keydown", key);
    const motionChange = () => { if (reduce.matches) finish(); };
    reduce.addEventListener("change", motionChange);
    // A hidden tab never retains a modal loader on return.
    const visibility = () => { if (document.hidden) finish(); };
    document.addEventListener("visibilitychange", visibility);
    root.focus({ preventScroll: true });
    const bootTimeout = window.setTimeout(finish, 2500);
    const tick = (time: number) => lenis?.raf(time * 1000);
    const resize = () => {
      if (finished || !lenis) return;
      const position = state.progress;
      lenis.resize();
      trigger?.refresh();
      lenis.scrollTo(position * distance(), { immediate: true });
      if (root.dataset.mode === "auto") play();
      render();
    };
    window.addEventListener("resize", resize);
    void import("./scene").then(({ createHyperspace }) => {
      if (disposed || finished) return;
      runtime = createHyperspace(host, finish);
      if (disposed || finished) { runtime.dispose(); return; }
      clearTimeout(bootTimeout);
      root.dataset.state = "ready";
      lenis = new Lenis({ wrapper: root, content: track, duration: .65, smoothWheel: true, touchMultiplier: 1, overscroll: false });
      lenis.on("scroll", () => ScrollTrigger.update());
      gsap.ticker.add(tick);
      progressTween = gsap.to(state, {
        progress: 1, ease: "none", paused: true, onUpdate: render,
      });
      trigger = ScrollTrigger.create({
        scroller: root, trigger: track, start: 0, end: distance,
        animation: progressTween, scrub: .14, invalidateOnRefresh: true,
      });
      play();
    }).catch(finish);
    return () => {
      disposed = true;
      clearTimeout(bootTimeout);
      auto?.kill(); skipTween?.kill(); trigger?.kill(); progressTween?.kill();
      gsap.ticker.remove(tick); lenis?.destroy(); runtime?.dispose();
      root.removeEventListener("wheel", takeControl); root.removeEventListener("touchstart", takeControl); root.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", visibility);
      reduce.removeEventListener("change", motionChange);
      release(); skipAction.current = () => {}; resumeAction.current = () => {};
    };
  }, [onReveal, onDone]);

  return <div ref={rootRef} className="hyperspace-intro" tabIndex={-1} role="dialog" aria-modal="true" aria-label="APĀR hyperspace introduction" data-lenis-prevent>
    <div ref={trackRef} className="hyperspace-track">
      <div className="hyperspace-stage">
        <div className="hyperspace-fallback" aria-hidden="true" />
        <div ref={canvasRef} className="hyperspace-canvas" aria-hidden="true" />
        <div className="hyperspace-top"><Image className="hyperspace-brand" src="/assets/apar-logo-white.svg" alt="APĀR" width={72} height={40} unoptimized priority /><button ref={skipRef} onClick={() => skipAction.current()}>Enter site <span aria-hidden="true">↗</span></button></div>
        <div className="hyperspace-bottom">
          <div><span className="hyperspace-caption">Beyond the ordinary.</span><p>Scroll to travel <span aria-hidden="true">↓</span><button className="hyperspace-resume" onClick={() => resumeAction.current()}>Continue automatically</button></p></div>
          <div className="hyperspace-progress" role="progressbar" aria-label="Introduction progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}><span className="hyperspace-percent">00 / 100</span><i><span className="hyperspace-progress-fill" /></i></div>
        </div>
      </div>
    </div>
  </div>;
}

export function HomeArrival() {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const reveal = useCallback(() => setReady(true), []);
  const finish = useCallback(() => setDone(true), []);
  return <div className="home-arrival" data-intro-state={done ? "complete" : "playing"}>
    <noscript><style>{`.hyperspace-intro{display:none!important}.home-arrival .hb-wordmark,.home-arrival .gwi,.home-arrival .hero-actions,.home-arrival .scroll-cue{opacity:1!important;transform:none!important}`}</style></noscript>
    <Hero start={ready} />
    {!done && <HyperspaceIntro onReveal={reveal} onDone={finish} />}
  </div>;
}
