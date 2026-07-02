"use client";

import { useEffect, useRef } from "react";

/**
 * PixelTrail - the hero's pixel-dome language promoted to a SITE-WIDE cursor
 * effect: a full-viewport grid of tiny rounded pixel-tiles, transparent at rest,
 * that light up in light orange-red wherever the pointer goes. A short ring of
 * recent pointer samples gives a small disappearing trail, so the pixelation
 * reads as a living cluster chasing the cursor across every page's negative
 * space (the same tile texture + brand-red palette as <PixelDome>).
 *
 * Click-through fixed overlay under the nav (z-50 < z-120). Parks the render
 * loop the moment the trail has fully faded (zero cost at rest) and wakes on the
 * next pointer move. Skipped only under reduced-motion and on coarse-pointer
 * (touch) devices - it renders unconditionally on any pointer device, exactly
 * like the signature hero <PixelDome> (NOT gated behind isLowPowerDevice: a
 * single parked fragment pass is cheap, and the whole point is that it shows up
 * everywhere, including modest 4-core machines where the low-power gate would
 * have silently dropped it).
 */

// A soft blob that chases an eased "head" position, leaving a long, gently WAVING
// tail of recent (also eased + wave-displaced) positions. NODES total = current
// head + recent history; each is drawn as a round splat whose radius eases from
// a bulgy head to a softer tail, so it reads as a creative comet, not a thin
// ribbon. More nodes = a longer tail.
const NODES = 38;

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos,0.0,1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;         // canvas size (device px)
uniform float uCell;        // cell size (device px)
uniform float uTime;        // seconds, drives the per-tile shimmer
uniform vec3  uPts[${NODES}]; // xy = eased position uv (0..1, bottom-up), z = age (s)

const int   COUNT = ${NODES};
const float LIFE  = 0.95;   // trail lifetime (s) - a long, slow-dissolving tail
const float SIG_H = 0.0515; // head splat radius (aspect uv) - bulgy but ~8-10% smaller
const float SIG_T = 0.030;  // tail splat radius -> gentle comet taper, never a thin line

// The trail is #F73923 THROUGHOUT - the exact brand red owns the centre and most
// of the body; only the faint outer rim lifts to a slightly-lighter tint of the
// same hue as it fades. One consistent colour, dominant, not a pale wash.
const vec3 C_MID = vec3(0.969, 0.224, 0.137);  // #F73923 - dominates the whole blob
const vec3 C_LT1 = vec3(1.000, 0.486, 0.353);  // #FF7C5A - light tint, inner rim
const vec3 C_LT2 = vec3(1.000, 0.660, 0.560);  // #FFA88F - lightest, only the faint outer rim

