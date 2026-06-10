"use client";

import { useEffect, useRef } from "react";

/**
 * PixelDome — an Algolia-style hero beam: ONE single curved strip of light,
 * rendered as thousands of tiny rounded-rectangle tiles on a strict, perfectly
 * aligned grid (tiles almost touching, subtle corner radius). The beam is
 * brightest at the top-centre crown, dimmer toward the sides, and dissolves into
 * black above and below via opacity (tiles never resize). Premium orange shades
 * (deep burnt -> amber -> golden -> soft cream crown) over a near-black base.
 *
 * Hovering lifts a soft, premium shimmer around the cursor. Click-through;
 * pointer is read from `window` (bounds-checked) so hover works over the
 * overlaid content. Parks the loop when idle/offscreen.
 */
type PixelDomeProps = {
  /** CSS px size of each pixel cell (tiny: ~4-8px). Default 6. */
  cell?: number;
  /** vertical centre of the ring system, bottom-up. Small/negative (below the
   *  frame) so the dome sweeps the whole viewport. Default -0.05. */
  domeY?: number;
  /** overall glow strength. Default 1. */
  intensity?: number;
  className?: string;
};

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos,0.0,1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;        // canvas size (device px)
uniform float uCell;       // cell size (device px)
uniform float uDomeY;      // dome centre y (0..1, bottom-up)
uniform float uIntensity;
uniform vec2  uMouse;      // 0..1, bottom-up
uniform float uMouseOn;    // 0..1
uniform float uTime;       // seconds, for flicker

// APAR orange: deep burnt -> rich amber -> warm golden -> soft cream (crown only)
const vec3 C_DARK  = vec3(0.090, 0.035, 0.015);
const vec3 C_MID   = vec3(0.520, 0.230, 0.070);
const vec3 C_HOT   = vec3(0.900, 0.540, 0.220);
const vec3 C_LIGHT = vec3(0.980, 0.910, 0.800);

