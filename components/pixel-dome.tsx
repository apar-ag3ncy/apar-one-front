"use client";

import { useEffect, useRef } from "react";
import { BoxTracker, Comet, LIFE, PopTexture, TILE_CELL, TILE_GLSL, snapToTiles, tilePitch } from "@/lib/comet";

/**
 * PixelDome - an Algolia-style hero beam: ONE single curved strip of light,
 * rendered as thousands of tiny rounded-rectangle tiles on a strict, perfectly
 * aligned grid (tiles almost touching, subtle corner radius). The beam is
 * brightest at the top-centre crown, dimmer toward the sides, and dissolves into
 * black above and below via opacity (tiles never resize). The reference image's
 * shades hue-rotated to orange: pale peach crown, vivid orange band, warm dark
 * fades, over a near-black base.
 *
 * Hovering runs the cursor comet ON the beam's grid: whole tiles pop bright
 * brand-red under an eased head and along a dissolving tail (the site-wide
 * <PixelTrail>'s behaviour, traced on these tiles) - and while the pointer is
 * over a band the separate trail canvas hides, so one pixel language shows at
 * a time. Click-through; pointer is read from `window` (bounds-checked) so
 * hover works over the overlaid content. Parks the loop when idle/offscreen.
 */
type PixelDomeProps = {
  /** CSS px HEIGHT of a tile (its width is 1.5x - a landscape 3:2 tile with
   *  rounded corners). 10px -> 96 columns across a 1440px band: from a
   *  normal distance the beam reads as one seamless gradient, and only up
   *  close does it resolve into its tiles. (Pitch, groove and corner radius
   *  are snapped to WHOLE device pixels at render time, so the grid is exact
   *  on every display.) Default 10. */
  cell?: number;
  /** Vertical framing adjustment around the default circular arc (-0.15). */
  domeY?: number;
  /** overall glow strength. Default 1. */
  intensity?: number;
  className?: string;
};

// The cursor comet on the beam's own grid is the ONE comet defined in
// lib/comet.ts (shared with the site-wide <PixelTrail>): an eased head, an
// evenly laid tail, every node dissolving over LIFE - evaluated once per tile
// on the CPU and handed to the shader as a one-byte-per-tile texture.

// Which beam bands the pointer is over right now (hero, footer). While it is
// over one, the site-wide pixel trail hides (CSS on html[data-on-dome]) - the
// beam's own tiles are the cursor there, so two pixel grids never overlap.
let domeHovered = 0;
function setDomeHover(delta: number) {
  domeHovered = Math.max(0, domeHovered + delta);
  if (domeHovered > 0) document.documentElement.dataset.onDome = "1";
  else delete document.documentElement.dataset.onDome;
}

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
uniform float uDomeY;      // dome centre y (0..1, bottom-up)
uniform float uIntensity;
uniform sampler2D uPop;  // cursor comet, ONE texel per tile: how lit that tile is (0..1)
uniform vec2  uGrid;       // tiles across / down (the texture's size)
uniform float uTime;       // seconds, for the twinkle
uniform vec2 uHead;        // eased pointer, bottom-up UV
uniform float uRide;       // movement impulse, smoothly settles to zero

// the reference image's measured shades hue-rotated to the BRAND RED #EE3926
// (S/L preserved, exactly like the Algolia original's tint/shade ladder):
//   pale lavender (192,190,236) -> pale rose (236,196,190) crest,
//   electric blue (58,55,235)  -> brand red #EE3926 (238,57,38) glow,
//   fades = the vivid hue scaled toward the warm near-black base.
const vec3 C_LIGHT = vec3(0.925, 0.770, 0.745);      // pale rose - thin bright crest
const vec3 C_HOT   = vec3(0.9333, 0.2235, 0.1490);   // brand red #EE3926 - the beam colour
const vec3 C_MID   = vec3(0.6720, 0.1609, 0.1073);   // #EE3926 * 0.72 - body stays a true #EE3926 red, never maroon
const vec3 C_DARK  = vec3(0.0840, 0.0201, 0.0134);   // #EE3926 * 0.09 - fade end, same hue

