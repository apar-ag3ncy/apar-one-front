"use client";

import { Renderer, Camera, Transform, Geometry, Program, Mesh } from "ogl";
import { useEffect, useRef } from "react";
import { isScrolling } from "@/lib/scroll-state";

/**
 * FooterEmbers — a near face-on BARRED spiral galaxy for the footer, on black
 * space, in the brand's gold + orange palette. A luminous nucleus and central
 * bar feed two grand-design arms studded with bright star knots; a faint field
 * of background stars fills the void. Each point is rendered as a real star —
 * tight bright core + soft halo — with per-star colour temperature, a realistic
 * size spread (many fine, few bright) and a soft twinkle, for a premium, detailed
 * look. ~16k GPU points rotate slowly about the core (rigid pattern rotation, so
 * the arms stay crisp). Additive glow; click-through. Parks off-screen, skips
 * render while scrolling, ~30fps cap, single static frame under reduced-motion.
 */

const CORE = [1.0, 0.9, 0.7]; // #FFE6B3 luminous nucleus / hot stars
const ORANGE = [1.0, 0.62, 0.26]; // #FF9E42 orange bar / inner arms
const GOLD = [0.93, 0.76, 0.5]; // #EDC280 tan-gold outer arms
const AMBER = [0.78, 0.46, 0.2]; // #C77533 deeper amber (cool-side variation)
const SPARK = [1.0, 0.96, 0.86]; // bright white-gold knots

const VERT = `#version 300 es
in vec3 position;
in vec4 random;            // x=size/brightness, y=phase, z=knot/spark, w=temperature
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uDpr;
uniform float uSpin;
uniform float uSize;
out float vRad;
out float vDepth;
out vec4 vRand;
void main(){
  float rad = length(position.xy);
  float ang = atan(position.y, position.x) + uTime * uSpin;  // rigid spin
  vec2 disc = vec2(cos(ang), sin(ang)) * rad;
  float z = position.z + 0.012 * sin(uTime * 0.5 + random.y * 6.2831 + rad * 4.0);
  vec4 mv = modelViewMatrix * vec4(disc, z, 1.0);
  vDepth = -mv.z;
  vRad = rad;
  vRand = random;
  gl_Position = projectionMatrix * mv;
  // realistic size spread: many small, few large (power curve)
  float sizeClass = mix(0.5, 2.5, pow(random.x, 1.8));
  float coreBoost = 1.0 + 1.1 * exp(-rad * 5.5);
  float s = (uSize / max(vDepth, 0.1)) * sizeClass * coreBoost;
  gl_PointSize = clamp(s * uDpr, 1.0, 32.0);
}
`;

