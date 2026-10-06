/**
 * The cursor comet - ONE definition shared by the beam bands (<PixelDome>) and
 * the site-wide cursor trail (<PixelTrail>), so both light up the very same
 * tiles the very same way.
 *
 * Geometry: landscape 3:2 rounded tiles, TILE_CELL css px tall (1.5x wide),
 * each axis snapped to whole device pixels, a hairline groove between tiles
 * and a binary-coverage rounded corner (see tilePitch / TILE_GLSL).
 *
 * Motion: an eased head chasing the pointer, a tail of evenly laid recent
 * positions, every node a round splat that tapers head -> tip and fades with
 * age. The field is evaluated ONCE PER TILE on the CPU (popAt) and handed to
 * the shader as a one-byte-per-tile texture (PopTexture), so a fragment costs
 * a single texture read.
 */

export const NODES = 32; // head + tail
export const LIFE = 0.95; // s - a node dissolves over this long
export const SIG_H = 0.052; // head splat sigma, in units of the canvas height
export const SIG_T = 0.03; // tail tip sigma
export const MIN_STEP = 0.013; // uv distance between tail nodes (even, dense = smooth)
export const TAU = 0.06; // head ease time constant (s)
export const REACH = 3.2 * SIG_H; // how far (in canvas heights) a splat can still light a tile
export const TILE_CELL = 10; // tile height in css px; the width is 1.5x (3:2)

/** Whole-device-pixel tile pitch, groove and corner radius for a device ratio. */
export function tilePitch(dpr: number) {
  const cellY = Math.max(4, Math.round(TILE_CELL * dpr));
  const cellX = Math.max(4, Math.round(TILE_CELL * 1.5 * dpr));
  const seam = Math.max(1, Math.round(cellY / 16)); // a hairline: 1 device px at 1x and 2x, 2 at 3x
  const radius = Math.max(1, Math.round((cellY - seam) * 0.22));
  return { cellX, cellY, seam, radius };
}

/**
 * GLSL shared by both shaders: the tile mask for a fragment at top-down device
 * px `fc` -> vec3(inSeam, cut, junction). No anti-aliasing anywhere - every
 * groove and every corner cut lands on whole device pixels, so every tile
 * carries the identical crisp pattern.
 */
export const TILE_GLSL = `
// cheap per-cell hash -> 0..1
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
// x = in a groove, y = in a cut corner (body pixel outside the rounded body),
// z = where four grooves cross
vec3 tileMask(vec2 fc, vec2 cell, float seam, float radius){
  vec2 px = floor(mod(fc, cell));                      // integer pixel inside this tile (0..cell-1), top-down
  float sx = (px.x < seam) ? 1.0 : 0.0;                // in a vertical groove
  float sy = (px.y < seam) ? 1.0 : 0.0;                // in a horizontal groove
  float inSeam = max(sx, sy);
  float junction = sx * sy;
  // rounded corners with BINARY coverage: the tile body is a rounded rectangle
  // of the given radius; a pixel belongs to the body iff its centre is inside
  vec2 body = cell - seam;                             // body size (device px)
  vec2 c = (px - seam) + 0.5;                          // pixel centre in body space (0..body)
  vec2 q = max(max(radius - c, c - (body - radius)), 0.0); // distance into a corner zone, per axis
  float cut = (1.0 - inSeam) * ((dot(q, q) > radius * radius) ? 1.0 : 0.0);
  return vec3(inSeam, cut, junction);
}
// the comet's twinkle for a tile: a subtle per-tile flicker so it feels alive
float twinkle(vec2 cellId, float time){
  float rnd = hash21(cellId + 0.5);
  return 0.90 + 0.10 * (sin(time * (4.0 + rnd * 6.0) + rnd * 38.0) * 0.5 + 0.5);
}
`;

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The comet's state: an eased head and a tail of recent positions (uv, bottom-up). */
export class Comet {
  /** (x, y, age) per node, head first - what the field is evaluated from. */
  readonly data = new Float32Array(NODES * 3);
  readonly hist: { x: number; y: number; b: number }[] = [];
  tx = 0.5;
  ty = 0.5; // pointer target
  hx = 0.5;
  hy = 0.5; // eased head
  private lsx = 0;
  private lsy = 0; // where the last tail node was laid