// cheap per-cell hash -> 0..1
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main(){
  float aspect = uRes.x / uRes.y;

  // ---- sample the field at the cell CENTRE (not per fragment) -> pixelation ----
  vec2 cellId = floor(gl_FragCoord.xy / uCell);
  vec2 uv = ((cellId + 0.5) * uCell) / uRes;

  // ---- union (max) of round splats at each recent position, faded by age. The
  //      radius eases from a bulgy head to a softer tail (comet), and lifeAt
  //      remembers where along the length the winning splat sits so the colour +
  //      alpha can grade down the tail. ----
  float inten = 0.0;
  float lifeAt = 0.0;
  for (int i = 0; i < COUNT; i++) {
    vec3 A = uPts[i];
    float lf = clamp(1.0 - A.z / LIFE, 0.0, 1.0);
    lf *= lf;                                          // eased fade (intensity)
    // radius tapers by POSITION along the trail (node index), not age, so the
    // comet keeps a round bulgy head + slim tail at ANY cursor speed (age-based
    // taper let fast drags stay fat).
    float ti = float(i) / float(COUNT - 1);            // 0 head -> 1 tail
    float radius = mix(SIG_H, SIG_T, ti * ti);         // hold the head, then taper to a slim tip
    vec2 d = (uv - A.xy) * vec2(aspect, 1.0);
    float g = exp(-dot(d, d) / (2.0 * radius * radius)) * lf;
    if (g > inten) { inten = g; lifeAt = lf; }
  }

  if (inten < 0.03) discard;                           // empty negative space -> transparent

  // subtle per-tile shimmer so the cluster feels alive, not a flat stamp
  float rnd = hash21(cellId + 0.5);
  float tw  = sin(uTime * (4.0 + rnd * 6.0) + rnd * 40.0) * 0.5 + 0.5;
  inten *= 0.90 + 0.10 * tw;

  // colour by radial/field intensity: #F73923 owns the centre AND most of the
  //  body (kicks in early, by inten~0.32), so the blob reads solidly #F73923; only
  //  the faint outer rim (low intensity) lifts to a slightly-lighter tint.
  vec3 col = mix(C_LT2, C_LT1, smoothstep(0.03, 0.14, inten));
  col = mix(col, C_MID, smoothstep(0.14, 0.32, inten));

  // ---- rounded-tile texture with hairline seam grooves (matches <PixelDome>):
  //      the seams drop to zero alpha so the background shows through the grid,
  //      selling the "pixels" instead of a smooth blob ----
  vec2 local = fract(gl_FragCoord.xy / uCell) - 0.5;
  float cr = 0.18;                                     // soft squircle corners
  vec2 qd = abs(local) - vec2(0.5 - cr);
  float box = length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0) - cr; // rounded-box SDF
  float seam = smoothstep(0.0, 0.12, box);
  col *= 1.0 - 0.25 * seam;

  // keep the light outer halo visible (low floor) so it's SEEN as it dissolves,
  // while the whole trail slowly disappears down its length (lifeAt).
  float a = smoothstep(0.025, 0.32, inten) * (1.0 - seam) * (0.34 + 0.66 * lifeAt);
  a = min(a, 0.95);
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

