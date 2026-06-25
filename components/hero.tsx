"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BandBackdrop } from "./band-backdrop";
import { AparLogo } from "./apar-logo";
import { Magnetic } from "./magnetic";

const EASE = [0.16, 1, 0.3, 1] as const;

const LINE_1 = "Brands worth".split(" ");
const LINE_2 = "remembering.".split(" ");

/**
 * Home hero — the brand's Algolia-style beam promoted to the landing screen:
 * the red pixel-dome arc sweeps behind the giant APAR wordmark (tinted to the
 * beam's pale-rose crest so it sits IN the light, not against it) and the
 * brand statement. Entrance choreography is gated on the intro overlay lift;
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
  // (plain scroll listener + CSS transition — kept out of framer's opacity
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
            transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: base + 0.85 + idx * 0.055 }}
          >
            {txt}
          </motion.span>
        </span>{" "}
      </span>
    );
  };

  return (
    <section ref={ref} className="hero-beam" data-screen-label="Home — Hero">
      <BandBackdrop domeY={-0.24} intensity={0.98} />
      <div className="wrap">
        <motion.div
          className="hero-beam-in"
          style={{ y: copyY, opacity: copyOpacity, willChange: "transform, opacity" }}
        >
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
            <span>Est. 2026</span>
          </motion.div>

          <motion.div
            className="hb-wordmark"
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.06, filter: "blur(14px)" }}
            animate={animate}
            variants={
              reduce
                ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                : {
                    hidden: { opacity: 0, scale: 1.06, filter: "blur(14px)" },
                    show: { opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } },
                  }
            }
            transition={{ duration: 1.3, ease: EASE, delay: base + 0.25 }}
          >
            <AparLogo />
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
            transition={{ duration: 0.85, ease: EASE, delay: base + 1.45 }}
          >
            A digital marketing &amp; branding agency for jewellery houses and premium brands — we
            turn attention into growth with strategy, content and campaigns.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ y: 22, opacity: 0 }}
            animate={animate}
            variants={{ hidden: { y: 22, opacity: 0 }, show: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.7, ease: EASE, delay: base + 1.65 }}
          >
            <Magnetic strength={0.3}>
              <a className="btn cream" href="/work">
                <span>See the work</span>
                <span className="arr">↗</span>
              </a>
            </Magnetic>
            <a className="btn-ghost light" href="/#services">
              What we do
            </a>
          </motion.div>
        </motion.div>
      </div>

      <div ref={cueRef} className="scroll-hint">
        <motion.div
          className="scroll-cue"
          initial={{ opacity: 0, y: 10 }}
          animate={animate}
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.6, ease: EASE, delay: base + 2.0 }}
        >
          <span className="cue-mouse" aria-hidden />
          <span>Scroll to explore</span>
        </motion.div>
      </div>
    </section>
  );
}
