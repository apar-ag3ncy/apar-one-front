"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { CASE_PAGE_THEME } from "@/lib/case-presentation";

export interface TransitionTarget {
  href: string;
  color: string;
  ink: string;
  label: string;
}

const TransitionContext = createContext<(t: TransitionTarget) => void>(() => {});

/** Call to play a seamless full-screen cover→navigate→reveal transition. */
export const useCaseTransition = () => useContext(TransitionContext);

type Phase = "idle" | "cover" | "reveal";

// If the next route hasn't rendered by then, lift anyway rather than trap the
// visitor behind the wipe (slow network, failed chunk).
const REVEAL_TIMEOUT_MS = 2500;

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [target, setTarget] = useState<TransitionTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = useRef(false);
  const revealTimer = useRef<number>(0);

  const start = useCallback((t: TransitionTarget) => {
    if (busy.current) return;
    if (reduced) { router.push(t.href); return; }
    busy.current = true;
    // Every entry point (cards, next-case links and overscroll) lands on the
    // same white story palette, without changing the cover/reveal choreography.
    setTarget(/^\/work\/[^/?#]+(?:[?#].*)?$/.test(t.href)
      ? { ...t, color: CASE_PAGE_THEME.bg, ink: CASE_PAGE_THEME.ink } : t);
    setPhase("cover");
  }, [reduced, router]);

  useEffect(() => {
    if (!reduced || !target || phase === "idle") return;
    window.clearTimeout(revealTimer.current);
    router.push(target.href);
    setPhase("idle"); setTarget(null); busy.current = false;
  }, [reduced, target, phase, router]);

  // Lift the wipe once the NEW page is actually on screen (pathname changed),
  // not on a fixed timer - a fixed 140ms lifted early on anything slower than a
  // warm cache and showed the old page sliding out from under it before the new
  // one snapped in. The timeout is the safety net if navigation never lands.
  useEffect(() => {
    if (phase !== "cover" || !target) return;
    const targetPath = target.href.split(/[?#]/)[0];
    if (pathname === targetPath) {
      window.clearTimeout(revealTimer.current);
      setPhase("reveal");
    }
  }, [pathname, phase, target]);

  useEffect(() => () => window.clearTimeout(revealTimer.current), []);

  const onComplete = () => {
    if (phase === "cover" && target) {
      // Screen is fully covered - navigate underneath; the reveal follows the
      // route change (effect above), or the timeout.
      router.push(target.href);
      window.clearTimeout(revealTimer.current);
      revealTimer.current = window.setTimeout(() => setPhase("reveal"), REVEAL_TIMEOUT_MS);
    } else if (phase === "reveal") {
      setPhase("idle");
      setTarget(null);
      busy.current = false;
    }
  };

  return (
    <TransitionContext.Provider value={start}>
      {children}
      {phase !== "idle" && target && (
        <motion.div
          className="page-wipe"
          style={{ background: target.color, color: target.ink }}
          initial={{ y: "100%" }}
          animate={{ y: phase === "cover" ? "0%" : "-100%" }}
          transition={{ duration: 0.62, ease: [0.76, 0, 0.24, 1] }}
          onAnimationComplete={onComplete}
        >
          <span className="page-wipe-label">
            {target.label} <span className="page-wipe-arrow">↗</span>
          </span>
        </motion.div>
      )}
    </TransitionContext.Provider>
  );
}
