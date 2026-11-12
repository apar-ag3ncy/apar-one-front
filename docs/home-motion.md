# Homepage motion

The homepage keeps its existing content order, artwork, typography and two-column desktop work grid. The motion takes its pacing and curved media treatment from [Lusion](https://lusion.co/); no reference assets are copied.

## Responsibilities

- `components/motion/pixel-trail.tsx` retains the original red/peach glassy pixel cursor blob. It pauses over the existing pixel beam, footer galaxy and internal image-pixel effects; its loop parks once the tail dissolves.
- `components/home/featured/featured-scroll-runtime.ts` uses one canvas for the whole work grid. Photographs fill the unchanged landscape cards with the minimum proportional crop and no additional zoom. Signi keeps its face-safe focal point and tiny export-edge trim. Curved scroll edges, gentle card parallax and hover lift move the whole surface. Texture uploads are cached per source and display size. The HTML images disappear only after their first successful draw and return on cleanup or context loss.
- `components/home/featured/use-featured-hover.ts` owns the caption arrow and letter exchange. It never writes image transforms.
- `components/home/bento-motion.tsx` moves collage photographs inside the existing cells using GSAP transforms. It does not alter the grid or animate copy.

All new effects use `DESKTOP_MOTION_QUERY`. Phones, coarse pointers and reduced-motion preferences keep static photographs and normal document scrolling. The image renderers allocate no phone WebGL contexts. Current page links remain ordinary HTML links throughout.

## Editing and checking

Keep scroll bending bounded in `lib/motion/media-plane.ts`; excessive curvature distorts client artwork. Keep corner radii consistent with `.flow-project-image` in `styles/home-flow.css`.

Run `npm run check` and `npm run check:production`. The pure tests cover minimal filled-frame crops across portrait/landscape sources and responsive densities, mesh coverage and bounded scroll bending. Run `npm run test:motion` only when the local browser preview is permitted; it captures desktop and phone images in ignored `reports/motion/` and checks grid alignment, fallback images and breakpoint cleanup. Inspect those captures and scroll in both directions before calling the motion visually verified.

The existing pixel-cursor ADRs and `npm run test:pixeltrail` still apply. The newer fluid wake was removed at the user's request; the Featured Work and bento motion remain.
