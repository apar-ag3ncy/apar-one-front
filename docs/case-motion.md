# Client story motion

The thirteen client stories share a GSAP lifecycle and keep their own colours,
copy, logos and artwork. The desktop gallery adapts the opening / horizontal
journey / next-project rhythm of https://lusion.co/projects/spaace/. It uses
APAR's assets rather than Lusion's scenes or shaders.

Typography restores the original Newsreader / Archivo pairing and the earlier
per-client font stacks. Newsreader and Archivo are hosted locally; optional
client-specific typefaces retain their original system fallbacks. The existing
APAR Fit wordmark and client logo artwork are separate brand assets.

## Ownership

| File | Responsibility |
| --- | --- |
| `lib/cases.tsx` | Client copy, palette, gallery entries, results and next-client link |
| `lib/case-motion.ts` | Brand form, direction, restrained velocity bend, opening ease and curated media |
| `lib/case-assets.ts` | Build-time file checks and image dimensions; no browser metadata requests |
| `components/featured-card.tsx` | Pointer / keyboard card interactions and branded route transition |
| `components/case-motion/use-case-motion.ts` | Opening, progressive brief, results, quote and next-preview motion |
| `components/case-motion/case-gallery.tsx` | Pinned desktop rail, native touch rail, artwork controls and progress |
| `components/case-motion/brand-signature.tsx` | Lazy scene loading and pointer easing |
| `components/case-motion/create-brand-scene.ts` | Small Three.js identity study; paints on input, stops offscreen, disposes GPU resources |
| `app/case-motion.css` | Responsive sizing and presentation of these components |

`SlowMo` must continue excluding `.case-page` and `.client-story`: two animation
owners must not write to the same media transform. Opening motion targets the
inner art while scroll motion targets its outer figure. GSAP contexts and
matchMedia own cleanup when a route, breakpoint or motion preference changes.

Shared files also adjusted in this debugging pass:
`components/smooth-scroll.tsx`, `components/slow-mo.tsx`, `components/hero.tsx`,
`components/count-up.tsx`, `components/next-case-scroll.tsx`,
`components/scroll-fill.tsx`, `components/magnetic.tsx`,
`components/liquid-glass.tsx`, `components/photo-slot.tsx`,
`components/start-form.tsx`, `components/transition-provider.tsx`,
`app/layout.tsx` and `lib/scroll-state.ts`.
The case template is `components/case-study.tsx`; regression entrypoints are
`e2e/case-motion-check.mjs`, `e2e/mobile-menu-check.mjs` and
`e2e/pixeltrail-check.mjs` (`package.json` adds `test:cases`).

## Updating a story

Internal case pages use the shared white/black palette in
`lib/case-presentation.ts`. Client listing cards retain `data.theme`; original
images and the animated brand sculptures retain their colour. Case navigation,
next-story panels and transition wipes follow the white palette. Logo-only
fallbacks use the client's original palette and logo treatment through
PhotoSlot's `logoSurface`; the background is removed when a real photo loads.
Coloured LiquidGlass backdrops are not mounted on these pages. Scroll,
hover and opening choreography continue to use the existing motion profiles.

1. Add or edit its entry in `lib/cases.tsx`. Keep business claims approved.
2. Add real JPEG artwork to `public/work/<slug>/hero.jpg` and numbered gallery
   files, or point `CURATED_CASE_MEDIA` at existing supplied WebP assets.
3. Set the motion profile in `lib/case-motion.ts`. Choose `petal`, `facet`,
   `architecture` or `orbit`; tune the existing profile before adding new scenes.
4. Images reserve their measured proportions and remain whole in the case rail.
   Missing photographs use the client's existing identity; they do not request
   nonexistent files. Changing a PhotoSlot source resets its image/error state.

Pinning runs only at width >= 901px, height >= 600px and with motion enabled.
Other viewports use a native horizontal swipe rail. Reduced motion keeps the
content available without pinning, parallax or the interactive 3D study.
Counters follow artwork positions, not equal time slices: portrait and
landscape panels can have different widths. End space is measured from the
last artwork so the final panel centres and the counter can reach its final item.

