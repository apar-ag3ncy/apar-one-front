"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BandBackdrop } from "./band-backdrop";
import { AparLogo } from "./apar-logo";
import { Magnetic } from "./magnetic";
import { HoverText } from "./hover-text";

const LINE_1 = "Brands worth".split(" ");
const LINE_2 = "remembering.".split(" ");

/**
 * Home hero - the brand's Algolia-style beam promoted to the landing screen:
 * the red pixel-dome arc sweeps behind the giant APAR wordmark (tinted to the
 * beam's pale-rose crest so it sits IN the light, not against it) and the
 * brand statement. Entrance choreography plays on mount (`start`);
 * the copy parallax-fades on scroll-out, Lusion-style.
 */
export function Hero({ start }: { start: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Lusion-style: the scroll cue dissolves as soon as the user starts scrolling
  // (plain scroll listener + CSS transition - kept out of framer's opacity
  // arbitration, which suppresses derived MotionValues here).
  const cueRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cueRef.current;
    if (!el) return;
    if (window.scrollY > 60) {
      el.classList.add("gone");
      return;
    }
    const onScroll = () => {
      if (window.scrollY > 60) {
        el.classList.add("gone");
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The wordmark's drop-shadow (a 64px blur filter on a ~400x275px layer) is
  // re-rendered by the compositor on every frame its transform animates - it
  // alone cost the entrance ~half its frame rate on integrated GPUs. It is
  // applied once the choreography has settled (data-settled), so the entrance
  // animates a plain layer and the rest state looks exactly as before.
  const [settled, setSettled] = useState(false);
  const isSettled = settled || !!reduce || !start;
  // CSS starts the entrance with the server-rendered HTML, before hydration.
  // The cue's animationend normally settles it; this timer also covers a slow
  // hydrate that attaches the event handler after the CSS animation has ended.
  useEffect(() => {
    if (!start || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setSettled(true), 2400);
    return () => window.clearTimeout(timer);
  }, [start]);
  // Tell decorative loops (the "Talk to us" orb on low-power devices) that the
  // page's own load-in motion is running, so they hold until it has settled.
  useEffect(() => {
    const root = document.documentElement;
    if (isSettled) {
      delete root.dataset.heroEntrance;
      return;
    }
    root.dataset.heroEntrance = "1";
    return () => {
      delete root.dataset.heroEntrance;
    };
  }, [isSettled]);

  // word index across both lines for a continuous stagger
  let wi = -1;
  const word = (txt: string) => {
    wi += 1;
    const idx = wi;
    return (
      <span key={`${txt}-${idx}`}>
        <span className="gw">
          <span className="gwi">
            {txt}
          </span>
        </span>{" "}
      </span>
    );
  };

  return (
    <section ref={ref} className="hero-beam" data-screen-label="Home - Hero" data-enter={start ? "1" : undefined} data-settled={isSettled ? "1" : undefined}>
      {/* domeY is scaled by 0.2 in the shader: -0.5 moves the beam down 10% of the hero. */}
      <BandBackdrop domeY={-0.74} intensity={0.98} mobileFullBleed />
      <div className="wrap">
        <motion.div
          className="hero-beam-in"
          style={{ y: copyY, opacity: copyOpacity, willChange: "transform, opacity" }}
        >
          <div className="hb-wordmark">
            <AparLogo />
          </div>

          <h1 className="display hero-h1">
            {LINE_1.map(word)}
            <br />
            <span className="hl">{LINE_2.map(word)}</span>
          </h1>

          <div className="hero-actions">
            <Magnetic strength={0.3}>
              <Link className="btn cream" href="/work" prefetch={false}>
                <HoverText>See the work</HoverText>
                <span className="arr" aria-hidden="true">↗</span>
              </Link>
            </Magnetic>
            <Link className="btn-ghost light" href="/what-we-do" prefetch={false}>
              <HoverText>What we do</HoverText>
            </Link>
          </div>
        </motion.div>
      </div>

      <div ref={cueRef} className="scroll-hint">
        <div
          className="scroll-cue"
          onAnimationEnd={event => { if (event.target === event.currentTarget) setSettled(true); }}
        >
          <span className="cue-mouse" aria-hidden />
          <span>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
