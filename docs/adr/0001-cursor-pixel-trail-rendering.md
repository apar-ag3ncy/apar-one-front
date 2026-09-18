# ADR-0001: Cursor pixel-trail rendering architecture (and the hero-dome finding)

**Status:** Superseded for the trail's *look* (2026-09-07) · Proposed (hero dome follow-up)
**Date:** 2026-09-04
**Deciders:** APAR (Preyansh) — owner of the brand/hero aesthetic

> **2026-09-17 (later) — the cursor comet moved onto the beam's own grid.**
> Over the hero and footer beams the site-wide trail is no longer shown: the
> beam's own 3:2 tiles are the cursor. `components/pixel-dome.tsx` now runs the
> trail's exact behaviour (eased head, evenly laid tail of 31 nodes, each
> dissolving over 0.95 s, splat sigma 0.052 → 0.030 head → tip) and lights
> whole tiles of the beam grid with it — a soft threshold on the field so the
> rim scatters into single tiles, a subtle twinkle, the tile colour pulled
> toward a bright brand red (never white) and the popped tiles surfacing fully
> even across the dark pocket. The field is evaluated ONCE PER TILE on the
> CPU (only the tiles of the redraw box) and uploaded as a one-byte-per-tile
> `LUMINANCE` texture (`uPop`), so a fragment costs one texture read
> instead of a 32-splat loop — Option C below, finally the right fit because
> the dome's tiles are flat by design. While the pointer is over a beam,
> `html[data-on-dome="1"]` fades the site-wide trail out (CSS, 250 ms) and the
> trail's loop skips its full-screen pass (it keeps tracking, blanks once, and
> resumes drawing the moment the pointer is back off the beam — its look is
> untouched). Verified on a production build at DSF 2: popped tiles are whole
> 30×20-device-px tiles with the hairline grooves intact (row profile
> 101×29 · 86 · 96×29 · 87 · 97…), a far tile is unchanged during hover, the
> canvas returns to the pre-hover baseline exactly (0 px differ) after the
> pointer leaves, the loop parks with the pointer still on the beam (0 px
> change between two shots 0.4 s apart), console clean. Performance on the
> 4-core Mac (interleaved A/B, same build): sweep on the beam 34 fps vs the
> deployed trail alone on a cream section 32 fps vs 60 fps with pointer
> events swallowed — i.e. the comet costs no more than the trail did, and the
> ceiling is the machine (the desktop app's renderer, WindowServer and an
> unrelated node process were sharing the CPU/GPU during the runs); the main
> thread is idle (43 ms of script per 2.6 s sweep).

> **2026-09-17 — hero dome made pixel-exact (the "hero dome follow-up" above is
> now acted on).** `components/pixel-dome.tsx`: native device-pixel backing
> store (was capped at 1.5×, so on 2× screens every tile edge was resampled),
> a landscape 3:2 tile (15 × 10 css px, each axis snapped to whole device
> pixels: 15×10 / 30×20 / 45×30 at 1×/2×/3×, a 1-device-px hairline groove, corner radius
> ~22% of the body) drawn with BINARY coverage - every tile carries the same
> crisp rounded-corner pixel pattern and the four cut corners form the dark
> star at each junction - one flat colour per tile (the in-tile gradient
> removed), grid anchored at the canvas's top-left so partial rows fall under
> the fold, and the same straight-alpha compositing fix
> as the trail (`gl.disable(BLEND)`; the old `SRC_ALPHA` blend over a
> transparent clear composited at α³, which hid the faint dark-field grid and
> steepened the dissolve — the dissolve is now cubed explicitly to keep its
> silhouette). The hover shimmer redraws only a tile-aligned scissor box around
> the cursor (`preserveDrawingBuffer: true` so the rest of the beam persists),
> which is what makes native resolution affordable on the integrated GPU.