export function PixelTrail({ cell = 22 }: { cell?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(pointer: coarse)").matches) return; // no cursor to trail on touch

    const canvas = ref.current;
    if (!canvas) return;
    const gl =
      (canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return;

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
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // normal alpha -> shows over cream AND dark
    gl.clearColor(0, 0, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uCell = u("uCell");
    const uTime = u("uTime");
    const uPts = u("uPts");

    const DPR_CAP = 1.5; // the trail is soft; past 1.5x is wasted GPU
    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      w = Math.max(1, Math.round(window.innerWidth * dpr));
      h = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    // ---- trail state ----
    const LIFE = 0.95; // must mirror the shader's LIFE
    const TAU = 0.05; // head follow time-constant (s) - low = butter-smooth chase
    const MIN_STEP = 0.013; // uv distance between recorded trail nodes (even, dense = smooth)
    const HIST = NODES - 1; // history nodes behind the head
    // the tail sways perpendicular to its travel; the sway ramps in over the first
    // stretch (so mid-tail waves where it's actually visible) and only engages
    // while the cursor is moving (still at rest).
    const WAVE_AMP = 0.03; // peak lateral sway (uv) - gentle S-curve, won't fold on itself
    const WAVE_LEN = 0.3; // phase (radians) per node -> ~1.5 graceful wavelengths on the tail
    const WAVE_SPD = 2.6; // radians/sec the wave travels down the tail

    const data = new Float32Array(NODES * 3); // (x, y, age) per node, head->tail
    const rx = new Float32Array(NODES); // raw (un-swayed) node x, head->tail
    const ry = new Float32Array(NODES); // raw node y
    const rage = new Float32Array(NODES); // node age (s)
    // history of visited head positions, newest first: {x, y, birth}
    const hist: { x: number; y: number; b: number }[] = [];

    let tx = 0.5, ty = 0.5; // target (real cursor) uv
    let hx = 0.5, hy = 0.5; // eased head uv
    let phx = 0.5, phy = 0.5; // previous-frame head (for speed)
    let flow = 0; // 0 at rest -> 1 moving; scales the wave amplitude
    let lsx = 0.5, lsy = 0.5; // last recorded sample (distance gating)
    let active = false; // nothing drawn until the first real pointer move
    let t = 0; // elapsed seconds
    let prev = 0;
    let lastMove = -100; // t of the last pointer move - drives idle parking
    let raf = 0;

    const draw = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      const aspect = w / h;
      // 1) raw ordered nodes: head (age 0), then history, padded with the oldest
      rx[0] = hx;
      ry[0] = hy;
      rage[0] = 0;
      const ox = hist.length ? hist[hist.length - 1].x : hx;
      const oy = hist.length ? hist[hist.length - 1].y : hy;
      for (let j = 0; j < HIST; j++) {
        const i = j + 1;
        if (j < hist.length) {
          rx[i] = hist[j].x;
          ry[i] = hist[j].y;
          rage[i] = t - hist[j].b;
        } else {
          rx[i] = ox;
          ry[i] = oy;
          rage[i] = LIFE * 2; // fully expired -> no contribution
        }
      }
      // 2) upload, swaying the tail perpendicular to its local direction. The head
      //    (i=0) never sways, so it stays anchored to the cursor.
      data[0] = rx[0];
      data[1] = ry[0];
      data[2] = rage[0];
      for (let i = 1; i < NODES; i++) {
        const a = i - 1;
        const b = i + 1 < NODES ? i + 1 : i;
        const vxp = (rx[a] - rx[b]) * aspect; // tangent in visual (square) space
        const vyp = ry[a] - ry[b];
        const L = Math.hypot(vxp, vyp) || 1;
        const ux = -(vyp / L) / aspect; // unit perpendicular, back in uv
        const uy = vxp / L;
        const prog = i / (NODES - 1); // 0 head -> 1 tail
        // ramp the sway in over the first ~55% (smoothstep), hold after -> the
        // visible mid-tail waves, the head stays anchored; scaled by movement.
        const p = Math.max(0, Math.min(1, (prog - 0.06) / 0.5));
        const amp = WAVE_AMP * (p * p * (3 - 2 * p)) * flow;
        const s = Math.sin(i * WAVE_LEN + t * WAVE_SPD) * amp;
        data[i * 3] = rx[i] + ux * s;
        data[i * 3 + 1] = ry[i] + uy * s;
        data[i * 3 + 2] = rage[i];
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uCell, Math.max(4, cell * dpr));
      gl.uniform1f(uTime, t);
      gl.uniform3fv(uPts, data);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0.016;
      prev = now;
      t += dt;

      // ease the head toward the cursor (frame-rate independent) -> smooth chase
      const k = 1 - Math.exp(-dt / TAU);
      hx += (tx - hx) * k;
      hy += (ty - hy) * k;

      // smoothed head speed (uv/s) -> the wave only flows while the cursor moves
      const inst = Math.hypot(hx - phx, hy - phy) / Math.max(dt, 1e-3);
      phx = hx;
      phy = hy;
      const flowTarget = Math.min(inst / 0.5, 1); // ~0.5 uv/s saturates the sway
      flow += (flowTarget - flow) * (1 - Math.exp(-dt / 0.08));

      // drop a tail node once the head has travelled far enough (even spacing)
      const ddx = hx - lsx;
      const ddy = hy - lsy;
      if (ddx * ddx + ddy * ddy > MIN_STEP * MIN_STEP) {
        hist.unshift({ x: hx, y: hy, b: t });
        if (hist.length > HIST) hist.pop();
        lsx = hx;
        lsy = hy;
      }
      // retire nodes older than the trail lifetime so the tail dissolves smoothly
      while (hist.length && t - hist[hist.length - 1].b > LIFE) hist.pop();

      draw();

      // park once the head has settled AND the tail has fully dissolved
      const settled = Math.abs(tx - hx) < 0.0015 && Math.abs(ty - hy) < 0.0015;
      if (t - lastMove > LIFE + 0.15 && hist.length === 0 && settled) {
        raf = 0;
        canvas.style.visibility = "hidden";
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (raf !== 0) return;
      canvas.style.visibility = "visible";
      prev = 0;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX * dpr) / w;
      ty = 1 - (e.clientY * dpr) / h;
      if (!active) {
        // snap the head to the first sighting so it doesn't streak in from center
        active = true;
        hx = tx;
        hy = ty;
        phx = tx;
        phy = ty;
        lsx = tx;
        lsy = ty;
      }
      lastMove = t;
      wake();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [cell]);

  return (
    <div className="pixel-trail" aria-hidden>
      <canvas ref={ref} />
    </div>
  );
}
