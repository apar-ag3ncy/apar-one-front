import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { Reveal } = loadTypeScript("components/motion/reveal.tsx");
const { ContactOrb } = loadTypeScript("components/voice/contact-orb.tsx");
const { TalkToUs } = loadTypeScript("components/voice/talk-to-us.tsx");

const hiddenStyle = /(?:opacity:\s*0(?:;|"|\s)|visibility:\s*hidden|display:\s*none|translateY\()/;

test("headings arrive visible before hydration, even with a stagger", () => {
  const html = renderToStaticMarkup(createElement(Reveal, {
    as: "h1", i: 8, delay: 1, className: "display", style: { marginTop: 8 },
  }, "Our work"));
  assert.match(html, /^<h1/);
  assert.match(html, /Our work/);
  assert.match(html, /margin-top:8px/);
  assert.doesNotMatch(html, hiddenStyle);
});

test("reveal wrappers do not hide routed links or nested buttons in server HTML", () => {
  const html = renderToStaticMarkup(createElement(Reveal, { as: "a", href: "/work/signi" }, "Signi"));
  assert.match(html, /href="\/work\/signi"/);
  assert.doesNotMatch(html, hiddenStyle);
  const nested = renderToStaticMarkup(createElement(Reveal, { i: 3 }, createElement("button", { type: "button" }, "Start")));
  assert.match(nested, /<button type="button">Start<\/button>/);
  assert.doesNotMatch(nested, hiddenStyle);
});

test("contact artwork exists without JavaScript, WebGL or a downloaded effect", () => {
  const html = renderToStaticMarkup(createElement(ContactOrb));
  assert.match(html, /class="ttu-orb-placeholder"/);
  assert.doesNotMatch(html, /canvas|ttu-orb-effect/);
  assert.doesNotMatch(html, hiddenStyle);
});

test("Talk to us has an accessible contact destination before hydration", () => {
  const html = renderToStaticMarkup(createElement(TalkToUs));
  assert.match(html, /<a[^>]*href="\/#contact"/);
  assert.match(html, /aria-label="Talk to us"/);
  assert.match(html, /ttu-orb-placeholder/);
  assert.doesNotMatch(html, hiddenStyle);
});
