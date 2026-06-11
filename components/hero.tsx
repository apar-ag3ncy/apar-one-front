"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ImageSlot } from "./image-slot";
import { Magnetic } from "./magnetic";

const EASE = [0.16, 1, 0.3, 1] as const;

const LINE_1 = "Brands worth".split(" ");
const LINE_2 = "remembering.".split(" ");

/**
 * Home hero — choreographed entrance (Framer Motion), synced to the moment
 * the intro overlay lifts, plus scroll-linked parallax + fade on exit.
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
  const featY = useTransform(scrollYProgress, [0, 1], ["0%", "-26%"]);

  // Lusion-style: the scroll cue dissolves as soon as the user starts scrolling
  // (plain scroll listener + CSS transition — kept out of framer's opacity
  // arbitration, which suppresses derived MotionValues here).
  const [cueGone, setCueGone] = useState(false);
  useEffect(() => {
    const onScroll = () => setCueGone(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const animate = reduce ? "show" : start ? "show" : "hidden";
  const base = 0.25;

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
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: base + 0.3 + idx * 0.055 }}
          >
            {txt}
          </motion.span>
        </span>{" "}
      </span>
    );
  };

  return (
    <section ref={ref} className="hero-home" data-screen-label="Home — Hero">
      <div className="wrap hero-home-in">
        <motion.div className="hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
          <motion.div
            className="meta-row"
            initial={{ y: 18, opacity: 0 }}
            animate={animate}
            variants={{ hidden: { y: 18, opacity: 0 }, show: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.7, ease: EASE, delay: base }}
          >
            <span>
              <i className="dot" /> Digital Marketing Agency
            </span>
            <span>Mumbai, IN</span>
            <span>Est. 2024</span>
          </motion.div>

          <h1 className="display hero-h1">
            {LINE_1.map(word)}
            <br />
            <span className="hl">{LINE_2.map(word)}</span>
          </h1>

          <motion.p
            className="lead"
            initial={{ y: 24, opacity: 0 }}
            animate={animate}
            variants={{ hidden: { y: 24, opacity: 0 }, show: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.85, ease: EASE, delay: base + 0.9 }}
          >
            A digital marketing &amp; branding agency for jewellery houses and premium brands — we
            turn attention into growth with strategy, content and campaigns.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ y: 22, opacity: 0 }}
            animate={animate}
            variants={{ hidden: { y: 22, opacity: 0 }, show: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.7, ease: EASE, delay: base + 1.15 }}
          >
            <Magnetic strength={0.3}>
              <a className="btn" href="/work">
                <span>See the work</span>
                <span className="arr">↗</span>
              </a>
            </Magnetic>
            <a className="btn-ghost" href="/#services">
              What we do
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-feature"
          initial={{ opacity: 0 }}
          animate={animate}
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
          transition={{ duration: 0.5, ease: EASE, delay: base + 0.3 }}
        >
          <motion.div className="hero-feature-par" style={{ y: featY }}>
            <motion.div
              className="frame"
              data-cursor-label="Featured"
              initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
              animate={animate}
              variants={{
                hidden: { clipPath: "inset(0% 0% 100% 0%)" },
                show: { clipPath: "inset(0% 0% 0% 0%)" },
              }}
              transition={{ duration: 1.25, ease: [0.65, 0, 0.35, 1], delay: base + 0.4 }}
            >
              <motion.div
                initial={{ scale: 1.14 }}
                animate={animate}
                variants={{ hidden: { scale: 1.14 }, show: { scale: 1 } }}
                transition={{ duration: 1.7, ease: EASE, delay: base + 0.4 }}
              >
                <ImageSlot
                  shape="rounded"
                  radius={4}
                  placeholder="Drop a featured campaign image"
                  style={{ width: "100%", aspectRatio: "4/5" }}
                />
              </motion.div>
              <motion.span
                className="hero-feature-num"
                initial={{ opacity: 0, y: 12 }}
                animate={animate}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: EASE, delay: base + 1.0 }}
              >
                01
              </motion.span>
              <motion.span
                className="hero-feature-cap"
                initial={{ opacity: 0, y: 12 }}
                animate={animate}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: EASE, delay: base + 1.12 }}
              >
                Featured — Chheda Jewellers
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <div className={`scroll-hint${cueGone ? " gone" : ""}`}>
        <motion.div
          className="scroll-cue"
          initial={{ opacity: 0, y: 10 }}
          animate={animate}
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: EASE, delay: base + 1.5 }}
        >
          <span className="cue-mouse" aria-hidden />
          <span>Scroll to explore</span>
        </motion.div>
      </div>
    </section>
  );
}
