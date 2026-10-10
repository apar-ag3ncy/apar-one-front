"use client";

import { useEffect, useRef, useState } from "react";
import { BoxTracker, Comet, LIFE, PopTexture, TILE_GLSL, snapToTiles, tilePitch } from "@/lib/comet";

/**
 * PixelTrail - the beam's cursor comet, SITE-WIDE. The very same comet that
 * lights the hero/footer beam's tiles (lib/comet.ts: eased head, evenly laid
 * dissolving tail, the same splat sizes) drawn on a full-viewport grid of the
 * beam's own tiles (landscape 3:2, TILE_CELL css px tall, hairline grooves,
 * rounded corners - identical pitch, snapped to whole device pixels) in the
 * very colour the popped tiles have on the landing beam, with the beam's own
 * hairline grooves (the same red a touch darker, never a hole).
 *
 * Click-through fixed overlay under the nav (z-50 < z-120). Over a beam band
 * (html[data-on-dome], set by <PixelDome>) the beam's own tiles are the
 * cursor: this canvas fades out (CSS) and skips its work. The head dissolves
 * once the pointer rests (so it never sits over copy the reader has stopped
 * on), and the loop parks the moment everything has dissolved - zero cost at
 * rest. Skipped under reduced-motion and on coarse-pointer (touch) devices.
 */

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos,0.0,1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;        // canvas size (device px)
uniform vec2  uCell;       // tile pitch x/y (device px, whole numbers) - landscape 3:2
uniform float uSeam;       // groove width (device px, a whole number)
uniform float uRadius;     // corner radius of the tile body (device px, a whole number)
uniform sampler2D uPop;    // the comet, ONE texel per tile: how lit that tile is (0..1)
uniform vec2  uGrid;       // tiles across / down (the texture's size)
uniform float uTime;       // seconds, for the twinkle
${TILE_GLSL}
void main(){
  // the grid is anchored at the viewport's TOP-left, like the beam's
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); // top-down device px
  vec2 cellId = floor(fc / uCell);
  float pop = texture2D(uPop, (cellId + 0.5) / uGrid).r;
  if (pop <= 0.0) discard;                              // untouched tile -> transparent
  pop *= twinkle(cellId, uTime);
  // the beam's tile texture, exactly: grooves, cut corners and crossings are
  // the same red a touch darker (never a hole), so the tiles almost touch
  vec3 tm = tileMask(fc, uCell, uSeam, uRadius);
  float seam = max(max(tm.x * 0.38, tm.y * 0.55), tm.z * 0.8);
  gl_FragColor = vec4(cometGrade(pop) * (1.0 - 0.22 * seam), pow(pop, 0.85) * 0.88);
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