const FRAG = `#version 300 es
precision highp float;
in float vRad; in float vDepth; in vec4 vRand;
uniform float uTime;
uniform vec3 uCore; uniform vec3 uOrange; uniform vec3 uGold; uniform vec3 uAmber; uniform vec3 uSpark;
uniform float uOpacity;
out vec4 fragColor;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;   // 0 centre .. 1 edge
  if (d > 1.0) discard;
  // a real star: tight bright core + soft halo (not a flat disc)
  float core = exp(-d * d * 7.0);
  float halo = exp(-d * d * 2.0) * 0.5;
  float inten = core + halo;
  // colour: galactic-radius ramp + per-star temperature variation
  vec3 col = mix(uCore, uOrange, smoothstep(0.08, 0.55, vRad));
  col = mix(col, uGold, smoothstep(0.7, 1.5, vRad));
  col = mix(col, uAmber, (1.0 - vRand.w) * 0.22);   // cooler-side stars -> deeper amber
  col = mix(col, uCore, vRand.w * 0.3);             // hotter-side stars -> white-gold
  col += uCore * exp(-vRad * 5.0) * 0.3;            // nucleus glow
  col = mix(col, uSpark, step(0.97, vRand.z) * 0.75); // bright knots / sparks
  float tw = 0.78 + 0.22 * sin(uTime * 2.0 + vRand.y * 6.2831); // twinkle
  float fade = clamp(1.0 - (vDepth - 3.0) / 7.0, 0.1, 1.0);
  float a = inten * fade * (0.18 + 0.7 * vRand.x) * tw * uOpacity;
  fragColor = vec4(col * a, a); // premultiplied for additive (ONE, ONE)
}
`;

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function FooterEmbers() {
  const ctnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnRef.current;
    if (!ctn) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.backgroundColor = "transparent";
    ctn.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 38, near: 0.1, far: 100 });
    camera.position.set(0, 0, 6);

    const scene = new Transform();

    // ---- barred spiral: nucleus + bar + 2 arms (with knots + fine dust) + field ----
    const COUNT = ctn.offsetWidth < 480 ? 5000 : ctn.offsetWidth < 760 ? 9000 : 16000;
    const TAU = Math.PI * 2;
    const R = 1.8;
    const BAR_ANGLE = 0.42;
    const BAR_LEN = 0.5;
    const WIND = 3.4;
    const position = new Float32Array(COUNT * 3);
    const random = new Float32Array(COUNT * 4); // x=size/bright, y=phase, z=spark, w=temp
    const ca = Math.cos(BAR_ANGLE), sa = Math.sin(BAR_ANGLE);
    for (let i = 0; i < COUNT; i++) {
      let x, y, z, bright;
      let spark = Math.random();
      const temp = Math.random();
      const q = Math.random();
      if (q < 0.12) {
        // luminous nucleus
        const br = Math.pow(Math.random(), 2.6) * 0.16;
        const u = Math.random() * 2 - 1;
        const a = Math.random() * TAU;
        const s = Math.sqrt(Math.max(0, 1 - u * u));
        x = br * s * Math.cos(a);
        y = br * s * Math.sin(a);
        z = br * u * 0.6;
        bright = 0.6 + 0.4 * Math.random();
      } else if (q < 0.28) {
        // central bar
        const t = Math.random() * 2 - 1;
        const along = t * BAR_LEN;
        const across = randn() * 0.055 * (1 - 0.5 * Math.abs(t));
        x = along * ca - across * sa;
        y = along * sa + across * ca;
        z = randn() * 0.025;
        bright = 0.5 + 0.45 * Math.random();
      } else if (q < 0.83) {
        // spiral arm (tight) with occasional bright knots
        const k = i % 2;
        const frac = Math.pow(Math.random(), 0.9);
        const r = BAR_LEN + frac * (1 - BAR_LEN);
        let theta = BAR_ANGLE + k * Math.PI + frac * WIND;
        theta += randn() * (0.08 + 0.2 * (1 - frac)); // arm width, wider near bar
        const rr = r + randn() * 0.016;
        x = Math.cos(theta) * rr;
        y = Math.sin(theta) * rr;
        z = randn() * (0.02 + 0.05 * Math.exp(-frac * 3.0));
        if (Math.random() < 0.12) {
          bright = 0.9 + 0.1 * Math.random(); // HII knot: big + bright
          spark = 0.985 + 0.015 * Math.random();
        } else {
          bright = 0.3 + 0.5 * Math.random();
        }
      } else {
        // faint background field stars
        const r = 0.2 + Math.pow(Math.random(), 0.55) * 1.5;
        const theta = Math.random() * TAU;
        x = Math.cos(theta) * r;
        y = Math.sin(theta) * r;
        z = randn() * 0.1;
        bright = 0.05 + 0.18 * Math.random();
      }
      position[i * 3] = x * R;
      position[i * 3 + 1] = y * R;
      position[i * 3 + 2] = z * R;
      random[i * 4] = bright;
      random[i * 4 + 1] = Math.random();
      random[i * 4 + 2] = spark;
      random[i * 4 + 3] = temp;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: position },
      random: { size: 4, data: random },
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: dpr },
        uSpin: { value: 0.1 },
        uSize: { value: 250 },
        uOpacity: { value: reduce ? 0.55 : 0.95 },
        uCore: { value: CORE },
        uOrange: { value: ORANGE },
        uGold: { value: GOLD },
        uAmber: { value: AMBER },
        uSpark: { value: SPARK },
      },
    });
    program.setBlendFunc(gl.ONE, gl.ONE);

    const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });
    mesh.setParent(scene);
    const TILT = -0.4;
    const ROLL = -0.12;
    mesh.rotation.x = TILT;
    mesh.rotation.z = ROLL;

    let lastW = 0;
    let lastH = 0;
    function applySize() {
      if (!ctn) return;
      const w = ctn.offsetWidth || 1;
      const h = ctn.offsetHeight || 1;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      renderer.setSize(w, h);
      const aspect = w / h;
      camera.position.z = aspect < 0.85 ? 9.2 : aspect < 1.3 ? 7.2 : 6;
      camera.perspective({ aspect });
    }
    applySize();

    let raf = 0;
    let visible = true;
    let mx = 0, my = 0;
    let tmx = 0, tmy = 0;
    let t0 = 0;
    let lastRender = 0;
    const FRAME_MS = 1000 / 30;

    const renderFrame = (tsec: number) => {
      program.uniforms.uTime.value = tsec;
      mx += (tmx - mx) * 0.045;
      my += (tmy - my) * 0.045;
      mesh.rotation.x = TILT + my * 0.12;
      mesh.rotation.z = ROLL + mx * 0.12;
      renderer.render({ scene, camera });
    };

    const loop = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
      if (!t0) t0 = now;
      const tsec = (now - t0) * 0.001;
      program.uniforms.uTime.value = tsec;
      if (isScrolling()) return;
      if (now - lastRender < FRAME_MS) return;
      lastRender = now;
      renderFrame(tsec);
    };

    const wake = () => {
      if (!visible || raf !== 0 || reduce) return;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = ctn.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        tmx = 0;
        tmy = 0;
        return;
      }
      tmx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      tmy = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };

    const io = new IntersectionObserver(([en]) => {
      const now = en?.isIntersecting ?? true;
      if (now && !visible) {
        visible = true;
        wake();
      } else if (!now) {
        visible = false;
      }
    });
    io.observe(gl.canvas);

    const ro = new ResizeObserver(() => {
      applySize();
      if (reduce) renderFrame(0);
    });
    ro.observe(ctn);

    if (reduce) {
      renderFrame(0);
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      io.disconnect();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      if (gl.canvas.parentNode === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={ctnRef} className="footer-fx" aria-hidden />;
}
