# Homepage motion

The homepage keeps its existing content order, artwork, typography and two-column desktop work grid. The motion takes its pacing and curved media treatment from [Lusion](https://lusion.co/); no reference assets are copied.

## Editorial direction

Middle sections and internal pages use white with ink text, APAR-red accents
and generous spacing. The landing hero retains its original near-black base,
red pixel arc and cream wordmark. `BandBackdrop` uses the original shader palette
on every device; its geometry and performance gates are unchanged. The hero
fades into the cinematic quote through the same dark-to-image transition.
The original Fit wordmark and supplied client logos keep their typography.

Testimonial photos overlap peach-tinted quote panels, and public voice cards
alternate peach and lilac. The extra brand-name selector and previous/next buttons are removed. Native
swipe, mouse drag and keyboard controls navigate the same original stories. Client
logos sit on a black section with white heading and monochrome white marks.
Hover/focus restores only the selected logo's colours. Logo links have no filled
hover backdrop, so the black section stays continuous. The footer retains its near-black background,
cream contact links and full-width galaxy. Full-screen creative exhibits retain
their original palettes.

No background texture, new animation loop or dependency is added for this theme.
Mobile copy remains static, and existing native phone scrolling is unchanged.
The diamond showcase has a black outer section with white copy; the interactive
stage retains its Manish Jewellers burgundy palette. The stage sits outside the
copy container, spanning the full page width and one stable viewport height with
square edges. Desktop scroll chapters begin when the stage reaches the viewport
top. Phones and reduced-motion layouts retain normal flow and manual controls.

Every homepage dark/light boundary uses a short CSS colour blend inside the
existing section padding: Featured Work → diamond, diamond → bento, bento →
clients, clients → testimonials, and FAQ → footer. The hero/quote keeps its
artwork-aware transition. White-to-white joins need no overlay. These edges
are decorative, ignore pointer input and add no page height, text animation,
canvas, scroll listener or rendering loop. Their height follows the spacing
token (32px on phones, up to 48px on desktop); forced-colour mode hides them.
The existing single Lenis/GSAP clock handles desktop input. Phones keep native
scrolling, and the diamond's existing desktop chapters remain unchanged.

## Responsibilities

- `components/motion/pixel-trail.tsx` retains the original red/peach glassy pixel cursor blob. It pauses over the existing pixel beam, footer galaxy and internal image-pixel effects; its loop parks once the tail dissolves. The entire Recommended by the best section opts out with `data-no-pixel-trail`: CSS hides the trail immediately, and the renderer clears and parks until the pointer leaves. Logo colour hover stays independent.
- `components/home/featured/featured-scroll-runtime.ts` uses one canvas for the whole work grid. Photographs fill the unchanged landscape cards with the minimum proportional crop and no additional zoom. Signi keeps its face-safe focal point and tiny export-edge trim. Curved scroll edges, gentle card parallax and hover lift move the whole surface. Texture uploads are cached per source and display size. The HTML images disappear only after their first successful draw and return on cleanup or context loss.
- `featured-pixel-hover.ts` adds the same photo-coloured hover mosaic to that existing renderer. A small single-channel mask uses one byte per 15×10px tile, an 80px brush radius and a 900ms fade; the photograph itself is never uploaded again during hover. Sampling in the photo's UV coordinates follows the existing curved mesh. `lib/motion/image-pixels.ts` owns the mask and shared settings. The RAF parks when the trail has faded; blur, resize, offscreen, hidden-tab and unmount states clear it. The HTML image-pixel hook takes over if WebGL is unavailable. Both renderers suppress the orange global cursor independently, and phone/reduced-motion layouts allocate no hover renderer.
- `components/home/featured/use-featured-hover.ts` owns the caption arrow and letter exchange. It never writes image transforms.
- `components/home/bento-motion.tsx` moves collage photographs inside the existing cells using GSAP transforms. It does not alter the grid or animate copy.
- Motion (`motion/react`) owns magnetic CTA feedback, the scroll-progress indicator, case-page wipes and voice-player press feedback. `MotionProvider` honours the system reduced-motion preference. CTA wrappers keep a stationary hit area; only their inner surface moves, bounded to 6px horizontally and 4px vertically. Page wipes run only on desktop and reveal after the destination route mounts. Voice playback still starts directly from the native button click, with no audio prefetch.

GSAP effects use `DESKTOP_MOTION_QUERY`; Motion components follow the same phone and reduced-motion policy. Phones and coarse pointers keep static text, static photographs and normal document scrolling. The voice play button retains brief press feedback unless reduced motion is requested. The image renderers allocate no phone WebGL contexts. Current page links remain ordinary HTML links throughout.

## Editing and checking

Testimonials use a native horizontal story gallery (`use-story-gallery.ts`),
with one article per brand, including Manish Jewellers. Swipe, horizontal
trackpad scrolling, mouse drag and Arrow/Home/End keys control the same scroll
position. Vertical gestures continue down the page; there is no wheel hijacking,
strip cloning or continuous animation loop. Position measurements are cached on
resize; a scroll event schedules at most one update per frame.

`use-story-playback.ts` connects visibility and interaction state to the small
`lib/motion/story-playback.ts` controller. A single timeout advances one story
after 2.5 quiet seconds; it reverses direction at either end. Hover, keyboard
focus, touch contact, a hidden tab, an offscreen gallery and the pause control
each suspend playback independently. Scrolling restarts the reading interval.
Reduced motion disables automatic advancement and uses instant navigation.
Cleanup removes the timer, observers and listeners. Phone text has no separate
animation; the complete story moves with the native scroll container.

MJ uses the approved “Crafted through generations” campaign line, labelled as
such. It is not presented as an invented client review. Its dedicated project
page and client-directory card use the supplied assets. It remains excluded
from the homepage Featured Work grid and logo ticker.

`styles/glass.css` owns the shared action surfaces. Reflective rims and hover
highlights use painted gradients; only the testimonial quote panel uses a small
desktop backdrop blur. Phones use an opaque quote surface, native swipe and
static text. Public voice players retain tap-to-load audio, and submitted voice
feedback remains private. The testimonial/audio styles load with the homepage;
project-form styles load with `/start`.

The visual references were the public 21st.dev
[Liquid Glass Button](https://preview.21st.dev/@designali-in/components/liquid-glass-button)
and [Glass Testimonial Swiper](https://21st.dev/@jahed/components/glass-testimonial-swiper)
previews. The implementation is original and adds no component dependencies.

Keep scroll bending bounded in `lib/motion/media-plane.ts`; excessive curvature distorts client artwork. Keep corner radii consistent with `.flow-project-image` in `styles/home-flow.css`.

Run `npm run check` and `npm run check:production`. The pure tests cover minimal filled-frame crops across portrait/landscape sources and responsive densities, mesh coverage and bounded scroll bending. Run `npm run test:motion` only when the local browser preview is permitted; it captures desktop and phone images in ignored `reports/motion/` and checks grid alignment, fallback images and breakpoint cleanup. Inspect those captures and scroll in both directions before calling the motion visually verified.

The existing pixel-cursor ADRs and `npm run test:pixeltrail` still apply. The newer fluid wake was removed at the user's request; the Featured Work and bento motion remain.