> **2026-09-07 — look reverted to the shipped version.** The owner preferred the
> trail as deployed on Vercel (commit `0980bd7`: 22px tiles, soft gaussian
> head, `SIG_H 0.0515 / SIG_T 0.030`, 0.95 s waving tail) over the later
> refinements this ADR describes below (16px tiles, lattice-snapped pixel disc,
> OKLCH trace ramp, blend-off compositing, scissor bounding).
> `components/pixel-trail.tsx` is that shipped file again. The rendering
> analysis, the compositing root cause and the hero-dome finding below remain
> valid and are kept for the record; only the head/trace design choices are
> no longer in effect.

## Context

The site-wide `<PixelTrail>` cursor ornament (`components/pixel-trail.tsx`) must be
(1) small and aesthetic, (2) butter-smooth — including while the page scrolls under a
moving cursor, and (3) built on the best-fit rendering technique. The reference dev
machine is a 4-core Mac with an integrated GPU at DPR 2, which is also the realistic
floor for visitors.

The trail is a full-viewport WebGL fragment shader that, for **every pixel**, loops
over `NODES = 38` splats (`exp` per splat), then applies the hero `PixelDome`'s
rounded-tile SDF and a hash-dithered dissolve. Cost ∝ screen-area × DPR² × NODES.

Measured (Chrome, Next dev, 1366×768, continuous cursor sweep, rAF-counted over 1.5s):

| Scenario | fps | long frames (>20ms) |
|---|---|---|
| `/what-we-do` (trail only), DSF 1 | 57 | 1 |
| `/` hero, DSF 1 | 37 | 21 |
| `/` hero, dome **parked** (scrolled past), DSF 1 | **58** | **4** |
| `/` hero, dome active, **DSF 2 (true retina)** | **26** | **33** |

The jank lives on the hero and disappears the moment the dome parks — i.e. the
`PixelDome` beam, not the trail, is the bottleneck. Cost decomposition at DSF 2 via
CSS injection (noisy ±8 fps; representative values): no dome ≈ 55 · dome shader only
(`visibility:hidden`) ≈ 47 · shader + compositing ≈ 39. The dome's cost is roughly
**half its per-frame full-viewport shader, half compositing a full-viewport alpha
layer**, and it pays both every frame the pointer hovers the hero.

## Decision

**Trail:** keep the single-pass splat shader (its look is tuned and verified) but
**scissor the draw to the trail's footprint** — bounding box of live nodes padded by
3.2σ (below the alpha reject) + one tile. Same shader, ~7–10× less fragment work,
zero visual risk. Also: shrink the blob (`SIG_H 0.044→0.032`, `SIG_T 0.026→0.019`,
tile `18→16px`), request a `desynchronized` GL context (canvas composites out of
step with the page → the blob lands under the cursor a frame sooner), and hoist
`LIFE/SIG_H/SIG_T` to one source of truth templated into the shader.

**Hero dome (safe part, done):** cap `PixelDome`'s DPR at 1.5 (it was 2), matching the
precedent the trail already set. Its 20px tiles with hairline seams stay ≥1.5 device
px, so nothing visible changes (before/after parity checked at DSF 2) while fragments
and the composited layer drop ~44%. Measured gain was small (26→29 fps at retina) —
the dome is not simply fill-rate bound.

**Hero dome (static-beam cache — tried, measured, REVERTED):** the beam is
static; only a small hover "pop" changes per frame, yet the whole viewport was
re-shaded every hovered frame. I implemented a static-beam FBO cache + a
cell-aligned scissored hover pass (pixel-parity verified: 0.019% of pixels
differed by >2, max delta 9 — i.e. ±1 LSB) and benchmarked it on a **production
build** at true retina (DSF 2), 4-pass medians:

| Production build | hero hover fps | long frames | dome parked fps |
|---|---|---|---|
| before (DPR cap 1.5) | 37 | 34 | 59 |
| after (+ static-beam cache) | 38 | 33 | 61 |