  constructor() {
    for (let i = 0; i < NODES; i++) this.data[i * 3 + 2] = LIFE * 2; // all dead
  }

  /** Put the head right on the pointer (first sighting / after a full dissolve). */
  snap(x: number, y: number) {
    this.tx = this.hx = this.lsx = x;
    this.ty = this.hy = this.lsy = y;
  }
  target(x: number, y: number) {
    this.tx = x;
    this.ty = y;
  }
  get converged() {
    return Math.abs(this.tx - this.hx) < 0.0015 && Math.abs(this.ty - this.hy) < 0.0015;
  }

  /** Ease the head toward the pointer and lay a tail node once it has moved far enough. */
  chase(dt: number, t: number) {
    const k = 1 - Math.exp(-dt / TAU);
    this.hx += (this.tx - this.hx) * k;
    this.hy += (this.ty - this.hy) * k;
    const ddx = this.hx - this.lsx,
      ddy = this.hy - this.lsy;
    if (ddx * ddx + ddy * ddy > MIN_STEP * MIN_STEP) {
      this.hist.unshift({ x: this.hx, y: this.hy, b: t });
      if (this.hist.length > NODES - 1) this.hist.pop();
      this.lsx = this.hx;
      this.lsy = this.hy;
    }
  }
  /** Retire tail nodes older than LIFE (the tail dissolves smoothly). */
  retire(t: number) {
    const h = this.hist;
    while (h.length && t - h[h.length - 1].b > LIFE) h.pop();
  }
  /** Drop the tail entirely (e.g. while hidden) so it restarts fresh from the head. */
  clearTail() {
    this.hist.length = 0;
    this.lsx = this.hx;
    this.lsy = this.hy;
  }

  /** Fill `data`: node 0 = the head at `headAge`, then the tail by age. */
  pack(t: number, headAge: number) {
    const d = this.data;
    d[0] = this.hx;
    d[1] = this.hy;
    d[2] = headAge;
    for (let i = 1; i < NODES; i++) {
      const n = this.hist[i - 1];
      if (n) {
        d[i * 3] = n.x;
        d[i * 3 + 1] = n.y;
        d[i * 3 + 2] = t - n.b;
      } else d[i * 3 + 2] = LIFE * 2;
    }
  }

