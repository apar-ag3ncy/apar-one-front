import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTypeScript } from "./load-typescript.mjs";

const { ClientVoices } = loadTypeScript("components/testimonials/client-voices.tsx");
const { CLIENT_VOICES, voiceTime, voiceWaveform } = loadTypeScript("lib/client-voices.ts");
const fixture = { id: "test-only", name: "Test speaker", brand: "Test brand", src: "/audio/testimonials/test.m4a", duration: 27, peaks: [.1, .6, 1] };

test("voice players reserve controls without fetching any audio on initial render", () => {
  const html = renderToStaticMarkup(createElement(ClientVoices, { notes: [fixture] }));
  assert.match(html, /aria-label="Play Test speaker&#x27;s voice note"/);
  assert.match(html, /aria-label="Seek within Test speaker&#x27;s voice note"/);
  assert.match(html, /aria-valuetext="0:00 of 0:27"/);
  assert.match(html, /<audio preload="none"/);
  assert.doesNotMatch(html, /\bsrc=|autoplay|<source|<canvas/);
});

test("an unpublished list renders no empty public player", () => {
  assert.equal(renderToStaticMarkup(createElement(ClientVoices, { notes: [] })), "");
});

test("only manually curated local audio can be published", () => {
  assert.equal(new Set(CLIENT_VOICES.map(note => note.id)).size, CLIENT_VOICES.length);
  for (const note of CLIENT_VOICES) {
    assert.match(note.src, /^\/audio\/testimonials\/[a-z0-9-]+\.(?:m4a|mp3|webm)$/);
    assert.ok(fs.existsSync(`public${note.src}`), `${note.src} is missing`);
    assert.ok(note.name.trim());
    assert.ok(Number.isFinite(note.duration) && note.duration > 0 && note.duration <= 65);
    assert.ok(note.peaks.length > 0 && note.peaks.every(value => Number.isFinite(value) && value >= 0 && value <= 1));
  }
});

test("duration and waveform output stay valid with unavailable browser metadata", () => {
  assert.equal(voiceTime(Infinity), "0:00");
  assert.equal(voiceTime(-1), "0:00");
  assert.equal(voiceTime(61.9), "1:01");
  assert.doesNotMatch(voiceWaveform([NaN, Infinity, -1, 2]), /NaN|Infinity/);
  assert.ok(voiceWaveform([]).length > 0);
});
