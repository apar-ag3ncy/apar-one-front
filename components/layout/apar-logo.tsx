"use client";

import { MOBILE_LAYOUT_QUERY, useMobileLayout } from "@/lib/motion-policy";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * APAR wordmark - strictly **Fit** (David Jonathan Ross). The leading "A"
 * transitions across the languages Fit ships in, every form rendered in REAL Fit:
 *
 *  • Latin A and Devanagari अ use the bundled Fit variable fonts.
 *  • The other Fit scripts (Cyrillic А, Greek Α, Hebrew א, Armenian Ա, Tamil அ,
 *    Kannada ಅ, Arabic ا) render as live Fit text from their matching Fit family -
 *    but ONLY join the cycle once document.fonts confirms that real Fit family is
 *    loaded (via the agency's Adobe Fonts kit). They are NEVER shown in a fallback
 *    font, so the mark is strictly Fit at all times.
 *
 * Script variants share a baseline-aligned slot beside "PĀR". The responsive
 * header uses the original vector artwork at compact-navigation widths, so it
 * does not depend on font loading or hydrated media-query state. Both variants
 * render white / cream / red / ink via CSS color.
 */

type Script = {
  key: string;
  lang: string;
  label: string;
  char?: string;
  cssVar?: string;
  fitName?: string;
  style?: CSSProperties;
};

const SCRIPTS: Script[] = [
  { key: "deva", lang: "Devanagari", label: "अ", char: "अ", cssVar: "--fit-deva", fitName: "fit-devanagari-vf" },
  { key: "latin", lang: "Latin", label: "A", char: "A", cssVar: "--fit", fitName: "fit-vf" },
  { key: "cyrillic", lang: "Cyrillic", label: "А", char: "А", cssVar: "--fit", fitName: "fit-vf" },
  { key: "greek", lang: "Greek", label: "Α", char: "Α", cssVar: "--fit", fitName: "fit-vf" },
  { key: "hebrew", lang: "Hebrew", label: "א", char: "א", cssVar: "--fit-hebrew", fitName: "fit-hebrew-vf" },
  { key: "tamil", lang: "Tamil", label: "அ", char: "அ", cssVar: "--fit-tamil", fitName: "fit-tamil-vf", style: { fontVariationSettings: "'wdth' 482" } },
  { key: "armenian", lang: "Armenian", label: "Ա", char: "Ա", cssVar: "--fit-armenian", fitName: "fit-armenian-vf", style: { fontVariationSettings: "'wdth' 500" } },
  { key: "arabic", lang: "Arabic", label: "ا", char: "ا", cssVar: "--fit-arabic", fitName: "fit-arabic-vf", style: { fontVariationSettings: "'wdth' 482" } },
  { key: "kannada", lang: "Kannada", label: "ಅ", char: "ಅ", cssVar: "--fit-kannada", fitName: "fit-kannada-vf" },
];

export function AparLogo({ onDark = false, responsive = false }: { onDark?: boolean; responsive?: boolean }) {
  const mobile = useMobileLayout();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<string[]>(["deva", "latin"]);
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect which live Fit scripts are GENUINELY loaded.
  useEffect(() => {
    if (mobile || window.matchMedia(MOBILE_LAYOUT_QUERY).matches) return;
    let alive = true;
    const detect = async () => {
      if (!alive || !document.fonts) return;
      // Ask the browser to load any declared Fit faces
      await Promise.all(
        SCRIPTS.map((s) =>
          document.fonts.load(`64px "${s.fitName}"`, s.char || "A").catch(() => {})
        )
      );
      if (!alive) return;
      const loaded = new Set<string>();
      document.fonts.forEach((ff) => {
        if (ff.status === "loaded")
          loaded.add(ff.family.replace(/^["']|["']$/g, "").toLowerCase());
      });
      // Devanagari and Latin are always in the cycle; other scripts join only when loaded
      const ok = SCRIPTS.filter(
        (s) => s.key === "deva" || s.key === "latin" || (s.fitName && loaded.has(s.fitName.toLowerCase()))
      ).map((s) => s.key);
      setActive((prev) => (prev.join() === ok.join() ? prev : ok));
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
  }, [mobile]);

  // Cross-fade through the available scripts, only while on screen.
  useEffect(() => {
    if (mobile || window.matchMedia(MOBILE_LAYOUT_QUERY).matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (active.length < 2) return;
    const container = containerRef.current;
    if (!container) return;
    const start = Date.now();
    const tick = () => {
      setI((x) => (x + 1) % active.length);
      const delay = Date.now() - start < 2000 ? 950 : 2400;
      timer.current = setTimeout(tick, delay);
    };
    // While the hero's load-in choreography runs (it flags itself on <html>),
    // hold the first swap so the lead glyph never hard-cuts mid-fade.
    const firstTick = () => {
      if (document.documentElement.dataset.heroEntrance) {
        timer.current = setTimeout(firstTick, 250);
        return;
      }
      timer.current = setTimeout(tick, 800);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!timer.current) firstTick();
      } else if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    });
    io.observe(container);
    return () => {
      io.disconnect();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [active, mobile]);

  const activeScripts = SCRIPTS.filter((s) => active.includes(s.key));
  const currentKey = mobile ? "deva" : activeScripts[i % Math.max(activeScripts.length, 1)]?.key ?? "deva";

  return (
    <span ref={containerRef} className={`apar-logo${responsive ? " apar-logo-responsive" : ""}${onDark ? " on-dark" : ""}`} aria-label="APAR" role="img">
      {/* CSS selects the original compact vector before hydration, avoiding
          font-loading flashes and width shifts during responsive switching. */}
      {responsive && <span className="apar-logo-compact" aria-hidden="true" />}
      <span className="apar-logo-inner" aria-hidden="true">
        <span className="apar-lead-wrap">
          {SCRIPTS.map((s) => {
            const isActive = active.includes(s.key);
            const visible = isActive && s.key === currentKey;
            if (!isActive) return null;
            return (
              <span
                key={s.key}
                className="apar-lead-char"
                style={{
                  fontFamily: s.cssVar ? `var(${s.cssVar})` : "var(--fit)",
                  opacity: visible ? 1 : 0,
                  visibility: visible ? "visible" : "hidden",
                  ...s.style,
                }}
              >
                {s.char || s.label}
              </span>
            );
          })}
        </span>
        <span className="apar-par-text">PĀR</span>
      </span>
    </span>
  );
}
