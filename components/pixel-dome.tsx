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
  /** ellipse centre of the arc, bottom-up; small/negative (below the frame) so
   *  the beam sweeps the full width with its crown near the top. Default -0.15. */
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

// ---- ONE single curved beam (the Algolia arc): an ellipse whose centre sits
//      below the frame, so the bright strip sweeps the full width - apex at the
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
  float w = (t > 0.0) ? 0.16 : 0.17;                     // soft (but tight) halo above; the interior dissolves to dark just below the band (Algolia-style dark pocket for the copy)
  float glow = exp(-(t * t) / (w * w)) * uIntensity;
  float crown = clamp(d.y / max(dist, 0.001), 0.0, 1.0); // 1 at the crown -> 0 at the sides
  return vec2(glow * mix(0.55, 1.0, crown), t);
}

void main(){
  float aspect = uRes.x / uRes.y;

  // ---- grid cell this fragment belongs to. The grid is anchored at the
  //      canvas's TOP-left (gl_FragCoord's origin is bottom-left), so when the
  //      height isn't a whole number of tiles the partial row sits at the
  //      bottom edge, under the fold, never along the crest. ----
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y); // top-down device px
  vec2 cellId = floor(fc / uCell);
  vec2 cellCenterTD = (cellId + 0.5) * uCell;
  vec2 cellCenter = vec2(cellCenterTD.x, uRes.y - cellCenterTD.y); // back to bottom-up
  vec2 uvC = cellCenter / uRes;             // per-cell sample (tile colour stepping)

  // ---- the cursor comet, ONE value per tile. The field (a union of round
  //      splats at the head and each recent position, tapering head -> tail,
  //      each fading with age - the site-wide trail's field) is evaluated at
  //      the tile centres on the CPU and uploaded as a tiny texture, so a tile
  //      costs one texture read here instead of 32 splats per fragment. ----
  // per-tile pop 0..1 (whole tiles light up, the rim scatters into single
  // tiles), with a subtle twinkle so it feels alive
  float pop = texture2D(uPop, (cellId + 0.5) / uGrid).r * twinkle(cellId, uTime);
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

  // ---- tile texture, snapped to DEVICE PIXELS: the seam between tiles is
  //      exactly uSeam whole pixels wide (a darker groove in the tile's own
  //      colour, never a hole), the corner pixel of every tile is knocked back a
  //      touch more so the grid reads softly rounded, and there is no
  //      anti-aliasing anywhere - every edge lands on a pixel boundary. ----
  //      (tileMask - shared with the site-wide trail - returns the groove,
  //      the cut corner and the crossing for this fragment)
  vec3 tm = tileMask(fc, uCell, uSeam, uRadius);
  float inSeam = tm.x;                                  // in a groove
  float cut = tm.y;                                     // a body pixel outside the rounded corner
  float junction = tm.z;                                // where four grooves cross
  // ---- rounded corners with BINARY coverage: the tile body is a rounded
  //      rectangle of radius uRadius; a pixel belongs to the body iff its centre
  //      is inside it. No anti-aliasing - every tile carries the identical crisp
  //      corner pattern, and the four cut corners around each crossing form the
  //      small dark star the reference shows at every junction. ----
  // 0..1 darkness weight: edge groove .38, cut corners .55, crossing .8 - from
  // reading distance the grid melts into the gradient with only a hint of the
  // lattice; up close the tiles are still clearly parted and the junction
  // stars still read.
  float seam = max(max(inSeam * 0.38, cut * 0.55), junction * 0.8);

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
  vec3 POP = vec3(1.0, 0.32, 0.18);                     // bright brand-red - low G/B = stays red, never white
  col = mix(col, POP, pop * 0.85);

  col *= 1.0 - 0.22 * seam;                             // grooves ~8% darker, corner cuts ~12%, crossings ~18% - same hue; seamless from afar

  // ---- emergence from darkness: the beam opacity curve plus a gentle low-glow
  //      gate, over a faint alpha floor that keeps the grid texture barely
  //      visible across the dark (like the reference), never fully black. ----
  float aBeam = smoothstep(0.05, 0.42, gA) * smoothstep(0.035, 0.13, gA);
  aBeam = aBeam * aBeam * aBeam;                        // the dissolve as it has always looked (see the blend note in the loop)
  // the floor keeps the dim tile grid faintly present across the dark, as in
  // the reference (a barely-there dot matrix, never a flat black field)
  float a = max(aBeam, 0.2);
  a = max(a, pop * 0.95);                               // popped tiles surface fully, even across the dark
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
      const rect = canvas.getBoundingClientRect();
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
    const comet = new Comet();
    const boxes = new BoxTracker();
    let active = false; // the head has been placed (it snaps to the first sighting)
    let inside = false; // pointer over the band
    let leftAt = -1; // t when the pointer left - the head then ages out like a tail node
    let raf = 0;
    let onScreen = true;
    let prev = 0;
    let t = 0; // elapsed seconds
    let lastMoveT = 0; // t at the last pointer move (the loop parks once the pointer is still)

    const setUniforms = () => {
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uCell, cellX, cellY);
      gl.uniform1f(uSeam, seamPx);
      gl.uniform1f(uRadius, radiusPx);
      gl.uniform2f(uGrid, pop.gridC, pop.gridR);
      gl.uniform1f(uTime, t);
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
      if (inside) comet.chase(dt, t); // ease the head toward the pointer, lay the tail
      comet.retire(t);
      drawHover();
      // Park the loop when nothing can change any more: the pointer has left and
      // every node (head included) has dissolved - or the pointer rests on the
      // band with the tail gone (the head stays lit under it). The hero is a
      // full screen, so "cursor somewhere on it" is the normal state and must
      // cost nothing while nothing moves.
      const gone = !inside && comet.hist.length === 0 && (leftAt < 0 || t - leftAt > LIFE + 0.1);
      const still = inside && comet.converged && comet.hist.length === 0 && t - lastMoveT > 0.6;
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

    const onMove = (e: PointerEvent) => {
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
      boxes.reset();
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
      if (inside) setDomeHover(-1);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", leave);
      pop.dispose(gl);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [cell, domeY, intensity]);

  return <canvas ref={ref} className={className ? `pixel-dome ${className}` : "pixel-dome"} aria-hidden />;
}
