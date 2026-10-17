"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const SlowMo = lazy(() => import("./slow-mo").then(module => ({ default: module.SlowMo })));

/** Load the cinematic scroll layer only where it actually runs. */
export function DesktopSlowMo() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 741px) and (prefers-reduced-motion: no-preference)");
    const sync = () => setEnabled(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return enabled ? <Suspense fallback={null}><SlowMo /></Suspense> : null;
}
