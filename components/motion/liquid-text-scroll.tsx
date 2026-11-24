"use client";

import { useEffect, useRef } from "react";
import { mountLiquidTextScroll } from "./mount-liquid-text-scroll";

/** Shared entry reveals for every route; testimonial copy is excluded. */
export function LiquidTextScroll() {
  const defs = useRef<SVGDefsElement>(null);
  useEffect(() => {
    if (defs.current) return mountLiquidTextScroll(document.body, defs.current);
  }, []);
  return <svg aria-hidden="true" focusable="false" width="1" height="1" className="liquid-text-defs">
    <defs ref={defs} />
  </svg>;
}
