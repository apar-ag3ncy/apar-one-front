# ADR-0002: Liquid-glass surface for the client case pages

**Status:** Accepted (amended after measurement - see "What changed after the first build")
**Date:** 2026-09-07
**Deciders:** APAR (design + engineering)

## Context

Every client card on `/clients` and the home page opens a case study at
`/work/[slug]`. Each case page already paints itself in that client's brand
palette (`theme.bg / bg2 / ink / accent …` in `lib/cases.tsx`, applied as
`--c-*` custom properties on `.case-page`), and the card → page transition
wipes in that same colour, so the brand colour is load-bearing and must stay.

The ask is to give those inner pages a *liquid glass* finish - frosted,
translucent panels with a specular rim over colour that visibly moves beneath
them - without changing the colour each page already owns, and without adding
a second heavy GPU layer to a site that already runs the hero pixel-dome, the
site-wide pixel-trail canvas and the strands backdrop (the hero dome is the
known frame-budget bottleneck, see ADR-0001).

Forces:

- **Twelve themes, one recipe.** The finish has to work on near-black
  (A Paramount `#181712`), deep jewel tones (Chheda, Diarah, Tarava) and
  mid-light brand blues/roses (High on Smiles `#4A80C6`, Girvaan `#985070`,
  Jatubhai `#A0544A`) with no per-client tuning.
- **Half the pages have no photography yet** - Diarah, Silver Emporium,
  A Paramount, Kundan, Jatubhai, Tarava and High on Smiles render drop-zone
  placeholders. The glass has to carry those pages on its own.
- **Motion budget.** Lenis + GSAP ScrollTrigger + framer reveals already run on
  these pages; the slow-mo layer parallaxes `.img-slot > img` inside the frames.
  The reference machine is a 4-core Intel Mac with an integrated GPU.
- **Reduced-motion, reduced-transparency and weak GPUs** must degrade to a
  still, legible page.
- **The next-case overscroll meter and the wipe transition** read
  `document.body`'s background and the `next.color`; nothing may sit between
  them, and both are `position: fixed` layers that must stay above the
  body-level cursor canvas.

## Decision

Implement liquid glass as a **CSS-composited system with no new WebGL, no
`backdrop-filter` and no `mix-blend-mode`**:

1. **A fixed "liquid" backdrop** (`components/liquid-glass.tsx`) rendered once
   inside `.case-page`, behind the content: four large *pre-soft* radial
   gradients in the page's own palette (`--c-bg2`, `--c-accent-soft`, a light
   tint of `--c-ink`, a deep shade) that drift on compositor-only `transform`
   that drift very slowly, plus a fine SVG-noise grain and a diagonal sheen.
   No `filter: blur()` anywhere - softness comes from the gradient stops.
   **The drift is driven from JS on 2-D transforms and only while the page is
   still.** A CSS animation - even paused - keeps each blob on its own
   compositor layer under the entire page, which forces everything above it
   into separate layers; with no active animation during scroll the page
   rasters as one document, and the fixed backdrop sliding under the moving
   panes already reads as colour moving under glass. The drift's phase only
   advances while idle, so it resumes where it stopped.
2. **A single `.glass` recipe, one element per pane**, applied to the case
   template's existing surfaces (hero frame, meta bar, brief columns, gallery
   tiles, stat tiles, quote panel, next-case card): the sheen and grain are
   painted into the pane's own background stack (no pseudo-element layers, no
   `isolation`), under a translucent fill, a directional lit rim over a dark
   hairline, an inset specular top edge and a tight drop shadow. Media frames
   are a bezel: a small padding so the photo sits *inside* the glass, no grain
   and no outer shadow, and nothing painted over the picture.