export function PixelTrail() {
  const ref = useRef<HTMLCanvasElement>(null);

  // The WebGL context + shader compile are deferred to the first pointer move:
  // the trail is invisible until the cursor moves anyway, and taking that work
  // out of the page's load storm (hydration + the hero dome + the orb compiling
  // at once) is what lets the hero's entrance start sooner and run smoother.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(pointer: coarse)").matches) return;
    const arm = () => setArmed(true);
    window.addEventListener("pointermove", arm, { once: true, passive: true });
    return () => window.removeEventListener("pointermove", arm);
  }, []);

  useEffect(() => {
    if (!armed) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (matchMedia("(pointer: coarse)").matches) return; // no cursor to trail on touch

    const canvas = ref.current;
    if (!canvas) return;
    // Every frame is a full pass (one texture read per fragment, untouched
    // tiles discarded) over a fresh transparent buffer - no preserved drawing
    // buffer, so the compositor can swap the canvas like any other layer.
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

    // No GL blending: (colour, alpha) is written straight into the transparent
    // canvas and the compositor does the one straight-alpha blend over the page.
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uCell = u("uCell");
    const uSeam = u("uSeam");
    const uRadius = u("uRadius");
    const uGrid = u("uGrid");
    const uTime = u("uTime");
    const pop = new PopTexture(gl);
    gl.uniform1i(u("uPop"), 0);

    // Native device pixels (up to 3x) so the tiles map 1:1 onto the screen's
    // pixels, exactly like the beam's.
    const DPR_CAP = 3;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let cellX = 30;
    let cellY = 20;
    let seamPx = 1;
    let radiusPx = 4;
    const comet = new Comet();
    const boxes = new BoxTracker();
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      w = Math.max(1, Math.round(window.innerWidth * dpr));
      h = Math.max(1, Math.round(window.innerHeight * dpr));
      const p = tilePitch(dpr);
      cellX = p.cellX;
      cellY = p.cellY;
      seamPx = p.seam;
      radiusPx = p.radius;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      pop.resize(gl, w, h, cellX, cellY);
      // lock the CSS box to the backing store so nothing is resampled
      canvas.style.width = `${w / dpr}px`;
      canvas.style.height = `${h / dpr}px`;
      boxes.reset();
    };

    // ---- state ----
    const REST = 0.35; // s after the last move before the head starts to dissolve
    let active = false; // the head has been placed (it snaps to the first sighting)
    let raf = 0;
    let prev = 0;
    let t = 0; // elapsed seconds
    let lastMoveT = -100; // t at the last pointer move
    let blanked = false; // hidden over a beam band and already cleared
    const headAge = () => Math.max(0, t - lastMoveT - REST);

    const setUniforms = () => {
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uCell, cellX, cellY);
      gl.uniform1f(uSeam, seamPx);
      gl.uniform1f(uRadius, radiusPx);
      gl.uniform2f(uGrid, pop.gridC, pop.gridR);
      gl.uniform1f(uTime, t);
    };
    // A frame re-evaluates just the tiles in a box around the live nodes
    // (padded by a splat's reach), unioned with the previous frame's box so
    // tiles that just went dark are zeroed too - the tile texture is therefore
    // always right everywhere - then draws the whole canvas from it.
    const drawFrame = () => {
      comet.pack(t, headAge());
      const box = boxes.next(comet.liveBox(), w, h, cellX, cellY);
      if (box) {
        const s = snapToTiles(box, w, h, cellX, cellY);
        if (s) pop.upload(gl, comet, s, w, h, cellX, cellY);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      setUniforms();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0.016;
      prev = now;
      t += dt;
      // Over a beam or photo its own tiles are the cursor and this canvas is
      // faded out by CSS: keep the head on the pointer, drop the tail (so it
      // restarts fresh off the band, never trailing back over the beam), blank
      // once, and park - there is nothing to draw.
      if (document.documentElement.dataset.onDome === "1" || document.documentElement.dataset.onImage === "1") {
        comet.snap(comet.tx, comet.ty);
        comet.clearTail();
        if (!blanked) {
          // zero what was lit, then one transparent frame
          comet.pack(t, LIFE * 2);
          const box = boxes.next(null, w, h, cellX, cellY);
          if (box) {
            const s = snapToTiles(box, w, h, cellX, cellY);
            if (s) pop.upload(gl, comet, s, w, h, cellX, cellY);
          }
          gl.clear(gl.COLOR_BUFFER_BIT);
          blanked = true;
        }
        raf = 0;
        return;
      }
      blanked = false;
      comet.chase(dt, t); // ease the head toward the pointer, lay the tail
      comet.retire(t);
      drawFrame();
      // park once the head has settled and everything (head included) has dissolved
      if (comet.converged && comet.hist.length === 0 && headAge() >= LIFE) {
        raf = 0;
        canvas.style.visibility = "hidden"; // no full-screen layer to composite at rest
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
      const x = (e.clientX * dpr) / w;
      const y = 1 - (e.clientY * dpr) / h;
      comet.target(x, y);
      // snap the head to the first sighting (and after a full dissolve) so it
      // never streaks in from where it last was
      if (!active || headAge() >= LIFE) {
        active = true;
        comet.snap(x, y);
        comet.clearTail();
      }
      lastMoveT = t;
      wake();
    };
    const blur = () => {
      active = false; // the pointer may be anywhere when it comes back
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", blur);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", blur);
      pop.dispose(gl);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [armed]);

  return (
    <div className="pixel-trail" aria-hidden>
      <canvas ref={ref} />
    </div>
  );
}
