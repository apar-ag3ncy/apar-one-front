"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [target, setTarget] = useState<TransitionTarget | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = useRef(false);

  const start = useCallback((t: TransitionTarget) => {
    if (busy.current) return;
    busy.current = true;
    setTarget(t);
    setPhase("cover");
  }, []);

  const onComplete = () => {
    if (phase === "cover" && target) {
      // Screen is fully covered - navigate underneath, then lift to reveal.
      router.push(target.href);
      window.setTimeout(() => setPhase("reveal"), 140);
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
