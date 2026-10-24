"use client";

import { DESKTOP_MOTION_QUERY } from "@/lib/motion-policy";

import { lazy, Suspense, useEffect, useState } from "react";

const SlowMo = lazy(() => import("@/components/motion/slow-mo").then(module => ({ default: module.SlowMo })));

/** Load the cinematic scroll layer only where it actually runs. */
export function DesktopSlowMo() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_MOTION_QUERY);
    const sync = () => setEnabled(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return enabled ? <Suspense fallback={null}><SlowMo /></Suspense> : null;
}
