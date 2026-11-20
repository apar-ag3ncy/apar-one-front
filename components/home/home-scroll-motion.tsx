"use client";

import { useEffect } from "react";
import { mountSectionEdgeMotion } from "./section-edge-motion";

/** Visible section edges respond to scroll velocity. */
export function HomeScrollMotion() {
  useEffect(() => {
    const home = document.querySelector<HTMLElement>(".meeting-home");
    if (home) return mountSectionEdgeMotion(home);
  }, []);

  return null;
}
