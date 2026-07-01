"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AparLogo } from "./apar-logo";

/**
 * Intro reveal overlay - APAR logo + count-up wipes away on first visit
 * (once per session). The hero entrance is synced to this lift.
 */
export function Intro({ onDone }: { onDone?: () => void }) {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sessionStorage.getItem("apar-introduced")) {
      onDone?.();
      return;
    }
    sessionStorage.setItem("apar-introduced", "1");
    setShow(true);
    document.body.classList.add("intro-lock");

    let n = 0;
    const ci = setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 9));
      setCount(n);
      if (n >= 100) clearInterval(ci);
    }, 110);

    const t = setTimeout(() => {
      setShow(false);
      document.body.classList.remove("intro-lock");
      onDone?.();
    }, 1900);

    return () => {
      clearInterval(ci);
      clearTimeout(t);
      document.body.classList.remove("intro-lock");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="intro"
          initial={{ y: 0 }}
          exit={{ y: "-101%" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="intro-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <AparLogo onDark />
          </motion.div>
          <span className="intro-tag">Digital Marketing Agency · Mumbai</span>
          <span className="intro-count">{count}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