${TILE_GLSL}

// A circle in screen space, never a stretched UV ellipse. The desktop
// chord joins the lower corners; the hidden remainder sits below the viewport.
vec2 beamAt(vec2 uv, float aspect){
  float halfWidth = aspect * 0.5;
  float mobile = 1.0 - smoothstep(0.8, 1.3, aspect);
  float edgeY = mobile * 0.43;
  float rise = min(0.78, halfWidth * 0.98);
  float radius = (halfWidth * halfWidth + rise * rise) / (2.0 * rise);
  float centreY = edgeY + rise - radius + (uDomeY + 0.15) * 0.2;
  vec2 d = vec2((uv.x - 0.5) * aspect, uv.y - centreY);
  float dist = length(d);
  float t = dist - radius;
  float width = mix(0.15, 0.104, mobile);
  float glow = exp(-(t * t) / (width * width)) * uIntensity;
  glow *= mix(1.0, smoothstep(-0.015, 0.065, d.y), mobile);
  return vec2(glow, t);
}

// The underlying beam colour belongs to a tile, even while its face lifts.
vec4 surfaceAt(vec2 cellId, float pop){
  float aspect = uRes.x / uRes.y;
  vec2 centre = (cellId + 0.5) * uCell;
  vec2 uvC = vec2(centre.x, uRes.y - centre.y) / uRes;
  float hov = pop * 0.3;

  // ONE sample per tile: every fragment of a tile gets exactly the same colour
  // and alpha, so each tile is a flat, uniform chip. (An earlier in-tile
  // gradient made every tile a tiny blur up close.) The gradient itself is
  // continuous, so at a 10px pitch the stepping between neighbours is below
  // what the eye resolves at reading distance - seamless from afar, a clean
  // grid up close.
  vec2 bC = beamAt(uvC, aspect);
  // hover lifts the tile ALPHA (so the popped patch emerges) but NOT the colour
  // ramp - the warm pop is added straight to the final colour below, keeping it
  // in-hue (no white crest).
  float gA   = clamp(bC.x + hov, 0.0, 1.3);
  float gCol = clamp(bC.x, 0.0, 1.3);

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
  col = mix(vec3(0.1867, 0.0447, 0.0298), col, smoothstep(0.03, 0.18, gCol)); // #EE3926 * 0.20 - dim base is a true shade of the brand red

  // ---- hover pop: blend the tiles under the cursor toward a bright brand-red
  //      (green/blue kept low so it can NEVER trend to the pale/white crest that
  //      read as ugly blown-out blocks). The tiles just "pop" a little warmer and
  //      brighter - in-hue, contained, enough to feel the cursor, not a bloom. ----
  // Keep the crest luminous while graded red tiles rise in the dark pocket.
  vec3 hoverColour = mix(cometGrade(pop), max(col, cometGrade(pop)), smoothstep(0.45, 0.95, gCol));
  col = mix(col, hoverColour, pop * 0.82);


  // ---- emergence from darkness: the beam opacity curve plus a gentle low-glow
  //      gate, over a faint alpha floor that keeps the grid texture barely
  //      visible across the dark (like the reference), never fully black. ----
  float aBeam = smoothstep(0.05, 0.42, gA) * smoothstep(0.035, 0.13, gA);
  aBeam = aBeam * aBeam * aBeam;                        // the dissolve as it has always looked (see the blend note in the loop)
  // the floor keeps the dim tile grid faintly present across the dark, as in
  // the reference (a barely-there dot matrix, never a flat black field)
  float a = max(aBeam, 0.2);
  a = max(a, pop * 0.95);                               // popped tiles surface fully, even across the dark
  return vec4(col, a);
}

float energyAt(vec2 id){
  if (id.x < 0.0 || id.y < 0.0 || id.x >= uGrid.x || id.y >= uGrid.y) return 0.0;
  return texture2D(uPop, (id + 0.5) / uGrid).r;
}

// A rounded tile face with a small physical lift; no warping of the grid.
float faceMask(vec2 local, vec2 size, float radius){
  vec2 q = abs(local - size * 0.5) - (size * 0.5 - radius);
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - step(0.0, sd);
}