Cutting the beam shader's per-pixel work ~10× changed nothing, so the dome's
cost is **not** the shader. It is the compositor: presenting a full-viewport
`alpha:true` WebGL canvas forces Chrome to re-composite that 2049×1152 layer
(plus the hero's `will-change` layers over it) every frame the canvas updates.
70 lines of complexity in the signature component for zero benefit → reverted.
The DPR cap stays (parity-safe, smaller layer, harmless).

**Hero dome (actual fix, proposed — needs sign-off):** stop the big canvas from
presenting while hovered. Either (a) move the hover pop to a small (~440px)
canvas that follows the cursor so the full-viewport beam layer is static and the
compositor caches it — the architecturally correct answer; or (b) the cheap
half-measure: throttle the dome's hover redraw to 30 Hz (imperceptible on a
soft glow, halves the composite cost). Both are cheap to benchmark with the
prod harness now in place.

**Compositing root cause (found by the adversarial verification panel, fixed):**
every earlier "muddy / greige trail" complaint had one cause. The canvas is
`premultipliedAlpha:false`, but the pass blended `SRC_ALPHA/ONE_MINUS_SRC_ALPHA`
over a transparent clear, leaving the buffer holding `(col·a, a²)`; the browser
reads that as *straight* alpha, so the page effectively saw `col·a³` — 12–15%
black mixed into every semi-transparent tile, and ~10% chroma loss even on the
head (`#EC4834` instead of `#F73923`). The panel fitted that formula to the
measured pixels within 1/255. Fix: the single full-screen triangle writes each
pixel exactly once, so blending is unnecessary — `gl.disable(gl.BLEND)` and the
buffer holds exactly `(col, a)`. Verified after the fix: head tile
`rgb(247,57,35)` = `#F73923` exactly (uniformity L/C range 0.000); traces
`(250,119,100) → (250,177,162) → (246,226,214)`, strictly monotonic in L↑/C↓, hue
spread 1.9°; the mud fingerprint (min R over trace tiles) went from 210–216 to 247.
Two secondary fixes from the same review: the pale trace endpoint was outside the
sRGB gamut (linear R 1.23) so the shader clamp bent the older half of the ramp —
now the endpoint's chroma is bisected to the max in-gamut value from the hex;
and the head is now exactly the hex (shimmer traces-only, alpha cap removed).
Note: `PixelDome` uses the same blend setup but sits on near-black, where the
darkening is invisible and its look is tuned around it — deliberately left alone.

**Head shape (per owner: "circle shape perfect"):** the head is a **pixel disc
snapped to the tile lattice with binary coverage**. For each tile: the head's
(eased) position is floored to the tile it sits in, the disc is centred on that
tile's centre, and a tile is lit iff its centre is within `HEAD_R = 2.5` tiles
(`1 − step(HEAD_R, dist)`). Result: the identical canonical 21-tile circle (rows
3,5,5,5,3), every tile the exact `#F73923`, at every cursor position. Why not
coverage anti-aliasing: the verification panel showed a 5-tile AA disc is
phase-dependent — crisp with the cursor on a tile centre, a mushy 4×4 block with
half-alpha nubs at a corner phase — and its salmon rim tiles contradicted "whole
dark". Trade-off, stated plainly: a phase-invariant pixel circle must step in
tile (16px) increments; the eased spring still drives the position, only its
rasterisation is quantised (pixel-art motion), and the traces still glide.
Traces are drawn separately (nodes 1..N−1) with sigmas in **tile units**
(`SIG_T0 0.85 → SIG_T 0.40` tiles) so the tail is viewport-independent and always
narrower than the disc; colour capped at k 0.88 so the first trace is a touch
softer; head composited OVER traces. On fast frames the head lays a node every
`MIN_STEP` along its path (birth times spread across the frame) so the tail never
shows 2-tile alpha plateaus. Measured: identical 21-tile pattern at two sub-tile
phases (phase-invariant), 0 partial tiles, all lit tiles `#F73923`; comet tail
band 3 rows vs the disc's 5.

## Options Considered (trail rendering)

