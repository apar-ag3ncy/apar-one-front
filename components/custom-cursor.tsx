"use client";

import { useEffect } from "react";

const HOVER_SEL =
  "a,button,.work-card,.svc-item,.fc-card,.chip,[data-magnetic],[data-cursor],[data-cursor-label]";

/**
 * Unique APAR cursor — a brand-red ring that trails the pointer on a spring,
 * led by a precise center dot. Over interactive elements it snaps to a solid
 * red disc with a context label ("View" / "Explore" / "Featured").
 *
 * The ring/dot are created imperatively and appended to <body> (like the
 * original prototype) so React re-renders / Fast Refresh can never reset the
 * state classes that drive visibility. Shown whenever a fine pointer exists;
 * hidden for reduced-motion so the native cursor takes over.
 */
export function CustomCursor() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    const label = document.createElement("span");
    label.className = "cursor-label";
    ring.appendChild(label);
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.documentElement.classList.add("has-cursor");

    const cur = { x: innerWidth / 2, y: innerHeight / 2 };
    const r = { x: cur.x, y: cur.y };
    const d = { x: cur.x, y: cur.y };
    let scale = 1;
    let scaleT = 1;
    let raf = 0;
    let running = false;
    let curTarget: Element | null = null;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // Seed transforms + reveal immediately (no top-left flash, visible at once).
    ring.style.transform = `translate(${r.x}px,${r.y}px) translate(-50%,-50%) scale(1)`;
    dot.style.transform = `translate(${d.x}px,${d.y}px) translate(-50%,-50%)`;
    ring.classList.add("ready");
    dot.classList.add("ready");

    const frame = () => {
      if (
        Math.abs(r.x - cur.x) < 0.1 &&
        Math.abs(r.y - cur.y) < 0.1 &&
        Math.abs(d.x - cur.x) < 0.1 &&
        Math.abs(d.y - cur.y) < 0.1 &&
        Math.abs(scale - scaleT) < 0.001
      ) {
        r.x = cur.x;
        r.y = cur.y;
        d.x = cur.x;
        d.y = cur.y;
        scale = scaleT;
        ring.style.transform = `translate(${r.x}px,${r.y}px) translate(-50%,-50%) scale(${scale})`;
        dot.style.transform = `translate(${d.x}px,${d.y}px) translate(-50%,-50%)`;
        running = false;
        return;
      }
      r.x = lerp(r.x, cur.x, 0.16);
      r.y = lerp(r.y, cur.y, 0.16);
      d.x = lerp(d.x, cur.x, 0.42);
      d.y = lerp(d.y, cur.y, 0.42);
      scale = lerp(scale, scaleT, 0.15);
      ring.style.transform = `translate(${r.x}px,${r.y}px) translate(-50%,-50%) scale(${scale})`;
      dot.style.transform = `translate(${d.x}px,${d.y}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: MouseEvent) => {
      cur.x = e.clientX;
      cur.y = e.clientY;
      wake();
    };
    const onOver = (e: MouseEvent) => {
      const t = (e.target as Element)?.closest?.(HOVER_SEL) ?? null;
      if (t === curTarget) return;
      curTarget = t;
      if (!t) return;
      const el = t as HTMLElement;
      scaleT = el.dataset.cursor
        ? 3.4
        : el.matches(".work-card,.svc-item,.fc-card")
          ? 3.4
          : 1.9;
      const labelText = el.dataset.cursorLabel || (el.matches(".work-card") ? "View" : "");
      ring.classList.toggle("labelled", !!labelText);
      if (labelText) label.textContent = labelText;
      ring.classList.add("active");
      wake();
    };
    const onOut = (e: MouseEvent) => {
      if (((e.relatedTarget as Element)?.closest?.(HOVER_SEL) ?? null) === curTarget) return;
      curTarget = null;
      scaleT = 1;
      ring.classList.remove("active", "labelled");
      wake();
    };
    const onDown = () => {
      ring.classList.add("down");
      wake();
    };
    const onUp = () => ring.classList.remove("down");

    addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    addEventListener("mousedown", onDown);
    addEventListener("mouseup", onUp);

    wake();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      removeEventListener("mousedown", onDown);
      removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("has-cursor");
      ring.remove();
      dot.remove();
    };
  }, []);

  return null;
}