float rideAt(vec2 id, float energy){
  vec2 centre = (id + 0.5) * uCell;
  vec2 uv = vec2(centre.x, uRes.y - centre.y) / uRes;
  float beam = smoothstep(0.06, 0.5, beamAt(uv, uRes.x / uRes.y).x);
  vec2 headPx = vec2(uHead.x, 1.0 - uHead.y) * uRes;
  float distanceInTiles = length((centre - headPx) / uCell);
  // Broad travelling crest, followed by a quieter second crest along the trace.
  float wave = 0.5 + 0.5 * sin(distanceInTiles * 0.72 - uTime * 9.0);
  return uRide * sqrt(energy) * beam * (0.55 + 0.45 * wave);
}

void main(){
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 id = floor(fc / uCell);
  float energy = energyAt(id);
  vec4 base = surfaceAt(id, energy * twinkle(id, uTime));
  vec3 tm = tileMask(fc, uCell, uSeam, uRadius);
  base.rgb *= 1.0 - 0.22 * max(max(tm.x * 0.38, tm.y * 0.55), tm.z * 0.8);

  if (uRide > 0.001) {
    // Recess beneath a rising face gives the pop real depth, rather than a flash.
    float ownRide = rideAt(id, energy);
    base.rgb *= 1.0 - ownRide * 0.42;
    // A tile can rise by less than one row. Sample this row and the row below
    // to draw the whole face across its boundary, with no sliced-off tops.
    for (int row = 0; row < 2; row++) {
      vec2 tile = id + vec2(0.0, float(row));
      float e = energyAt(tile);
      if (e < 0.012) continue;
      float ride = rideAt(tile, e);
      if (ride < 0.002) continue;
      float lift = floor(uCell.y * 0.58 * ride + 0.5);
      vec2 origin = tile * uCell + vec2(uSeam, uSeam - lift);
      vec2 size = uCell - uSeam;
      vec2 local = floor(fc) + 0.5 - origin;
      float mask = faceMask(local, size, uRadius);
      vec4 face = surfaceAt(tile, e);
      // Warm specular edge above, shaded edge below; never cold white sparkles.
      float topEdge = 1.0 - smoothstep(0.0, max(1.0, uCell.y * 0.16), local.y);
      float bottomEdge = smoothstep(size.y - uCell.y * 0.18, size.y, local.y);
      face.rgb = mix(face.rgb, vec3(1.0, 0.78, 0.63), ride * (0.20 + topEdge * 0.58));
      face.rgb *= 1.0 - bottomEdge * ride * 0.23;
      base = mix(base, face, mask * smoothstep(0.0, 0.10, ride));
    }
  }
  gl_FragColor = base;
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

export function PixelDome({ cell = TILE_CELL, domeY = -0.15, intensity = 1, className }: PixelDomeProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl =
      (canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        // The hover pass redraws only a box around the cursor and relies on the
        // rest of the beam still being in the drawing buffer. Without this the
        // browser discards the buffer after every composite, and the first
        // hover frame would leave everything outside the box blank.
        preserveDrawingBuffer: true,
      }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const hoverAvailable = matchMedia("(any-hover: hover)");
    // A touchscreen can also have a mouse or trackpad. Follow hover capability
    // rather than the primary pointer, and update when devices change.
    let interactive = !reducedMotion.matches && hoverAvailable.matches;

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

    // No GL blending: one full-screen pass writes (colour, alpha) straight into
    // the transparent canvas and the compositor does the single, correct
    // straight-alpha blend over the band's dark base. (With SRC_ALPHA blending
    // over a transparent clear the framebuffer held colour*a and a^2, which the
    // compositor read as straight alpha -> an effective weight of a^3: the
    // faint dark-grid floor vanished entirely and the dissolve was steeper than
    // designed. The dissolve curve below is cubed on purpose to keep the beam's
    // silhouette exactly as it was.)
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0); // transparent - every frame starts clean

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uCell = u("uCell");
    const uSeam = u("uSeam");
    const uRadius = u("uRadius");
    const uDomeY = u("uDomeY");
    const uGrid = u("uGrid");
    const uTime = u("uTime");
    const uHead = u("uHead");
    const uRide = u("uRide");
    gl.uniform1f(u("uIntensity"), intensity);
    gl.uniform1f(uDomeY, domeY);
    // the per-tile comet texture (one byte per tile), unit 0
    const pop = new PopTexture(gl);
    gl.uniform1i(u("uPop"), 0);

    // Native device pixels, up to 3x. The tiles must map 1:1 onto the screen's
    // pixels: a backing store rendered below the device ratio gets resampled by
    // the compositor and every tile edge turns into a soft ramp.
    const DPR_CAP = 3;
    let w = 0;
    let h = 0;
    let dpr = 1;
    // Tile pitch in whole device px (landscape 3:2 - `cell` is the height, the
    // width is 1.5x - each rounded separately: 15x10 / 30x20 / 45x30 at 1x/2x/3x),
    // groove width and corner radius, from the shared definition.
    let cellX = 30;
    let cellY = 20;
    let seamPx = 1;
    let radiusPx = 4;
    // canvas rect cached at resize time (the canvas fills its inset:0 host, so
    // it only moves via scroll - onMove offsets by the scroll delta instead of
    // re-measuring per pointer event)
    let rl = 0;
    let rt = 0;
    let rw = 0;
    let rh = 0;
    let rsy = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const rect = (canvas.parentElement ?? canvas).getBoundingClientRect();
      rl = rect.left;
      rt = rect.top;
      rw = rect.width;
      rh = rect.height;
      rsy = window.scrollY;
      w = Math.max(1, Math.round(rect.width * dpr));
      h = Math.max(1, Math.round(rect.height * dpr));
      const p = tilePitch(dpr * (cell / TILE_CELL));
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
      // lock the CSS box to the backing store (rect.width can be fractional;
      // the difference is under a pixel and the host's dark base shows through)
      canvas.style.width = `${w / dpr}px`;
      canvas.style.height = `${h / dpr}px`;
    };

    // ---- state: the cursor comet on the beam's grid ----
    let comet = new Comet();
    const boxes = new BoxTracker();
    let active = false; // the head has been placed (it snaps to the first sighting)
    let inside = false; // pointer over the band
    let leftAt = -1; // t when the pointer left - the head then ages out like a tail node
    let raf = 0;
    let onScreen = true;
    let prev = 0;
    let t = 0; // elapsed seconds
    let ride = 0;
    let lastMoveT = -100; // t at the last pointer move (the loop parks once the pointer is still)

    const setUniforms = () => {
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uCell, cellX, cellY);
      gl.uniform1f(uSeam, seamPx);
      gl.uniform1f(uRadius, radiusPx);
      gl.uniform2f(uGrid, pop.gridC, pop.gridR);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uHead, comet.hx, comet.hy);
      gl.uniform1f(uRide, ride);
    };
    // Full pass: the whole beam (static at rest).
    const draw = () => {
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT); // reset to transparent so frames never accumulate (no ghost trails)
      setUniforms();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // Hover pass: the beam itself never changes - only the tiles the comet
    // touches. So a hover frame re-renders just a tile-aligned box around the
    // live nodes (padded by the head's reach), unioned with the previous frame's
    // box so tiles that just went dark are restored, and leaves the rest of the
    // canvas as it is (the drawing buffer is preserved). At native device
    // resolution a full-frame pass per hovered frame was the site's slowest
    // thing; this box is a small fraction of it.
    const drawHover = () => {
      // the head: age 0 while the pointer is over the band, ageing from leftAt
      // once it has gone (so the head dissolves like the tail does)
      comet.pack(t, inside ? 0 : leftAt < 0 ? LIFE * 2 : t - leftAt);
      const box = boxes.next(comet.liveBox(), w, h, cellX, cellY);
      if (!box) return;
      const s = snapToTiles(box, w, h, cellX, cellY);
      if (!s) return;
      pop.upload(gl, comet, s, w, h, cellX, cellY);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      setUniforms();
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disable(gl.SCISSOR_TEST);
    };

    const frame = (now: number) => {
      const dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0.016;
      prev = now;
      t += dt;
      const targetRide = inside ? Math.exp(-Math.max(0, t - lastMoveT - 0.06) * 5.5) : 0;
      ride += (targetRide - ride) * (1 - Math.exp(-dt / 0.07));
      if (ride < 0.002 && targetRide < 0.002) ride = 0;
      if (inside) comet.chase(dt, t); // ease the head toward the pointer, lay the tail
      comet.retire(t);
      drawHover();
      // Park the loop when nothing can change any more: the pointer has left and
      // every node (head included) has dissolved - or the pointer rests on the
      // band with the tail gone (the head stays lit under it). The hero is a
      // full screen, so "cursor somewhere on it" is the normal state and must
      // cost nothing while nothing moves.
      const gone = !inside && ride === 0 && comet.hist.length === 0 && (leftAt < 0 || t - leftAt > LIFE + 0.1);
      const still = inside && ride === 0 && comet.converged && comet.hist.length === 0 && t - lastMoveT > 0.6;
      if (!onScreen || gone || still) {
        if (gone) {
          active = false;
          drawHover(); // final pass with everything dissolved -> nothing left behind
        }
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

    let pointerX = -1, pointerY = -1;
    const onMove = (e: PointerEvent) => {
      if (!interactive || e.pointerType === "touch") return;
      pointerX = e.clientX; pointerY = e.clientY;
      const top = rt - (window.scrollY - rsy);
      const isIn =
        rw > 0 && rh > 0 && e.clientX >= rl && e.clientX <= rl + rw && e.clientY >= top && e.clientY <= top + rh;
      if (!isIn) {
        if (inside) {
          inside = false;
          leftAt = t;
          setDomeHover(-1);
          wake();
        }
        return;
      }
      const x = (e.clientX - rl) / rw;
      const y = 1 - (e.clientY - top) / rh;
      comet.target(x, y);
      if (!inside) {
        inside = true;
        setDomeHover(1);
        // snap the head to the first sighting so it doesn't streak in; if the
        // old head is still dissolving nearby, glide from it instead
        if (!active || (leftAt >= 0 && t - leftAt > LIFE * 0.5)) {
          active = true;
          comet.snap(x, y);
        }
        leftAt = -1;
      }
      lastMoveT = t;
      wake();
    };
    const leave = () => {
      if (!inside) return;
      inside = false;
      leftAt = t;
      setDomeHover(-1);
      wake();
    };

    const onScroll = () => {
      const top = rt - (window.scrollY - rsy);
      if (inside && (pointerX < rl || pointerX > rl + rw || pointerY < top || pointerY > top + rh)) leave();
    };
    const listen = () => {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("blur", leave);
      window.addEventListener("scroll", onScroll, { passive: true });
    };
    const unlisten = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", onScroll);
    };
    const syncInteraction = () => {
      const next = !reducedMotion.matches && hoverAvailable.matches;
      if (next === interactive) return;
      interactive = next;
      if (next) { listen(); wake(); return; }
      unlisten();
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (inside) setDomeHover(-1);
      inside = false; active = false; leftAt = -1; ride = 0;
      comet = new Comet();
      boxes.reset();
      pop.resize(gl, w, h, cellX, cellY);
      draw();
    };

    const io = new IntersectionObserver(([en]) => {
      onScreen = en?.isIntersecting ?? true;
      if (onScreen && interactive) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      boxes.reset();
      draw();
    });
    ro.observe(canvas.parentElement ?? canvas);

    resize();
    draw(); // initial static dome

    if (interactive) listen();
    reducedMotion.addEventListener("change", syncInteraction);
    hoverAvailable.addEventListener("change", syncInteraction);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (inside) setDomeHover(-1);
      io.disconnect();
      ro.disconnect();
      reducedMotion.removeEventListener("change", syncInteraction);
      hoverAvailable.removeEventListener("change", syncInteraction);
      unlisten();
      pop.dispose(gl);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [cell, domeY, intensity]);

  return <canvas ref={ref} className={className ? `pixel-dome ${className}` : "pixel-dome"} aria-hidden />;
}