### Chheda and A Paramount artwork

Both stories now map eight supplied photographs to eight labelled gallery
panels. `public/work/chheda/curated/` contains the jewellery shoot;
`public/work/a-paramount/curated/` contains architectural and ritual product
artwork. Their existing hero images remain in place. Exact source filenames,
export dimensions and file sizes are listed in `case-media-sources.json`.
Exports are WebP, at most 2000 × 1800 pixels, without cropping or recolouring.

The optional `gallery` motion profile controls lift, tilt, resting scale and
scrub lag. Chheda has a gentle alternating arc; Paramount has a straight lift
with no rotation. A single container-linked timeline per panel brings the
whole photograph to its original angle/scale at the viewport centre and eases
its caption in, then releases both on exit. Scrolling backwards reverses it.
These profiles also give the hero a soft masked opening. Smaller viewports and
reduced motion retain the complete, static photographs and native swipe rail.

### Girvaan, Kundan Jewellers and Harshit Gold artwork

Each story uses one supplied hero and eight whole product/campaign images in
`public/work/<slug>/curated/`. Girvaan also retains its existing campaign film.
The palettes and the shared white case-page layout remain unchanged. The
existing photo motion profile applies to the new artwork without adding a
second animation owner. Kundan's small supplied images are never upscaled.

`scripts/export-brand-case-media.mjs` recreates the WebP exports from the three
original folders and updates `case-media-sources.json`. The originals remain
outside the published bundle. Harshit Gold's supplied Illustrator artboard
provides its original vector logo; `/logos/harshit-gold.svg` contains those
paths rather than a typeset substitute. Its collection page uses an editorial
outcome and the supplied campaign line, with no fabricated results or client
testimonial. The image-only story is excluded from the film rail until its own
film is available. It is accessible from its Clients card and roster link.

## Verification

Run checks sequentially to avoid Next rewriting generated types during `tsc`:

```sh
npm run build
npx tsc --noEmit
npm run lint
git diff --check
npm run start -- --hostname 127.0.0.1 --port 3021
# In another terminal, with the production server running:
npm run test:cases
```

Check `/clients` and all `/work/<slug>` routes in the production server:
card hover and keyboard focus, opening, forward/reverse gallery scroll, arrow
alignment, skip-to-results and next-client transition. Check a phone, tablet,
desktop and a short laptop viewport. Check image loading, page overflow and
the browser console. Resizing while in the rail must remove/recreate the pin
without duplicate canvases or stuck scroll. Keep the image pixel trail aligned
with the artwork after these 2D transforms.

The regression uses Chrome by default; set `PW_EXECUTABLE` to an installed
Chrome for Testing executable when using another local Playwright runtime.
It saves results/screenshots to `/private/tmp/apar-case-motion` (or `OUTPUT`).

## Debugging fixes accompanying this layer

- Conflicting global / local parallax: one media owner per case page.
- Card zoom warnings: `quickTo` uses `scaleX` and `scaleY`, not CSS shorthand.
- Double anchor offset: respect Lenis's existing `scroll-margin-top` support.
- Browser / keyboard focus can scroll natively during a glide. Before an anchor
  or gallery-control glide, Lenis resets to the actual position via its public
  stop/start methods; locked mobile-menu links keep their native Next navigation.
- Delayed font work: cancel setup after unmount or a motion preference change.
- CountUp / next-case meter: cancel pending frames and stop completed loops.
- Liquid background: pause when hidden, scrolling or reduced motion is active.
- Photo replacement: key the image lifecycle by source so stale load/error
  state cannot leave a replacement image or fallback blank.
- Static shaded backgrounds on mid-light themes retain readable open copy
  without introducing animated backdrop blur.
- Native rails reserve height for captions and controls as well as the image,
  keeping tall portrait artwork whole on phones and tablets.
- The UI's original Newsreader / Archivo faces and the existing Fit wordmark
  load locally without relying on a Google Fonts stylesheet.
- A configured brief endpoint gets a 12-second deadline and cancels on unmount;
  the existing email handoff remains the fallback when no endpoint is configured.
