"use client";

import { useEffect, useRef } from "react";

/**
 * RippleCanvas — a Lusion-style smooth water-ripple field, rendered in WebGL
 * and tinted entirely in the APAR palette (ink base · red ripples · cream
 * highlights). The ripples are driven by *smoothed* scroll velocity: scrolling
 * pushes concentric waves outward and lifts their amplitude, then everything
 * eases back to a calm ambient drift when you stop — so it reads as a soft,
 * continuous "scroll ripple" rather than a hard reaction.
 *
 * Drop it in as the first child of any dark (`--ink`) section; it absolutely
 * fills its positioned parent and never intercepts pointer events.
 *
 *   <section className="brand-band">
 *     <RippleCanvas />
 *     ...content...
 *   </section>
 *
 * Honours `prefers-reduced-motion` (renders one calm static frame, no loop)
 * and parks the render loop whenever the section is scrolled out of view.
 */
type RippleCanvasProps = {
  /** Overall liveliness of the field, 0.4–1.6. Default 1. */
  intensity?: number;
  className?: string;
};

// APAR brand palette, linearised to 0..1 rgb for the shader.
const INK = [0x1a / 255, 0x17 / 255, 0x14 / 255];
const RED_DEEP = [0xc4 / 255, 0x2a / 255, 0x17 / 255];
const RED = [0xeb / 255, 0x3b / 255, 0x25 / 255];
const CREAM = [0xf4 / 255, 0xed / 255, 0xe2 / 255];

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;          // canvas size in device px
uniform float uTime;         // seconds
uniform float uScroll;       // accumulated scroll phase (advances ripples)
uniform float uVel;          // smoothed scroll speed, 0..1
uniform vec2  uPointer;      // pointer in 0..1, y-up
uniform float uPointerOn;    // 0..1 pointer presence
uniform float uIntensity;

uniform vec3 uInk;
uniform vec3 uRedDeep;
uniform vec3 uRed;
uniform vec3 uCream;

// cheap value-noise for a little organic domain warp
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  // aspect-corrected, centered coords
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5);
  p.x *= uRes.x / uRes.y;

  float t = uTime * 0.6;
  float amp = 0.35 + 0.65 * uIntensity;          // baseline liveliness
  float drive = 0.45 + 1.25 * uVel;              // scroll boosts amplitude

  // organic domain warp so the rings never look mechanical
  vec2 w = p;
  w += 0.16 * vec2(
    noise(p * 2.4 + vec2(t * 0.25, uScroll * 0.3)) - 0.5,
    noise(p * 2.4 - vec2(t * 0.22, uScroll * 0.27)) - 0.5
  );

  // primary concentric ripples emanating from a slowly drifting center,
  // pushed outward by the scroll phase
  vec2 c1 = vec2(0.06 * sin(t * 0.4), -0.04 * cos(t * 0.33));
  float r1 = length(w - c1);
  float wave1 = sin(r1 * 13.0 - t * 1.1 - uScroll * 5.0);

  // a second, off-axis set that interferes with the first
  vec2 c2 = vec2(-0.22, 0.18);
  float r2 = length(w - c2);
  float wave2 = sin(r2 * 9.0 - t * 0.8 - uScroll * 3.0);

  // pointer ripple — a ring that radiates from the cursor
  vec2 pp = uPointer - 0.5; pp.x *= uRes.x / uRes.y;
  float rp = length(w - pp);
  float wavep = sin(rp * 22.0 - uTime * 3.0) * exp(-rp * 2.6) * uPointerOn;

  float field = 0.55 * wave1 + 0.35 * wave2 + 0.9 * wavep;
  field = 0.5 + 0.5 * field * amp * drive;

  // keep the very center calmer (logo / headline legibility), livelier at edges
  float center = smoothstep(0.0, 0.62, length(p));
  field *= mix(0.6, 1.0, center);

  // ramp the wave field through the brand palette
  vec3 col = uInk;
  col = mix(col, uRedDeep, smoothstep(0.30, 0.60, field));
  col = mix(col, uRed,     smoothstep(0.55, 0.84, field));
  col = mix(col, uCream,   smoothstep(0.86, 1.00, field) * 0.5);

  // a soft red bloom near the active scroll ripples
  col += uRed * 0.10 * uVel * smoothstep(0.6, 1.0, field);

  // vignette so the field melts into the surrounding ink background
  float vig = smoothstep(1.05, 0.25, length(p));
  col = mix(uInk, col, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function RippleCanvas({ intensity = 1, className }: RippleCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return; // graceful no-op if WebGL is unavailable

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

    // full-screen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("uRes");
    const uTime = u("uTime");
    const uScroll = u("uScroll");
    const uVel = u("uVel");
    const uPointer = u("uPointer");
    const uPointerOn = u("uPointerOn");
    const uIntensity = u("uIntensity");

    gl.uniform3fv(u("uInk"), INK);
    gl.uniform3fv(u("uRedDeep"), RED_DEEP);
    gl.uniform3fv(u("uRed"), RED);
    gl.uniform3fv(u("uCream"), CREAM);
    gl.uniform1f(uIntensity, intensity);

    // ---- sizing ----
    const DPR_CAP = 1.5;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width * dpr));
      h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // ---- scroll velocity (smoothed) + pointer ----
    let lastScroll = window.scrollY;
    let velAccum = 0; // raw, decays each frame
    let velSmooth = 0; // eased 0..1 fed to the shader
    let scrollPhase = 0;
    const onScroll = () => {
      const y = window.scrollY;
      velAccum += Math.min(Math.abs(y - lastScroll), 140);
      lastScroll = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let pointerX = 0.5;
    let pointerY = 0.5;
    let pointerOn = 0;
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        pointerOn = 0;
        return;
      }
      pointerX = (e.clientX - rect.left) / rect.width;
      pointerY = 1 - (e.clientY - rect.top) / rect.height; // y-up for the shader
      pointerOn = 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    // ---- visibility gating ----
    let onScreen = true;
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0]?.isIntersecting ?? true;
      if (onScreen && !reduce && raf === 0) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    // ---- render loop ----
    let raf = 0;
    let start = 0;
    let prev = 0;
    let pointerOnSmooth = 0;

    const draw = (timeSec: number) => {
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, timeSec);
      gl.uniform1f(uScroll, scrollPhase);
      gl.uniform1f(uVel, velSmooth);
      gl.uniform2f(uPointer, pointerX, pointerY);
      gl.uniform1f(uPointerOn, pointerOnSmooth);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0.016;
      prev = now;
      const timeSec = (now - start) / 1000;

      // ease velocity toward 0; scroll phase advances with current speed
      velAccum *= 0.9;
      const target = Math.min(velAccum / 140, 1);
      velSmooth += (target - velSmooth) * 0.12;
      scrollPhase += velSmooth * dt * 2.4;
      pointerOnSmooth += (pointerOn - pointerOnSmooth) * 0.08;

      draw(timeSec);

      if (onScreen) raf = requestAnimationFrame(frame);
      else raf = 0;
    };

    if (reduce) {
      // one calm, motionless frame
      velSmooth = 0;
      draw(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    // ---- context loss safety ----
    const onLost = (e: Event) => {
      e.preventDefault();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [intensity]);

  return <canvas ref={ref} className={className ? `ripple-canvas ${className}` : "ripple-canvas"} aria-hidden />;
}