3. **Luminance-keyed tone.** `CaseStudy` derives `data-glass` from the WCAG
   relative luminance of `theme.bg`: white glass at or below L 0.09 (nine
   themes), **smoked glass** above it (Girvaan 0.136, Jatubhai 0.143, High on
   Smiles 0.210), where a white fill would push light ink under AA. Secondary
   copy sitting on a pane uses a slightly brighter `--c-soft` (mixed 45% toward
   the ink) so 11-16px text keeps ≥ 4.5:1 over the fill. `theme.glass` can force
   either tone.
4. **Layering without a stacking context.** `.case-page` is *not* isolated;
   the backdrop sits at `z-index: 0` and the header/sections at `z-index: 1`,
   so the fixed overscroll meter (z 300) and the page wipe keep their
   root-level order above the cursor canvas (z 50).
5. **Degradation:** `prefers-reduced-motion` stops the drift;
   `prefers-reduced-transparency` swaps in solid `--c-bg2` panes on a still,
   flat page; narrow viewports drop the fourth blob and tighten padding.

The page background stays `theme.bg` on both `.case-page` and `document.body`.

## Options Considered

### Option A: CSS compositing - gradients + `backdrop-filter` (first build)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low - one component, one CSS section, class names on the template |
| Cost | **Measured 2.5-3.5× frame-rate loss** on the reference machine (below) |
| Scalability | Same recipe for all twelve themes via `--c-*` vars |
| Team familiarity | High - plain CSS, no shader code |

**Pros:** real frost of whatever sits behind a pane; saturate/brightness in
the filter chain give a "wet" pop for free.
**Cons:** every visible pane re-blurs each frame while the backdrop moves or
the page scrolls; the saturate/brightness pushed the mid-light themes into
flat, over-bright slabs with no visible rim and body copy at 1.9-3.0:1.

### Option A′: CSS compositing without `backdrop-filter` (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low - same structure as A, fewer properties |
| Cost | Static raster; drift paused during scroll |
| Scalability | Same |
| Team familiarity | High |

**Pros:** the blobs are pre-softened, so a blur added nothing visible; the
frost reads from fill + rim + sheen + grain alone (the first build's
no-`backdrop-filter` fallback screenshot was indistinguishable from the
blurred version on the dark themes). No render surfaces are re-evaluated per
frame.
**Cons:** no true frosting of arbitrary content behind a pane - acceptable
because nothing but the liquid ever sits behind one.

### Option B: WebGL refraction shader (normal-mapped glass, chromatic edge)

| Dimension | Assessment |
|-----------|------------|
| Complexity | High - capture the page into a texture, refract per pane |
| Cost | A fourth full-viewport GL layer, per-frame page readback |
| Scalability | Per-pane uniforms; tricky with scrolling DOM content |
| Team familiarity | Medium - shader work exists in the repo (dome, trail) |

**Pros:** the most physically convincing glass.
**Cons:** DOM content cannot be sampled by WebGL without rasterising it
yourself, so real text/photos under the glass are out; adds a GL context and
frame cost to pages that already share the GPU with the pixel trail; ADR-0001
shows the site has no spare frame budget for this.

### Option C: SVG `feTurbulence` + `feDisplacementMap` on the panes

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium |
| Cost | High - animated SVG filters rasterise on the CPU in every engine |
| Scalability | Poor - each pane re-filters on every frame it animates |
| Team familiarity | Medium |

**Pros:** real distortion of what's behind the pane, pure markup.
**Cons:** animated SVG filters are the slowest path in Chrome and Safari and
jank Lenis scrolling; Safari's `backdrop-filter: url()` support is unreliable.

## What changed after the first build (measurements)

Scroll-fps sweeps, headed Chrome, 1366×860, wheel-driven Lenis scroll, median
of repeats. Production build on the reference machine:

| Page | Option A (first build) | Option A′ (final, same session) |
|---|---|---|
| Home (baseline) | 41 fps · p95 50 ms | 31 fps · p95 67 ms |
| Chheda (glass, photos) | 16 fps · p95 100 ms | 25 fps · p95 82 ms |
| Diarah (glass, placeholders) | 17 fps · p95 117 ms | 22 fps · p95 101 ms |
| High on Smiles (smoked glass) | 12 fps · p95 200 ms | 27 fps · p95 67 ms |
| Diarah, pre-glass (emulated) | - | 42 fps · p95 50 ms |