### Option A — Full-viewport per-pixel splat loop (status quo)
| Dimension | Assessment |
|---|---|
| Complexity | Low |
| Cost | ∝ screen × DPR² × NODES; heaviest on large/retina screens |
| Scalability | Poor — grows with viewport, not with the trail |
| Team familiarity | High (shipped) |
**Pros:** simplest; look already tuned. **Cons:** pays for empty screen.

### Option B — Same shader, scissored to the trail's bounding box ✅
| Dimension | Assessment |
|---|---|
| Complexity | Low (+25 lines CPU-side) |
| Cost | ∝ trail footprint only (~10–15% of viewport) |
| Scalability | Good — independent of viewport size |
| Team familiarity | High — no shader change |
**Pros:** order-of-magnitude less work, zero visual risk, trivially reversible.
**Cons:** fragment cost inside the box unchanged (fine — it's small).

### Option C — Low-res intensity field (one texel/tile) + NEAREST upsample
| Dimension | Assessment |
|---|---|
| Complexity | Medium–High (second pass, FBO, dissolve/tile logic must move) |
| Cost | Lowest — splat loop runs on ~4k texels, not ~3M pixels |
| Scalability | Best |
| Team familiarity | Medium |
**Pros:** textbook technique; pixelation comes free from NEAREST.
**Cons:** rewrites a component tuned over many iterations (tile SDF, radial-vs-age
colour, per-tile dither); real regression risk for a cost that is not the bottleneck.

### Option D — Instanced per-splat quads with blending
**Cons:** the trail uses a union-*max* of splats (not additive); can't express with
standard blending without artefacts. Not pursued.

## Trade-off Analysis

The measurements make the call: the trail was never the frame-budget problem, so
Option C's rewrite risk buys nothing today. Option B bounds the trail's cost so it
*cannot* become a problem on bigger/retina screens, at zero risk. The remaining jank
is the hero dome and is architectural (re-shading a static beam every frame); its
fix is proposed, not silently applied, because it touches the signature brand element.

## Consequences

- Easier: trail cost is now bounded by its own size, not the viewport; one source of
  truth for shader/CPU constants.
- Unchanged: the hero can still drop to ~26–29 fps at retina while hovered until the
  static-beam cache lands.
- Revisit: after the dome fix, re-measure at DSF 2; if compositing still dominates,
  consider parking the dome during scroll (its `BandBackdrop` comment already claims
  this but it isn't implemented).
- The dev-mode numbers were noisy (±10 fps run-to-run); the production-build
  table above is the one to trust. Dev and prod agree on the finding: dome ≫ trail.

## Action Items
1. [x] Scissor + shrink + `desynchronized` + single-source constants in `pixel-trail.tsx`
2. [x] `PixelDome` DPR cap 2 → 1.5 (parity verified)
3. [x] Static-beam FBO cache — built, parity-verified, prod-benchmarked, **reverted** (no gain; cost is compositing)
4. [x] Re-measured on a production build at DSF 2 (table above)
5. [ ] **Approve:** hover pop on a small cursor-following canvas so the beam layer stays static (or the 30 Hz throttle)
6. [ ] Optionally park the dome while scrolling (make `BandBackdrop`'s comment true)
7. [x] Blob shading (per owner): head is WHOLE dark — uniformly #F73923 (measured L range
   0.001 / C range 0.004 across head tiles); only the TRACES soften, driven by trace AGE
   (`lifeAt`), along a fixed-hue OKLCH ramp #F73923 → light low-chroma tint (measured
   t0→t5: L 0.63→0.85 rising, C 0.20→0.02 falling, hue 30–33°). The rim dither eases
   off with age so aged traces fade cleanly. Colour never follows the radial profile.
8. [x] Head shape: lattice-snapped binary pixel disc (`HEAD_R` 2.5 tiles → canonical 21-tile circle), phase-invariant, all tiles exact #F73923; traces in tile units, 3 rows vs the disc's 5; fast-frame node interpolation
