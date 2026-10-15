"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * SlowMo - the site's cinematic slow-motion layer (GSAP + ScrollTrigger), riding
 * the Lenis/ticker sync set up in <SmoothScroll>. Mounted once in the layout and
 * re-armed on every route change. Four effects, all declarative by selector:
 *
 *  1. MEDIA PARALLAX + SLOW ZOOM  - every real image inside a frame drifts slower
 *     than the page and slowly zooms out. `scrub: 0.45` makes the tween LAG the
 *     scroll by ~0.45s - that lag is the slow-motion feel. Animated on the inner
 *     <img> so it never fights the framer <Reveal> wrappers or CSS hover scales.
 *  2. VELOCITY SKEW - frames skew/stretch with scroll speed and settle over ~0.55s
 *     (Lusion's signature), via quickTo on the frame wrappers.
 *  3. SLOW LINE REVEALS - large statements split (SplitText, free in GSAP 3.13+)
 *     into masked lines that rise over 1.1s with a long stagger. Headings that
 *     already use the framer word-split are skipped.
 *  4. FOOTER WORDMARK - the giant mark rises in slow parallax as the footer enters.
 *
 * No-ops under prefers-reduced-motion; the horizontal gallery is excluded (it owns its native scroll).
 */
export function SlowMo() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const media = gsap.matchMedia();
    // Touch scrolling is native. Keep the cinematic per-frame layer on wider
    // screens, where its image parallax, velocity skew and SplitText have room
    // to breathe; on phones they compete with touch scrolling and hydration.
    media.add("(min-width: 741px) and (prefers-reduced-motion: no-preference)", () => {
    const splits: SplitText[] = [];
    let alive = true;
    const ctx = gsap.context((self) => {
      // ---- 1) media parallax + slow zoom ---------------------------------------
      const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".img-slot > img")).filter(
        (img) => !img.closest(".pin, .flow-project, .client-story, .testimonial-carousel, .case-page, .hero-beam, .footer, .nav, #intro")
      );
      for (const img of imgs) {
        const wrap = (img.closest(".frame, .si-fig, .img-slot") as HTMLElement) ?? img;
        gsap.fromTo(
          img,
          { yPercent: -3, scale: 1.12 },
          {
            yPercent: 3,
            scale: 1.08, // enough overscan for the three-percent drift
            ease: "none",
            scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.45 },
          }
        );
      }

      // ---- 2) velocity skew on the frames --------------------------------------
      const frames = Array.from(document.querySelectorAll<HTMLElement>(".work-card .frame, .si-fig, .hero-feature .frame")).filter(
        (el) => !el.closest(".pin")
      );
      if (frames.length) {
        const skewTo = frames.map((el) => gsap.quickTo(el, "skewY", { duration: 0.55, ease: "power3.out" }));
        const scaleTo = frames.map((el) => gsap.quickTo(el, "scaleY", { duration: 0.55, ease: "power3.out" }));
        let vel = 0;
        ScrollTrigger.create({ onUpdate: (self) => (vel = self.getVelocity()) });
        let idle = false;
        const tick = (_time: number, deltaTime: number) => {
          vel *= Math.exp(-Math.min(deltaTime, 64) / 120); // settle toward stillness between scroll events
          // Snap to rest: the geometric decay never reaches 0, and every quickTo
          // call restarts a 1.1s tween - so at rest this was ~2 tween restarts
          // and a transform write per frame per frame element, forever.
          if (Math.abs(vel) < 0.5) {
            if (idle) return;
            vel = 0;
            idle = true;
          } else idle = false;
          const skew = gsap.utils.clamp(-1.0, 1.0, vel / -1600);
          const stretch = 1 + Math.min(0.018, Math.abs(vel) / 50000);
          for (let i = 0; i < frames.length; i++) {
            if (!frames[i].isConnected) continue;
            skewTo[i](skew);
            scaleTo[i](stretch);
          }
        };
        gsap.ticker.add(tick);
        self.add(() => () => gsap.ticker.remove(tick)); // context-owned cleanup (no TDZ on `ctx`)
      }

      // ---- 3) slow line reveals on the big statements --------------------------
      const statements = Array.from(document.querySelectorAll<HTMLElement>("h1.display, h2.display, .feat, .hero-h1")).filter(
        (el) => !el.querySelector("span span") && !el.closest(".pin, .hero-beam, #intro") && el.textContent?.trim()
      );
      // `arm` may run later (fonts.ready): guard against a cleaned-up effect
      // (StrictMode's double invoke, a fast route change) and create the tweens
      // INSIDE the context via self.add so ctx.revert() owns them - otherwise the
      // ScrollTriggers/tweens made in the promise callback leaked, and under
      // StrictMode the statements were split twice.
      const arm = () => {
        if (!alive) return;
        self.add(() => {
        for (const el of statements) {
          splits.push(
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              linesClass: "sm-line",
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 112,
                  opacity: 0.4,
                  duration: 1.1,
                  ease: "expo.out",
                  stagger: 0.08,
                  scrollTrigger: { trigger: el, start: "top 88%", once: true },
                }),
            })
          );
        }
        });
      };
      // split once the web fonts are in, so the lines are measured on the real face
      if (document.fonts?.status === "loaded") arm();
      else document.fonts?.ready.then(arm).catch(arm);

      // ---- 4) footer wordmark slow parallax ------------------------------------
      const fw = document.querySelector<HTMLElement>(".footer-word");
      if (fw) {
        gsap.fromTo(
          fw,
          { yPercent: 22 },
          { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: 0.55 } }
        );
      }
    });

    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);
    window.addEventListener("load", refresh);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      for (const s of splits) s.revert();
      ctx.revert();
    };
    });
    return () => media.revert();
  }, [pathname]);

  return null;
}
