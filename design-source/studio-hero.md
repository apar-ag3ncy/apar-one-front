# Limitless studio background

Original artwork generated with the built-in image generation tool on 2026-11-12.
No client logo, photograph or text is embedded in this asset. The heading stays live HTML.

Source: `/Users/apar/.codex/generated_images/01a1117a-29ec-74e2-a661-8a5d03e02ad4/exec-8836b401-0f2f-4058-abef-b4efddbc4972.png`.

Production exports: `public/images/studio/limitless-{640,960,1536}.webp`.
Full-frame WebP exports at quality 82; the original stays unchanged. CSS supplies
the portrait crop and contrast overlay. Source dimensions: 1536 × 1024.

## Generation prompt

Create a refined cinematic photorealistic art-direction photograph for the full-bleed background of APAR creative agency's 'Limitless. Beyond Culture.' section. It is a BACKGROUND ASSET ONLY, NO TEXT, NO LETTERING, NO LOGOS, NO UI. Wide landscape 3:2 composition. A vast quiet pale warm limestone landscape merging into an ivory misty sky; on the RIGHT third a single monumental softly rounded open travertine arch, sculptural architecture, with a very elegant long flowing vivid vermilion-red silk ribbon suspended in a loose graceful twisting loop emerging through the arch, subtly lifting into space; the ribbon has realistic translucent edges, delicate folds, directional sunlight, editorial fashion campaign quality. The arch is surreal but physically tactile, pores and soft shadows visible, one compelling focal object, refined gallery-installation atmosphere. LEFT 52 percent is spacious pale ivory mist with a very subtle stone horizon low in the frame, almost no objects, perfectly legible space for dark typography that will be added in HTML, must be light throughout this area. Ground is pale warm cream, quiet curved dune shapes. Warm grazing side lighting, soft film grain, sophisticated restrained palette of cream, limestone, pale sand and one striking APAR red-orange fabric. Wide lens, understated scale and depth, art photography quality, realistic natural materials, asymmetric balanced composition. No people, no jewellery, no extra architectural clutter, no heavy blue or gold, no stars, no gradients drawn as graphic art. Make this a beautiful original photographic environment, not a web design mockup.

## Motion and access

- `components/home/featured/progressive-quote.tsx` owns the image and its scoped GSAP timeline.
- Normal document flow, no sticky hold, GSAP pin/spacer or extra rendering loop.
- The beam fades into its dark base; the image fades out of the same colour.
  Small static gradient overlays bridge the boundary without masking the full
  WebGL canvas or covering controls.
- Parallax tracks scroll directly; Lenis supplies the desktop easing once.
- Small transform-only parallax; desktop fine pointers only.
- Static copy and artwork on phones, touch devices and reduced motion.
- Reference: https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ and https://gsap.com/docs/v3/Plugins/ScrollTrigger/.
