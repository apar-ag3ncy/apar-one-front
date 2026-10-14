"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BandBackdrop } from "./band-backdrop";
import { AparLogo } from "./apar-logo";
import { Magnetic } from "./magnetic";
import { HoverText } from "./hover-text";

const EASE = [0.16, 1, 0.3, 1] as const;

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

  // Butter: begin the choreography only once the main thread is calm. On load
  // it used to start 250ms in - right on top of hydration, the web fonts and
  // three WebGL contexts compiling - so its first second ran at 12-20fps and
  // the mark popped in late. Wait for the fonts (capped) plus two frames.
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    let alive = true;
    let raf = 0;
    let timer = 0;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const cap = new Promise<void>((r) => { timer = window.setTimeout(r, 900); });
    Promise.race([fonts, cap]).then(() => {
      if (!alive) return;
      window.clearTimeout(timer);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => alive && setCalm(true));
      });
    });
    return () => {
      alive = false;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);
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

  const animate = reduce ? "show" : start && calm ? "show" : "hidden";
  const base = 0.08;
  // The wordmark's drop-shadow (a 64px blur filter on a ~400x275px layer) is
  // re-rendered by the compositor on every frame its transform animates - it
  // alone cost the entrance ~half its frame rate on integrated GPUs. It is
  // applied once the choreography has settled (data-settled), so the entrance
  // animates a plain layer and the rest state looks exactly as before.
  const [settled, setSettled] = useState(false);
  const isSettled = settled || !!reduce;
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
          <motion.span
            className="gwi"
            initial={{ y: "120%", opacity: 0 }}
            animate={animate}
            variants={{
              hidden: { y: "120%", opacity: 0 },
              show: { y: "0%", opacity: 1 },
            }}
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: base + 0.6 + idx * 0.055 }}
          >
            {txt}
          </motion.span>
        </span>{" "}
      </span>
    );
  };

  return (
    <section ref={ref} className="hero-beam" data-screen-label="Home - Hero" data-settled={isSettled ? "1" : undefined}>
      {/* domeY is scaled by 0.2 in the shader: -0.5 moves the beam down 10% of the hero. */}
      <BandBackdrop domeY={-0.74} intensity={0.98} />
      <div className="wrap">
        <motion.div
          className="hero-beam-in"
          style={{ y: copyY, opacity: copyOpacity, willChange: "transform, opacity" }}
        >
          <motion.div
            className="hb-wordmark"
            // opacity + scale only: these are composited. The old blur(14px) ->
            // 0 animation re-rasterised the ~400x275px mark (with its drop
            // shadow) on every frame of a 1.3s tween.
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
            animate={animate}
            variants={
              reduce
                ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                : { hidden: { opacity: 0, scale: 1.04 }, show: { opacity: 1, scale: 1 } }
            }
            transition={{ duration: 1.2, ease: EASE, delay: base + 0.05 }}
          >
            <AparLogo />
          </motion.div>

          <h1 className="display hero-h1">
            {LINE_1.map(word)}
            <br />
            <span className="hl">{LINE_2.map(word)}</span>
          </h1>

          <motion.div
            className="hero-actions"
            initial={{ y: 22, opacity: 0 }}
            animate={animate}
            variants={{ hidden: { y: 22, opacity: 0 }, show: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.7, ease: EASE, delay: base + 1.3 }}
          >
            <Magnetic strength={0.3}>
              <Link className="btn cream" href="/work">
                <HoverText>See the work</HoverText>
                <span className="arr" aria-hidden="true">↗</span>
              </Link>
            </Magnetic>
            <Link className="btn-ghost light" href="/what-we-do">
              <HoverText>What we do</HoverText>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div ref={cueRef} className="scroll-hint">
        <motion.div
          className="scroll-cue"
          initial={{ opacity: 0, y: 10 }}
          animate={animate}
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: EASE, delay: base + 1.65 }}
          onAnimationComplete={() => setSettled(true)}
        >
          <span className="cue-mouse" aria-hidden />
          <span>Scroll to explore</span>
        </motion.div>
      </div>
    </section>
  );
}
