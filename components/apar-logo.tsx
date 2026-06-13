"use client";

import { useEffect, useRef, useState } from "react";

// The leading "A" cycles through the SAME letter as Fit draws it — strictly the
// three scripts Fit ships in (Latin, Devanagari, Kannada), each in its matching
// Fit family.
const SCRIPTS = [
  { char: "A", cssVar: "--fit" }, // Latin — Fit (David Jonathan Ross)
  { char: "अ", cssVar: "--fit-deva" }, // Devanagari — Fit Devanagari (Kimya Gandhi)
  { char: "ಅ", cssVar: "--fit-kannada" }, // Kannada — Fit Kannada (Taresh Vohra)
];

/**
 * Animated APAR wordmark, set in **Fit** (DJR). The leading "A" swaps between
 * Fit's three scripts (Latin → Devanagari → Kannada) in place — no entrance
 * motion, the original logo's still feel.
 *
 * Each script's glyph has a different intrinsic height/width at a given
 * font-size, so the wordmark would visibly change size as it cycles. We fix that
 * by measuring the actual rendered ink height of each glyph and uniformly scaling
 * it to match "PAR"'s cap height, plus a shared slot width so "PAR" never shifts.
 * The measurement reads whatever font truly renders — the stand-ins today, real
 * Fit once the Adobe kit is connected — so it stays correct either way.
 *
 * Respects prefers-reduced-motion (stays on Latin "A").
 */
export function AparLogo({ onDark = false }: { onDark?: boolean }) {
  const [i, setI] = useState(0);
  const [scale, setScale] = useState<number[]>([1, 1, 1]); // per-script cap-height scale
  const [slot, setSlot] = useState(1); // shared leading-A slot width, in em
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- cycle the leading glyph (swaps in place; no scale/translate) ----
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    const start = Date.now();
    let idx = 0;
    const tick = () => {
      idx = (idx + 1) % SCRIPTS.length;
      setI(idx);
      const elapsed = Date.now() - start;
      // fast on open (~1.8s flurry), then slow/calm at ~0.75 of a beat
      const delay = elapsed < 1800 ? 80 : 1300;
      timer.current = setTimeout(tick, delay);
    };
    // Only cycle while the wordmark is actually on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!timer.current) timer.current = setTimeout(tick, 80);
      } else if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

  // ---- normalize each script's glyph to PAR's cap height (kills size jump) ----
  useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return;
    const root = getComputedStyle(document.documentElement);
    // Resolve a CSS custom property to a concrete font stack canvas can parse
    // (recursively expands nested var(), e.g. --fit -> ... -> var(--sans)).
    const resolveVars = (val: string) => {
      let v = val.trim();
      let guard = 0;
      while (v.includes("var(") && guard++ < 6) {
        v = v.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, name) => root.getPropertyValue(name).trim());
      }
      return v;
    };
    const PX = 200;
    const measure = (text: string, cssVar: string) => {
      ctx.font = `900 ${PX}px ${resolveVars(root.getPropertyValue(cssVar))}`;
      const m = ctx.measureText(text);
      return { asc: m.actualBoundingBoxAscent || 0, w: m.width || 0 };
    };
    let alive = true;
    const normalize = () => {
      if (!alive) return;
      const capRef = measure("P", "--fit").asc; // the cap height of "PAR"
      if (!capRef) return;
      const data = SCRIPTS.map((s) => {
        const { asc, w } = measure(s.char, s.cssVar);
        const sc = asc > 0 ? capRef / asc : 1;
        return { sc, wEm: (w / PX) * sc };
      });
      setScale(data.map((d) => +d.sc.toFixed(3)));
      setSlot(+(Math.max(...data.map((d) => d.wEm)) + 0.06).toFixed(3));
    };
    document.fonts?.ready.then(normalize);
    const t = setTimeout(normalize, 1200);
    document.fonts?.addEventListener?.("loadingdone", normalize);
    return () => {
      alive = false;
      clearTimeout(t);
      document.fonts?.removeEventListener?.("loadingdone", normalize);
    };
  }, []);

  return (
    <span
      ref={ref}
      className={`apar-logo${onDark ? " on-dark" : ""}`}
      aria-label="APAR"
      role="img"
      style={{ ["--apar-a-slot"]: slot } as React.CSSProperties}
    >
      <span className="apar-a" aria-hidden="true">
        <span
          className="apar-a-glyph"
          style={{ fontFamily: `var(${SCRIPTS[i].cssVar})`, fontSize: `${scale[i]}em` }}
        >
          {SCRIPTS[i].char}
        </span>
      </span>
      <span className="apar-rest" aria-hidden="true">
        PAR
      </span>
    </span>
  );
}