// cheap per-cell hash -> 0..1
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main(){
  float aspect = uRes.x / uRes.y;

  // ---- grid cell this fragment belongs to ----
  vec2 cellId = floor(gl_FragCoord.xy / uCell);
  vec2 cellCenter = (cellId + 0.5) * uCell;
  vec2 uv = cellCenter / uRes;              // sample point (0..1, bottom-up)

  // ---- ONE single curved beam of light, following an ellipse arc whose centre
  //      sits below the frame (so the strip spans the full width). Brightness is
  //      a Gaussian ACROSS the strip — a sharper top edge and a softer inner
  //      edge — so the beam dissolves into black above and below. A second
  //      falloff ALONG the arc keeps it brightest at the top-centre crown and
  //      dimmer toward the sides (exactly like the reference). No rings, no halo.
  //      uDomeY = ellipse centre (bottom-up; negative = below the frame). ----
  float rx = 0.62;                       // horizontal radius (uv) -> past the edges
  float ry = 0.98;                       // vertical radius (uv)
  vec2 d = vec2((uv.x - 0.5) / rx, (uv.y - uDomeY) / ry);
  float dist = length(d);
  float t = dist - 0.92;                                 // signed distance across the strip
  float w = (t > 0.0) ? 0.13 : 0.18;                     // sharp top edge, soft inner edge
  float glow = exp(-(t * t) / (w * w)) * uIntensity;
  float crown = clamp(d.y / max(dist, 0.001), 0.0, 1.0); // 1 at the crown -> 0 at the sides
  glow *= mix(0.55, 1.0, crown);

  // ---- hover: a soft, premium glow lift that follows the cursor (gentle
  //      shimmer, not an arcade flicker) ----
  float md = length((uv - uMouse) * vec2(aspect, 1.0));
  float near = exp(-(md * md) / (2.0 * 0.16 * 0.16)) * uMouseOn;
  float rnd = hash21(cellId + 0.5);
  float tw  = sin(uTime * (4.0 + rnd * 6.0) + rnd * 38.0) * 0.5 + 0.5;
  glow += near * (0.35 + 0.25 * tw);

  float g = clamp(glow, 0.0, 1.3);

  // ---- tiny rounded-rectangle tile, almost touching its neighbours (very small
  //      gap, ~2-3px corner radius). No dot, no outline, identical size everywhere. ----
  vec2 local = fract(gl_FragCoord.xy / uCell) - 0.5;
  float aa = 1.0 / uCell;
  float hs = 0.46;                                      // tiles almost touch (tiny gap)
  float cr = 0.13;                                      // subtle corner radius
  vec2 qd = abs(local) - vec2(hs - cr);
  float box = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - cr; // rounded-box SDF
  float pix = 1.0 - smoothstep(-aa, aa, box);

  // ---- colour ramp: deep burnt -> amber -> golden -> soft cream (crown only) ----
  vec3 col = mix(C_DARK, C_MID, smoothstep(0.05, 0.34, g));
  col = mix(col, C_HOT, smoothstep(0.34, 0.72, g));
  col = mix(col, C_LIGHT, smoothstep(0.82, 1.12, g));

  // ---- clean emergence from darkness. Keep the approved beam opacity curve for
  //      lit tiles, then multiply by a low-glow GATE that only kills the faint
  //      tail: the gate is 1 for beam tiles (g >= 0.24, unchanged) and 0 for the
  //      faint periphery (g < 0.12), so everything outside the main beam reads as
  //      clean dark — no dirty textures, glow trails or ghost arcs. ----
  float a = pix * smoothstep(0.05, 0.45, g) * smoothstep(0.12, 0.24, g);
  gl_FragColor = vec4(col, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function PixelDome({ cell = 7, domeY = -0.15, intensity = 1, className }: PixelDomeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const host: HTMLElement = canvas.parentElement ?? canvas;
    const gl =
      (canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        // keep the last frame on screen when the rAF parks (the dome is mostly
        // static); without this the buffer is cleared after compositing and the
        // idle dome disappears between frames.
        preserveDrawingBuffer: true,
      }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uCell = u("uCell");
    const uDomeY = u("uDomeY");
    const uMouse = u("uMouse");
    const uMouseOn = u("uMouseOn");
    const uTime = u("uTime");
    gl.uniform1f(u("uIntensity"), intensity);
    gl.uniform1f(uDomeY, domeY);

    const DPR_CAP = 2;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * dpr));
      h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    // ---- state ----
    let mx = 0.5;
    let my = 0.5;
    let sx = 0.5;
    let sy = 0.5; // smoothed pointer
    let onTarget = 0;
    let onSmooth = 0;
    let raf = 0;
    let onScreen = true;
    let prev = 0;
    let t = 0; // elapsed seconds, drives the hover flicker

    const draw = () => {
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uCell, Math.max(4, cell * dpr));
      gl.uniform2f(uMouse, sx, sy);
      gl.uniform1f(uMouseOn, onSmooth);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0.016;
      prev = now;
      t += dt;
      const k = 1 - Math.exp(-dt / 0.07); // snappy, "sticky" follow
      sx += (mx - sx) * k;
      sy += (my - sy) * k;
      onSmooth += (onTarget - onSmooth) * k;
      draw();
      // Keep redrawing while the band is on-screen, so the dome is always a
      // fresh, correct frame instead of relying on a parked/stale buffer (which
      // WebGL may clear after compositing, and which dev Strict-Mode remounts
      // can leave wrong). The IntersectionObserver stops the loop off-screen.
      if (!onScreen) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!onScreen || raf !== 0) return;
      prev = 0;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) {
        onTarget = 0;
        wake();
        return;
      }
      mx = (e.clientX - r.left) / r.width;
      my = 1 - (e.clientY - r.top) / r.height;
      onTarget = 1;
      wake();
    };
    const leave = () => {
      onTarget = 0;
      wake();
    };

    const io = new IntersectionObserver(([en]) => {
      onScreen = en?.isIntersecting ?? true;
      if (onScreen) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(canvas);

    resize();
    draw(); // initial static dome

    if (!reduce) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("blur", leave);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", leave);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [cell, domeY, intensity]);

  return <canvas ref={ref} className={className ? `pixel-dome ${className}` : "pixel-dome"} aria-hidden />;
}
