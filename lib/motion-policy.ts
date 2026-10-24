"use client";

import { useSyncExternalStore } from "react";

// A single boundary for phone layouts, touch devices and their live previews.
// Desktop choreography is unchanged; phones always use stationary text.
export const MOBILE_LAYOUT_QUERY = "(max-width: 900px), (hover: none) and (pointer: coarse)";
export const DESKTOP_MOTION_QUERY = "(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const subscribe = (notify: () => void) => {
  const query = window.matchMedia(MOBILE_LAYOUT_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const snapshot = () => window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
const serverSnapshot = () => false;

export function useMobileLayout() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
