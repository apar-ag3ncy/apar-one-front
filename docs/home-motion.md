# Homepage motion

The homepage keeps its existing content order, artwork, typography and two-column desktop work grid. The motion takes its pacing and curved media treatment from [Lusion](https://lusion.co/); no reference assets are copied.

## Editorial direction

The opening uses the red pixel arc on a near-black field behind the rotating
Fit wordmark. Its leading glyph alternates strictly between Hindi अ and English A;
no other scripts join the sequence. The studio quote sits on the plain page surface. Later sections alternate
between warm paper and ink.

Testimonial photos overlap peach-tinted quote panels. The Chheda Jewellers and A Paramount panels include their assigned voice notes. The extra brand-name selector and previous/next buttons are removed. Native
swipe, mouse drag and keyboard controls navigate the same original stories. Client
logos sit on an ink section with white heading and monochrome white marks.
Hover/focus restores only the selected logo's colours. Logo links have no filled
hover backdrop, so the dark section stays continuous. The footer retains its near-black background,
cream contact links and full-width galaxy. Full-screen creative exhibits retain
their original palettes.

`LiquidTextScroll` applies the studio's liquid distortion to text throughout
every route: headings, paragraphs, captions, testimonials, FAQ answers, link and
button labels, and footer copy. The shared layer discovers text-only groups
without rewriting React's DOM or touching media. It preserves each text colour.
Incoming text transitions from 116% to 68% of viewport height, with its filter
prepared before entering the screen. Outgoing text starts melting when its
bottom passes 58%, reaching full distortion at 12%. The longer exit and hero
curves ramp up immediately; the hero stretches over 70% of a viewport. Both
directions use the same position mapping.
Each fresh viewport entry, from the top or bottom, also starts fully liquid and
has a 700ms blur-to-clear reveal floor. This re-arms on every re-entry and keeps
fast scrolls from skipping the transition. Initial visible copy stays readable.
The centre remains clear; interactive hover and keyboard focus bypass the effect.
A stationary cursor over ordinary text no longer suppresses its entrance.

Only visible or just-entering text receives SVG dilation, blur, alpha merging and
displacement. A bounded idle filter pool avoids allocating a filter per word or
per page. One passive scroll listener batches layout reads before writes and
parks between events, except while a fresh arrival is resolving. Mutation observation covers route/FAQ/carousel changes;
resize and font loads update measurements. Phones retain native scrolling with
a gentler version. Reduced motion and pre-hydration text stay sharp. Navigation,
brand artwork, editable fields and dialogs stay usable without distortion.
The previous one-shot line reveals and separate heading blur are removed.

The clients section and FAQ/film boundary are straight at rest. On desktop,
`section-edge-motion.ts` gives each visible boundary one shallow, symmetrical
bend, using Featured Work's signed velocity limit of 14px and settling rate.
Scrolling down pulls the centre down; scrolling up reverses it. When scrolling
stops, the boundary settles exactly flat and its animation loop stops. A 40px
SVG strip paints only the difference from the original straight join, keeping
section content and layout stationary. Offscreen edges, hidden tabs, resize,
phones and reduced motion all reset to straight edges. There is no wave mask,
permanent curvature, extra scroll distance or pinning.

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
