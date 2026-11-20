import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { TestimonialCarousel } = loadTypeScript("components/testimonials/testimonial-carousel.tsx");
const { CASES } = loadTypeScript("lib/cases/index.ts");
const pages = Object.values(CASES).map(data => ({
  slug: data.slug, name: data.card.name, category: data.card.cat,
  imageAlt: `${data.card.name} brand imagery`, logo: data.logo ?? `/logos/${data.slug}.png`,
  surface: data.theme.bg, quote: data.quote.text, by: data.quote.by,
  kind: data.quote.by.includes("Campaign line") ? "Campaign line" : "Client words",
}));

test("every brand has one accessible story with its original attribution", () => {
  const html = renderToStaticMarkup(createElement(TestimonialCarousel, { pages }));
  assert.equal((html.match(/aria-roledescription="slide"/g) ?? []).length, pages.length);
  for (const page of pages) {
    assert.ok(html.includes(`id="tc-story-${page.slug}"`));
    const escapedBy = renderToStaticMarkup(createElement("span", null, page.by)).slice(6, -7);
    assert.ok(html.includes(escapedBy), `Missing attribution: ${page.slug}`);
  }
  assert.match(html, /Campaign line/);
  assert.match(html, /Client words/);
  assert.doesNotMatch(html, /Previous brand story|Next brand story/);
  assert.match(html, /Swipe, drag or use the arrow keys/);
  assert.match(html, /aria-label="Pause automatic stories"/);
  assert.ok(html.includes('id="tc-story-manish-jewellers"'));
  assert.match(html, /Manish Jewellers · Campaign line/);
});

test("each published voice plays inside its assigned brand's testimonial", () => {
  const { CLIENT_VOICES } = loadTypeScript("lib/client-voices.ts");
  const html = renderToStaticMarkup(createElement(TestimonialCarousel, { pages, voices: CLIENT_VOICES }));
  const stories = html.match(/<article\b[^>]*id="tc-story-[^"]+"[\s\S]*?<\/article>/g);
  for (const [slug, name] of [["chheda", "Viral"], ["a-paramount", "H1CCUP"]]) {
    const card = stories.find(story => story.includes(`id="tc-story-${slug}"`));
    assert.ok(card?.includes(`aria-label="Play ${name}&#x27;s voice note"`));
  }
  assert.equal((html.match(/<audio /g) ?? []).length, 2);
  assert.doesNotMatch(html, /In their own|class="cv-grid"/);
});

test("private recording starts only after interaction, without eager audio downloads", () => {
  const html = renderToStaticMarkup(createElement(TestimonialCarousel, { pages }));
  assert.match(html, /Leave APĀR a private voice note/);
  assert.doesNotMatch(html, /Start recording|Private voice feedback/);
  assert.doesNotMatch(html, /<audio|autoplay|<canvas/);
});

test("no empty carousel or controls render when there are no stories", () => {
  assert.equal(renderToStaticMarkup(createElement(TestimonialCarousel, { pages: [] })), "");
});

test("MJ is not added to the homepage featured grid or recommended-brand ticker", () => {
  const { FeaturedProjects } = loadTypeScript("components/home/featured/index.tsx");
  const { MovingClients } = loadTypeScript("components/home/featured/moving-clients.tsx");
  for (const Component of [FeaturedProjects, MovingClients]) {
    const html = renderToStaticMarkup(createElement(Component));
    assert.match(html, /\/work\/signi/);
    assert.doesNotMatch(html, /manish-jewellers|Manish Jewellers/);
  }
});