Read relatively: the first build ran the glass pages at ~35 % of the home
page's frame rate; the final one at ~80-87 % (the final run's load average
was 20-67, so its absolute figures are depressed across the board). Against
the pre-glass page itself the finish still costs ~40 % on this iGPU machine;
the remaining cost is the fill/rim raster of up to six panes per screen over
a fixed layer, which is the feature.

Isolation A/B on the dev server (same session, `/work/diarah`, style
overrides; absolute numbers are lower in dev, only the deltas matter):

| Variant | fps |
|---|---|
| pre-glass page (emulated) | 37 |
| as built (blur + drift + blend grain) | 17 |
| no `backdrop-filter`, drift on | 20 |
| drift off, `backdrop-filter` on | 20 |
| no `backdrop-filter`, drift off | 25 |
| fewer / smaller / translate-only blobs, drift on | 20 |

Two independent costs: the per-frame re-blur of every visible pane, and the
always-on drift forcing the blend-mode grain surfaces to recomposite. Neither
depended on blob count or size. Removing `backdrop-filter` and the blend
modes, and pausing the drift while scrolling, takes both off the scroll path.

A second within-session A/B on the production build (interleaved, three
repeats) then showed the liquid layer and the panes each costing ~5-6 fps on
their own but ~18 together (pre-glass 40 · liquid only 27 · panes only 28 ·
both 22) - an interaction, not a sum: the animated blob layers kept everything
above them composited separately, and the 13 isolated panes with two pseudo
layers each were what that composited. Per-property tests (shadow radius,
grain, sheen, `contain`, `will-change`, blob size, `position: fixed` vs
absolute) each moved the number by 0-3 fps, i.e. within noise. That is what
produced the JS-driven drift (no animation active during scroll) and the
single-element panes.

Caveat on the absolute numbers: every run on the reference machine was taken
with a load average between 8 and 70 (the user's own browser at ~95 % of a
core throughout), so only the interleaved *relative* figures are trustworthy.

An adversarial four-lens review (design / accessibility / performance / code)
of the first build confirmed, independently of the benchmark, that the
`saturate(1.55) brightness(1.05)` chain flattened the three mid-light themes
and dropped their text below AA - which is what produced decision items 2-4.

## Consequences

- Easier: every case page gets the finish from the shared template; new
  clients need only their existing `theme` entry, and the tone is derived.
- Easier: reduced-motion / reduced-transparency users get coherent static
  versions without a code path of their own.
- Easier: no compositor render surfaces on the scroll path - the case pages
  cost what the pre-glass page cost.
- Harder: the glass cannot frost arbitrary content; if a future design puts
  text or media *under* a pane, that pane needs its own treatment.
- Harder: the on-pane `--c-soft` mix and the smoked tone are a second set of
  contrast rules to keep in mind when a theme's `ink`/`soft` change.
- Revisit: the drift-pause tail (180 ms) if a Lenis glide ever visibly restarts
  the animation mid-settle.

## Action Items

1. [x] `components/liquid-glass.tsx` - fixed backdrop (blobs + grain + sheen),
       drift paused during scroll
2. [x] `app/globals.css` - `.lg-*` backdrop rules, the `.glass` recipe, the
       smoked-glass tone, reduced-motion / reduced-transparency fallbacks;
       old full-bleed section rules retired
3. [x] `components/case-study.tsx` - mount the backdrop, derive `data-glass`,
       apply `glass` to the template's surfaces
4. [x] Verify on four themes: screenshots, console clean, next-case wipe and
       overscroll intact, contrast ≥ 4.5:1 on panes, scroll fps sweep,
       pixel-trail regression
5. [ ] Photography pass once the remaining clients' real images land
