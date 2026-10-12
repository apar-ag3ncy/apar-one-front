"use client";

import { useEffect, type RefObject } from "react";
import { TILE_CELL } from "@/lib/comet";

const hovered = new Set<HTMLImageElement>();
const LIFE = 900;
const CELL_X = TILE_CELL * 1.5;
const CELL_Y = TILE_CELL;

function hoverImage(img: HTMLImageElement, active: boolean) {
  if (active) hovered.add(img);
  else hovered.delete(img);
  if (hovered.size) document.documentElement.dataset.onImage = "1";
  else delete document.documentElement.dataset.onImage;
}

/** A temporary mosaic of the photo itself, leaving its layout and original pixels intact. */
export function useImagePixelTrail(ref: RefObject<HTMLImageElement | null>, ready: boolean) {
  useEffect(() => {
    const img = ref.current;
    const host = img?.parentElement;
    if (!ready || !img || !host) return;
    const disabled = matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)");
    let canvas: HTMLCanvasElement | undefined;
    let ctx: CanvasRenderingContext2D | null = null;
    let sample: HTMLCanvasElement | undefined;
    let sampleCtx: CanvasRenderingContext2D | null = null;
    let width = 0, height = 0, raf = 0, inside = false;
    let sampledSource = "";
    let sampledPosition = "";
    let pointerX = 0, pointerY = 0;
    let points: { x: number; y: number; time: number }[] = [];

    const leave = () => {
      inside = false;
      hoverImage(img, false);
    };
    const clear = () => {
      leave();
      cancelAnimationFrame(raf);
      raf = 0;
      points = [];
      if (canvas) canvas.style.visibility = "hidden";
    };
    const prepare = () => {
      if (!canvas) {
        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        sample = document.createElement("canvas");
        sampleCtx = sample.getContext("2d");
        if (!ctx || !sampleCtx) return false;
        canvas.className = "image-pixel-trail";
        canvas.setAttribute("aria-hidden", "true");
        host.appendChild(canvas);
      }
      return !!ctx && !!sampleCtx;
    };

    const frame = (now: number) => {
      raf = 0;
      if (disabled.matches || document.hidden || !img.isConnected) { clear(); return; }
      if (!ctx || !canvas || !sample || !sampleCtx) return;
      const style = getComputedStyle(img);
      const w = img.offsetWidth, h = img.offsetHeight;
      if (!w || !h) { clear(); return; }

      // The overlay gets the very same GSAP transform as the original image.
      // Compose the linear transforms to map the pointer through ancestor skew
      // and scaling too; bounding-rect ratios alone drift on a skewed frame.
      let matrix = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
      for (let parent: HTMLElement | null = host; parent; parent = parent.parentElement) {
        const transform = getComputedStyle(parent).transform;
        if (transform !== "none") matrix = new DOMMatrix(transform).multiply(matrix);
      }
      const linear = new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, 0, 0]);
      const rect = img.getBoundingClientRect();
      const minX = Math.min(0, matrix.a * w, matrix.c * h, matrix.a * w + matrix.c * h);
      const minY = Math.min(0, matrix.b * w, matrix.d * h, matrix.b * w + matrix.d * h);
      const local = linear.inverse().transformPoint(new DOMPoint(pointerX - rect.left + minX, pointerY - rect.top + minY));
      if (!Number.isFinite(local.x) || !Number.isFinite(local.y)) { clear(); return; }
      const scale = Math.max(0.1, Math.hypot(matrix.a, matrix.b));

      if (inside && !host.contains(document.elementFromPoint(pointerX, pointerY))) leave();
      if (w !== width || h !== height || sampledSource !== img.currentSrc || sampledPosition !== style.objectPosition) {
        width = w; height = h;
        sampledSource = img.currentSrc;
        sampledPosition = style.objectPosition;
        points = [];
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        sample.width = Math.ceil(w / CELL_X);
        sample.height = Math.ceil(h / CELL_Y);
        // Sample the same cover crop and alignment as the displayed photograph.
        const fit = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const sourceW = w / fit, sourceH = h / fit;
        const position = style.objectPosition.split(" ");
        const fraction = (value: string | undefined) => value?.endsWith("%")
          ? Math.max(0, Math.min(1, parseFloat(value) / 100)) : 0.5;
        sampleCtx.drawImage(img, (img.naturalWidth - sourceW) * fraction(position[0]),
          (img.naturalHeight - sourceH) * fraction(position[1]),
          sourceW, sourceH, 0, 0, w / CELL_X, h / CELL_Y);
      }
      points = points.filter(p => now - p.time < LIFE);
      if (inside) {
        const last = points[points.length - 1];
        // Seed on entry and on travel, not on every animation frame: a still
        // cursor resolves to the original photograph as well.
        if (pending || (last && Math.hypot(local.x - last.x, local.y - last.y) > 5)) {
          const distance = last ? Math.hypot(local.x - last.x, local.y - last.y) : 0;
          const count = Math.min(8, Math.max(1, Math.ceil(distance / 12)));
          for (let i = 1; i <= count; i++) {
            const f = i / count;
            points.push({ x: last ? last.x + (local.x - last.x) * f : local.x,
              y: last ? last.y + (local.y - last.y) * f : local.y, time: now - (1 - f) * 30 });
          }
          points = points.slice(-64);
          pending = false;
        }
      }
      canvas.style.transform = style.transform;
      canvas.style.transformOrigin = style.transformOrigin;
      canvas.style.opacity = style.opacity;
      ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!points.length) { canvas.style.visibility = "hidden"; return; }
      canvas.style.visibility = "visible";
      ctx.imageSmoothingEnabled = false;
      const radius = 80 / scale;
      const x0 = Math.max(0, Math.floor((Math.min(...points.map(p => p.x)) - radius) / CELL_X));
      const x1 = Math.min(sample.width, Math.ceil((Math.max(...points.map(p => p.x)) + radius) / CELL_X));
      const y0 = Math.max(0, Math.floor((Math.min(...points.map(p => p.y)) - radius) / CELL_Y));
      const y1 = Math.min(sample.height, Math.ceil((Math.max(...points.map(p => p.y)) + radius) / CELL_Y));
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        let strength = 0;
        for (const p of points) {
          const distance = Math.hypot((x + 0.5) * CELL_X - p.x, (y + 0.5) * CELL_Y - p.y) / radius;
          const edge = Math.max(0, Math.min(1, (1 - distance) / 0.5));
          const age = Math.max(0, 1 - (now - p.time) / LIFE);
          strength = Math.max(strength, edge * edge * (3 - 2 * edge) * age * age);
        }
        if (strength < 0.012) continue;
        ctx.globalAlpha = strength;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x * CELL_X + 0.15, y * CELL_Y + 0.15, CELL_X - 0.3, CELL_Y - 0.3, 1.6);
        ctx.clip();
        ctx.drawImage(sample, x, y, 1, 1, x * CELL_X, y * CELL_Y, CELL_X, CELL_Y);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    let pending = false;
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const move = (event: PointerEvent) => {
      if (disabled.matches || event.pointerType === "touch" || !prepare()) return;
      pointerX = event.clientX; pointerY = event.clientY;
      inside = true;
      pending = true;
      hoverImage(img, true);
      wake();
    };
    const scroll = () => { if (inside) wake(); };
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointercancel", leave);
    window.addEventListener("scroll", scroll, { passive: true, capture: true });
    window.addEventListener("blur", clear);
    window.addEventListener("resize", clear);
    document.addEventListener("visibilitychange", clear);
    disabled.addEventListener("change", clear);
    return () => {
      clear();
      canvas?.remove();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointercancel", leave);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("blur", clear);
      window.removeEventListener("resize", clear);
      document.removeEventListener("visibilitychange", clear);
      disabled.removeEventListener("change", clear);
    };
  }, [ref, ready]);
}
