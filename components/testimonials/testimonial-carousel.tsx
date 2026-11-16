"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { PhotoSlot } from "@/components/media/photo-slot";
import { VoiceFeedback } from "@/components/voice/voice-feedback";
import { ClientVoices } from "./client-voices";
import { useStoryGallery } from "./use-story-gallery";
import { useStoryPlayback } from "./use-story-playback";
import type { ClientVoice } from "@/lib/client-voices";

export interface TestimonialStory {
  slug: string;
  name: string;
  category: string;
  image?: string;
  imageAlt: string;
  logo: string;
  logoTint?: string;
  logoInvert?: boolean;
  surface: string;
  quote: ReactNode;
  by: string;
  kind: "Client words" | "Campaign line";
}

export function TestimonialCarousel({ pages, voices = [] }: { pages: TestimonialStory[]; voices?: ClientVoice[] }) {
  const deck = useRef<HTMLDivElement>(null);
  const { track, active, advance, onKeyDown, onPointerDown, onPointerMove, onPointerEnd } = useStoryGallery(pages.length);
  const { paused, playing, reduced, togglePause } = useStoryPlayback(deck, pages.length, advance);
  if (!pages.length) return null;

  return <section id="testimonials" className="section testimonial-carousel" data-screen-label="Home - Testimonials" aria-labelledby="tc-title">
    <div className="wrap">
      <div ref={deck} className="tc-deck">
        <div className="tc-heading">
          <h2 id="tc-title">Every brand.<br /><em>A different story.</em></h2>
          <div className="tc-navigation">
            <span className="tc-count" aria-hidden="true">{String(active + 1).padStart(2, "0")}<span> / {String(pages.length).padStart(2, "0")}</span></span>
            {!reduced && pages.length > 1 && <button type="button" className="tc-pause"
              aria-label={paused ? "Resume automatic stories" : "Pause automatic stories"} aria-controls="tc-gallery"
              onClick={togglePause}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{paused
                ? <path d="m9 5 11 7-11 7Z" /> : <path d="M8 5v14M16 5v14" />}</svg>
            </button>}
          </div>
        </div>
        <div ref={track} id="tc-gallery" className="tc-gallery" role="region" aria-roledescription="carousel"
          aria-label="Brand stories. Swipe, drag or use the arrow keys to explore." tabIndex={0} onKeyDown={onKeyDown}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd} onLostPointerCapture={onPointerEnd}>
          {pages.map((page, index) => <article key={page.slug} id={`tc-story-${page.slug}`} className="tc-story"
            role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${pages.length}: ${page.name}`}
            data-brand={page.slug} data-active={index === active}>
            <div className="tc-hero" style={{ "--tc-brand": page.surface } as CSSProperties}>
              <PhotoSlot src={page.image} placeholder={page.imageAlt} fixedRatio="4/3" radius={0}
                logo={page.logo} logoTint={page.logoTint} logoInvert={page.logoInvert} logoSurface={page.surface} />
              <div className="tc-image-caption"><span className="tc-page-brand">{page.name}</span><span>{page.category}</span></div>
            </div>
            <div className="tc-copy">
              <div className="tc-page-top"><span>{page.kind}</span><span className="tc-quote-mark" aria-hidden="true">“</span></div>
              <blockquote>{page.quote}</blockquote>
              <p className="tc-by">{page.by}</p>
            </div>
          </article>)}
        </div>
        <div className="tc-progress" aria-hidden="true">{pages.map((page, index) =>
          <span key={page.slug} data-current={index === active} />)}</div>
      </div>
      <ClientVoices notes={voices} />
      <div className="tc-voice-wrap"><VoiceFeedback /></div>
    </div>
    <span className="tc-sr-only" aria-live={playing ? "off" : "polite"} aria-atomic="true">{pages[active]?.name} — story {active + 1} of {pages.length}</span>
  </section>;
}
