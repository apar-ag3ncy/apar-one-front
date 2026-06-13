"use client";

import { useEffect, useRef } from "react";

/**
 * PixelDome — an Algolia-style hero beam: ONE single curved strip of light,
 * rendered as thousands of tiny rounded-rectangle tiles on a strict, perfectly
 * aligned grid (tiles almost touching, subtle corner radius). The beam is
 * brightest at the top-centre crown, dimmer toward the sides, and dissolves into
 * black above and below via opacity (tiles never resize). The reference image's
 * shades hue-rotated to orange: pale peach crown, vivid orange band, warm dark
 * fades, over a near-black base.
 *
 * Hovering lifts a soft, premium shimmer around the cursor. Click-through;
 * pointer is read from `window` (bounds-checked) so hover works over the
 * overlaid content. Parks the loop when idle/offscreen.
 */
type PixelDomeProps = {
  /** CSS px size of each pixel cell. ~20px matches the Algolia reference pitch
   *  (~74 columns across a 1440px band -> thousands of tiles that read as one
   *  smooth gradient from a distance). Default 20. */
  cell?: number;
  /** ellipse centre of the arc, bottom-up; small/negative (below the frame) so
   *  the beam sweeps the full width with its crown near the top. Default -0.15. */
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

// the reference image's measured shades hue-rotated to the BRAND RED #EE3A24
// (S/L preserved, exactly like the Algolia original's tint/shade ladder):
//   pale lavender (192,190,236) -> pale rose (236,196,190) crest,
//   electric blue (58,55,235)  -> brand red (238,58,36) glow,
//   fades = the vivid hue scaled toward the warm near-black base.
const vec3 C_LIGHT = vec3(0.925, 0.770, 0.745);      // pale rose — thin bright crest
const vec3 C_HOT   = vec3(0.933, 0.227, 0.141);      // brand red #EE3A24 — broad glow
const vec3 C_MID   = vec3(0.513, 0.125, 0.078);      // C_HOT * 0.55 — fade, same hue
const vec3 C_DARK  = vec3(0.084, 0.020, 0.013);      // C_HOT * 0.09 — fade end, same hue

// cheap per-cell hash -> 0..1
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

// ---- ONE single curved beam (the Algolia arc): an ellipse whose centre sits
//      below the frame, so the bright strip sweeps the full width — apex at the
//      top-centre crown, sides running off the edges. Crisp-ish dissolve above
//      the strip, long dissolve below it; a falloff ALONG the arc keeps it
//      brightest at the crown and dimmer toward the sides.
//      uDomeY = ellipse centre (bottom-up; negative = below the frame). ----
// returns vec2(glow, t): t is the signed distance across the strip
// (positive = outer/top side, negative = inner/below side)
vec2 beamAt(vec2 uv, float aspect){
  // flatten the arc on narrow/tall bands (mobile) so it still reads as a wide
  // sweep instead of bunching into a steep dome; desktop (aspect >= ~1.55)
  // keeps the reference curvature.
  float rx = 0.62 * max(1.0, 1.55 / aspect);
  float ry = 0.98;                       // vertical radius (uv)
  vec2 d = vec2((uv.x - 0.5) / rx, (uv.y - uDomeY) / ry);
  float dist = length(d);
  float t = dist - 0.92;                                 // signed distance across the strip
  float w = (t > 0.0) ? 0.16 : 0.42;                     // soft (but tight) halo above; long mist-like dissolve below
  float glow = exp(-(t * t) / (w * w)) * uIntensity;
  float crown = clamp(d.y / max(dist, 0.001), 0.0, 1.0); // 1 at the crown -> 0 at the sides
  return vec2(glow * mix(0.55, 1.0, crown), t);
}

void main(){
  float aspect = uRes.x / uRes.y;

  // ---- grid cell this fragment belongs to ----
  vec2 cellId = floor(gl_FragCoord.xy / uCell);
  vec2 cellCenter = (cellId + 0.5) * uCell;
  vec2 uvC = cellCenter / uRes;             // per-cell sample (tile colour stepping)
  vec2 uvF = gl_FragCoord.xy / uRes;        // per-fragment sample (soft in-tile shading)

  // ---- hover: a small, in-hue "pop" that follows the cursor. The lit tiles get
  //      a touch brighter and warmer — they must NOT trend to the pale/white
  //      crest colour (that read as ugly blown-out white blocks). So the hover
  //      lifts only the tile ALPHA here, and a warm RED pop is added to the
  //      final colour below; it never feeds the colour ramp's white crest.
  //      Radius kept tight (sigma 0.06) so the cursor's reach is felt but
  //      contained — present, not a bloom. ----
  float md = length((uvC - uMouse) * vec2(aspect, 1.0));
  float near = exp(-(md * md) / (2.0 * 0.06 * 0.06)) * uMouseOn;
  float rnd = hash21(cellId + 0.5);
  float tw  = sin(uTime * (4.0 + rnd * 6.0) + rnd * 38.0) * 0.5 + 0.5;
  float hov = near * (0.20 + 0.12 * tw);

  // per-tile glow drives opacity (stable across each tile); the colour blends in
  // a little of the per-fragment glow so each tile carries the reference's faint
  // internal gradient instead of being a flat chip.
  vec2 bC = beamAt(uvC, aspect);
  vec2 bF = beamAt(uvF, aspect);
  // hover lifts the tile ALPHA (so the popped patch emerges) but NOT the colour
  // ramp — the warm pop is added straight to the final colour below, keeping it
  // in-hue (no white crest).
  float gA   = clamp(bC.x + hov, 0.0, 1.3);
  float gCol = clamp(mix(bC.x, bF.x, 0.30), 0.0, 1.3);

  // ---- tile texture, matched to the reference zooms: tiles almost touch; the
  //      seams are slightly DARKER GROOVES in the same colour (never holes), and
  //      where four rounded corners meet the groove deepens into the small dark
  //      4-pointed star. ----
  vec2 local = fract(gl_FragCoord.xy / uCell) - 0.5;
  float hs = 0.485;                                     // tiles all but touch — hairline seam
  float cr = 0.17;                                      // soft squircle corners
  vec2 qd = abs(local) - vec2(hs - cr);
  float box = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - cr; // rounded-box SDF
  float seam = smoothstep(0.0, 0.105, box);             // 0 in tile -> 1 deep in the junction star

  // ---- band mapping measured from the reference image: both sides stay
  //      saturated (no grey rows). Above the bright zone: warm dark ->
  //      orange-brown -> soft rise into the pale orange. Below it: the more
  //      VIVID stripe first, then the long saturated fall to near-black. ----
  vec3 above = mix(C_DARK, C_MID, smoothstep(0.05, 0.35, gCol));
  above = mix(above, mix(C_HOT, C_LIGHT, 0.5), smoothstep(0.35, 0.70, gCol));
  above = mix(above, C_LIGHT, smoothstep(0.85, 1.05, gCol));     // pale only at the very crest -> THIN bright arc

  vec3 below = mix(C_DARK, C_MID, smoothstep(0.04, 0.30, gCol));
  below = mix(below, C_HOT, smoothstep(0.30, 0.62, gCol));       // broad vivid glow under the thin arc
  below = mix(below, C_LIGHT, smoothstep(0.88, 1.06, gCol));     // joins the crest

  float belowSel = clamp(-bC.y * 30.0, 0.0, 1.0);                // 1 below the centreline
  vec3 col = mix(above, below, belowSel);

  // the reference's dark background is not flat black: the tile grid stays
  // faintly visible everywhere. Blend the dark tiles up to a dim warm base so
  // the texture (and its junction stars) barely shows in the dark.
  col = mix(vec3(0.180, 0.040, 0.026), col, smoothstep(0.03, 0.18, gCol));

  // ---- hover pop: add a warm RED lift (red-weighted so it brightens in-hue and
  //      never trends to white). A "lil pop" on the tiles under the cursor. ----
  col += hov * vec3(0.42, 0.10, 0.06);

  col *= 1.0 - 0.22 * seam;                             // hairline grooves + soft junction dots — gaps barely read, like the reference

  // ---- emergence from darkness: the beam opacity curve plus a gentle low-glow
  //      gate, over a faint alpha floor that keeps the grid texture barely
  //      visible across the dark (like the reference), never fully black. ----
  float aBeam = smoothstep(0.05, 0.42, gA) * smoothstep(0.035, 0.13, gA);
  float a = max(aBeam, 0.085);
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

export function PixelDome({ cell = 20, domeY = -0.15, intensity = 1, className }: PixelDomeProps) {
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
    gl.clearColor(0, 0, 0, 0); // transparent — every frame starts clean

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
    // canvas rect cached at resize time (the canvas fills its inset:0 host, so
    // it only moves via scroll — onMove offsets by the scroll delta instead of
    // re-measuring per pointer event)
    let rl = 0;
    let rt = 0;
    let rw = 0;
    let rh = 0;
    let rsy = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const rect = canvas.getBoundingClientRect();
      rl = rect.left;
      rt = rect.top;
      rw = rect.width;
      rh = rect.height;
      rsy = window.scrollY;
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
      gl.clear(gl.COLOR_BUFFER_BIT); // reset to transparent so frames never accumulate (no ghost trails)
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
      // Park the loop when settled (no hover, smoothing converged) — the dome is
      // static at rest and the compositor keeps the last frame on screen, so
      // an idle band costs nothing. Pointer movement wakes it back up.
      const settled =
        onTarget === 0 && onSmooth < 0.004 && Math.abs(mx - sx) < 0.002 && Math.abs(my - sy) < 0.002;
      if (!onScreen || settled) {
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
      const top = rt - (window.scrollY - rsy);
      const inside =
        rw > 0 && rh > 0 && e.clientX >= rl && e.clientX <= rl + rw && e.clientY >= top && e.clientY <= top + rh;
      if (!inside) {
        if (onTarget !== 0 || onSmooth > 0.004) {
          onTarget = 0;
          wake();
        }
        return;
      }
      mx = (e.clientX - rl) / rw;
      my = 1 - (e.clientY - top) / rh;
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
