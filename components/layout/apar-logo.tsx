"use client";

import { useEffect, useRef, useState } from "react";

/**
 * APAR wordmark - strictly **Fit** (David Jonathan Ross). The leading glyph
 * alternates only between Hindi अ and English A using the bundled Fit fonts.
 * Other loaded scripts cannot join the sequence or repeat an A-shaped glyph.
 *
 * Script variants share a baseline-aligned slot beside "PĀR". The responsive
 * header reserves its compact box and uses the original vector until the local
 * Fit fonts are ready. Phones then share the same script cycle as desktop.
 * Both variants render white / cream / red / ink via CSS color.
 */

const SCRIPTS = [
  { key: "deva", char: "अ", cssVar: "--fit-deva", fitName: "fit-devanagari-vf" },
  { key: "latin", char: "A", cssVar: "--fit", fitName: "fit-vf" },
] as const;

export function AparLogo({ onDark = false, responsive = false }: { onDark?: boolean; responsive?: boolean }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [i, setI] = useState(0);

  // Start only when both real Fit faces have loaded.
  useEffect(() => {
    let alive = true;
    let detecting = false;
    const detect = async () => {
      if (!alive || detecting || !document.fonts) return;
      detecting = true;
      // Load only the two faces used in this fixed sequence.
      await Promise.all(
        SCRIPTS.map((s) =>
          document.fonts.load(`900 64px "${s.fitName}"`, s.char).catch(() => {})
        )
      );
      detecting = false;
      if (!alive) return;
      const loaded = new Set<string>();
      document.fonts.forEach((ff) => {
        if (ff.status === "loaded")
          loaded.add(ff.family.replace(/^["']|["']$/g, "").toLowerCase());
      });
      setFontsReady(loaded.has("fit-vf") && loaded.has("fit-devanagari-vf"));
    };
    detect();
    document.fonts?.ready.then(detect);
    document.fonts?.addEventListener?.("loadingdone", detect);
    const t = setTimeout(detect, 1500);
    return () => {
      alive = false;
      clearTimeout(t);
      document.fonts?.removeEventListener?.("loadingdone", detect);
    };
  }, []);

  // Fit the complete wordmark uniformly inside the reserved mobile box
  // without shifting the Menu button.
  useEffect(() => {
    const container = containerRef.current;
    const wordmark = wordmarkRef.current;
    if (!responsive || !fontsReady || !container || !wordmark) return;
    const fit = () => {
      const width = wordmark.scrollWidth;
      container.style.setProperty("--apar-logo-scale", String(width ? Math.min(1, 80 / width) : 1));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wordmark);
    return () => observer.disconnect();
  }, [responsive, fontsReady]);

  // Cross-fade on every screen size; pause offscreen, in background tabs and
  // whenever the visitor requests reduced motion (including live changes).
  useEffect(() => {
    if (!fontsReady) return;
    const container = containerRef.current;
    if (!container) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const start = Date.now();
    const tick = () => {
      setI((x) => (x + 1) % SCRIPTS.length);
      const delay = Date.now() - start < 2000 ? 950 : 2400;
      timer = setTimeout(tick, delay);
    };
    // While the hero's load-in choreography runs (it flags itself on <html>),
    // hold the first swap so the lead glyph never hard-cuts mid-fade.
    const firstTick = () => {
      if (document.documentElement.dataset.heroEntrance) {
        timer = setTimeout(firstTick, 250);
        return;
      }
      timer = setTimeout(tick, 800);
    };
    const stop = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const sync = () => {
      stop();
      if (visible && !document.hidden && !reduced.matches) firstTick();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(container);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      io.disconnect();
      stop();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [fontsReady]);

  const currentKey = SCRIPTS[i % SCRIPTS.length].key;

  return (
    <span ref={containerRef} className={`apar-logo${responsive ? " apar-logo-responsive" : ""}${onDark ? " on-dark" : ""}`} data-fonts-ready={fontsReady ? "true" : undefined} aria-label="APAR" role="img">
      {/* Keep the original compact vector visible until genuine Fit is loaded. */}
      {responsive && <span className="apar-logo-compact" aria-hidden="true" />}
      <span ref={wordmarkRef} className="apar-logo-inner" aria-hidden="true">
        <span className="apar-lead-wrap">
          {SCRIPTS.map((s) => {
            const visible = s.key === currentKey;
            return (
              <span
                key={s.key}
                className="apar-lead-char"
                style={{
                  fontFamily: `var(${s.cssVar})`,
                  opacity: visible ? 1 : 0,
                  visibility: visible ? "visible" : "hidden",
                }}
              >
                {s.char}
              </span>
            );
          })}
        </span>
        <span className="apar-par-text">PĀR</span>
      </span>
    </span>
  );
}