  /** Bounding box (uv) of the live nodes in `data`, or null when all are dead. */
  liveBox(): Box | null {
    const d = this.data;
    let x0 = 1,
      y0 = 1,
      x1 = 0,
      y1 = 0,
      any = false;
    for (let i = 0; i < NODES; i++) {
      if (d[i * 3 + 2] >= LIFE) continue;
      any = true;
      const x = d[i * 3],
        y = d[i * 3 + 1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    return any ? { x0, y0, x1, y1 } : null;
  }

  /**
   * How lit the tile centred at (cx, cy) (uv, bottom-up) is, 0..255: the
   * brightest of the live splats - the head's and each tail node's, tapering
   * toward the tip and fading with age - soft-thresholded so whole tiles pop
   * and the rim scatters into single tiles.
   */
  popAt(cx: number, cy: number, aspect: number): number {
    const d = this.data;
    let inten = 0;
    for (let i = 0; i < NODES; i++) {
      const age = d[i * 3 + 2];
      if (age >= LIFE) continue;
      let lf = 1 - age / LIFE;
      lf *= lf;
      const ti = i / (NODES - 1);
      const r = SIG_H + (SIG_T - SIG_H) * ti * ti;
      const dx = (cx - d[i * 3]) * aspect;
      const dy = cy - d[i * 3 + 1];
      const v = Math.exp(-(dx * dx + dy * dy) / (2 * r * r)) * lf;
      if (v > inten) inten = v;
    }
    const e = Math.min(1, Math.max(0, (inten - 0.03) / 0.27)); // smoothstep(0.03, 0.30, inten)
    return Math.round(e * e * (3 - 2 * e) * 255);
  }
}

/**
 * The redraw footprint: a box around the live nodes (padded by a splat's
 * reach) UNIONED with the previous frame's box, so tiles that just went dark
 * are redrawn (restored) too. Device px, bottom-up.
 */
export class BoxTracker {
  private had = false;
  private bx0 = 0;
  private by0 = 0;
  private bx1 = 0;
  private by1 = 0;
  reset() {
    this.had = false;
  }
  /** Returns the box to redraw this frame, or null when there is nothing to do. */
  next(live: Box | null, w: number, h: number, cellX: number, cellY: number): Box | null {
    if (!live && !this.had) return null;
    const pad = REACH * h + Math.max(cellX, cellY);
    let x0 = live ? live.x0 * w - pad : this.bx0,
      x1 = live ? live.x1 * w + pad : this.bx1;
    let y0 = live ? live.y0 * h - pad : this.by0,
      y1 = live ? live.y1 * h + pad : this.by1;
    const cx0 = x0,
      cx1 = x1,
      cy0 = y0,
      cy1 = y1;
    if (this.had) {
      x0 = Math.min(x0, this.bx0);
      x1 = Math.max(x1, this.bx1);
      y0 = Math.min(y0, this.by0);
      y1 = Math.max(y1, this.by1);
    }
    if (live) {
      this.bx0 = cx0;
      this.bx1 = cx1;
      this.by0 = cy0;
      this.by1 = cy1;
    }
    this.had = !!live;
    return { x0, y0, x1, y1 };
  }
}

/** Snap a device-px box outward to whole tiles (rows anchored at the TOP; y bottom-up) and clamp. */
export function snapToTiles(b: Box, w: number, h: number, cellX: number, cellY: number): Box | null {
  const x0 = Math.max(0, Math.floor(b.x0 / cellX) * cellX);
  const x1 = Math.min(w, Math.ceil(b.x1 / cellX) * cellX);
  const y0 = Math.max(0, h - Math.ceil((h - b.y0) / cellY) * cellY);
  const y1 = Math.min(h, h - Math.floor((h - b.y1) / cellY) * cellY);
  return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : null;
}

/** One byte per tile: the comet's field, uploaded for the tiles of a box only. */
export class PopTexture {
  readonly tex: WebGLTexture | null;
  gridC = 0; // tiles across
  gridR = 0; // tiles down
  private sub = new Uint8Array(0);

  constructor(gl: WebGLRenderingContext) {
    this.tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  }
  /** (Re)allocate to the tile grid of a w x h canvas - always all dark (a resize mid-hover must not keep lit tiles). */
  resize(gl: WebGLRenderingContext, w: number, h: number, cellX: number, cellY: number) {
    const gc = Math.ceil(w / cellX);
    const gr = Math.ceil(h / cellY);
    this.gridC = gc;
    this.gridR = gr;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gc, gr, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array(gc * gr));
  }
  /** Evaluate + upload the comet for the tiles covered by a (tile-snapped, bottom-up) box. */
  upload(gl: WebGLRenderingContext, comet: Comet, box: Box, w: number, h: number, cellX: number, cellY: number) {
    const c0 = Math.max(0, Math.floor(box.x0 / cellX));
    const c1 = Math.min(this.gridC, Math.ceil(box.x1 / cellX));
    const r0 = Math.max(0, Math.floor((h - box.y1) / cellY)); // tile rows count from the top
    const r1 = Math.min(this.gridR, Math.ceil((h - box.y0) / cellY));
    const cw = c1 - c0,
      rh = r1 - r0;
    if (cw <= 0 || rh <= 0) return;
    if (this.sub.length < cw * rh) this.sub = new Uint8Array(cw * rh);
    const sub = this.sub.subarray(0, cw * rh);
    const aspect = w / h;
    for (let r = 0; r < rh; r++) {
      const cy = 1 - ((r0 + r + 0.5) * cellY) / h;
      for (let c = 0; c < cw; c++) sub[r * cw + c] = comet.popAt(((c0 + c + 0.5) * cellX) / w, cy, aspect);
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, c0, r0, cw, rh, gl.LUMINANCE, gl.UNSIGNED_BYTE, sub);
  }
  dispose(gl: WebGLRenderingContext) {
    gl.deleteTexture(this.tex);
  }
}
