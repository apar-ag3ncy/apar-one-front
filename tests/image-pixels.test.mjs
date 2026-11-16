import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { ImagePixelField, IMAGE_PIXEL_LIFE, IMAGE_PIXEL_RADIUS } = loadTypeScript("lib/motion/image-pixels.ts");
const { photoPoint } = loadTypeScript("lib/motion/media-plane.ts");
const { setImageHover } = loadTypeScript("lib/motion/image-hover.ts");
const { FeaturedPixelHover } = loadTypeScript("components/home/featured/featured-pixel-hover.ts");

test("image pixels retain the existing local radius and fade completely without pointer movement", () => {
  const field = new ImagePixelField();
  field.resize(600, 390);
  field.add(307.5, 205, 1000);
  assert.equal(field.paint(1000), true);
  assert.equal(field.data[20 * field.columns + 20], 255);
  for (let y = 0; y < field.rows; y++) for (let x = 0; x < field.columns; x++) {
    if (Math.hypot((x + .5) * 15 - 307.5, (y + .5) * 10 - 205) >= IMAGE_PIXEL_RADIUS) {
      assert.equal(field.data[y * field.columns + x], 0, "pixels must stay inside the local brush");
    }
  }
  field.paint(1000 + IMAGE_PIXEL_LIFE / 2);
  assert.equal(field.data[20 * field.columns + 20], 64);
  assert.equal(field.paint(1000 + IMAGE_PIXEL_LIFE), false, "the RAF can park after the trail fades");
  assert.ok(field.data.every(value => value === 0));
});

test("quick pointer sweeps fill between samples; resize and clear remove stale trails", () => {
  const field = new ImagePixelField();
  field.resize(600, 390);
  field.add(100, 205, 1000);
  field.add(400, 205, 1016);
  field.paint(1016);
  for (let x = 7; x < 27; x++) assert.ok(field.data[20 * field.columns + x] > 200);
  field.resize(601, 390);
  assert.equal(field.paint(1016), false);
  assert.equal(field.data.length, 41 * 39, "mask resolution depends on tiles, not device pixel ratio");
  field.add(NaN, 100, 1020);
  assert.equal(field.paint(1020), false);
  field.add(100, 100, 1030);
  field.clear();
  assert.equal(field.paint(1030), false);
});

test("hover locations follow the curved mesh, including scroll, entry and hover lift", () => {
  for (const entry of [0, .4, 1]) for (const bend of [-14, 0, 14]) for (const side of [-1, 1]) {
    const state = { entry, parallax: .7, hover: .8, x: .2, y: -.3 };
    for (const [u, v] of [[.05, .1], [.25, .75], [.5, .5], [.9, .9]]) {
      const w = 440, h = 286, progress = 1 - entry;
      const x = u * w + (u - .5) * w * (-.06 * progress)
        + Math.sin(v * 3.14159) * side * progress * 8 + state.x * state.hover * 3;
      const y = v * h + progress * 24 + Math.sin(u * 3.14159) * (bend + progress * 22 * (v - .5))
        + state.parallax * 6 - state.hover * 3 + state.y * state.hover * 3;
      const point = photoPoint(x, y, w, h, state, bend, side);
      assert.ok(Math.abs(point.x - u * w) < .01);
      assert.ok(Math.abs(point.y - v * h) < .01);
    }
  }
});

test("renderer handover cannot restore the global orange trail over an active photo", () => {
  const previous = global.document;
  global.document = { documentElement: { dataset: {} } };
  const html = {}, curved = {};
  try {
    setImageHover(html, true);
    setImageHover(curved, true);
    setImageHover(html, false);
    assert.equal(document.documentElement.dataset.onImage, "1");
    setImageHover(curved, false);
    assert.equal(document.documentElement.dataset.onImage, undefined);
  } finally {
    setImageHover(html, false); setImageHover(curved, false);
    global.document = previous;
  }
});

test("GPU masks allocate on hover, reuse uploads, stop on expiry and release on disposal", () => {
  const previous = global.document;
  global.document = { documentElement: { dataset: {} } };
  const calls = [];
  const gl = { TEXTURE0: 0, TEXTURE1: 1 };
  for (const name of ["uniform1f", "uniform2f", "activeTexture", "bindTexture", "pixelStorei",
    "texParameteri", "texImage2D", "texSubImage2D", "deleteTexture"]) {
    gl[name] = (...args) => calls.push({ name, args });
  }
  gl.createTexture = () => { calls.push({ name: "createTexture" }); return {}; };
  const hover = new FeaturedPixelHover(gl, { active: "active", grid: "grid" });
  const count = name => calls.filter(call => call.name === name).length;
  try {
    assert.equal(hover.draw(600, 390, 1000), false);
    assert.equal(count("createTexture"), 0);
    hover.move(300, 200, 600, 390, 1000);
    assert.equal(hover.draw(600, 390, 1000), true);
    hover.leave();
    assert.equal(document.documentElement.dataset.onImage, undefined);
    assert.equal(hover.draw(600, 390, 1100), true, "leaving softly fades the existing pixels");
    assert.equal(count("createTexture"), 1);
    assert.equal(count("texImage2D"), 1);
    assert.equal(count("texSubImage2D"), 1);
    assert.deepEqual(calls.at(-1), { name: "activeTexture", args: [gl.TEXTURE0] });
    assert.equal(hover.draw(600, 390, 1900), false);
    assert.equal(count("texSubImage2D"), 1, "no uploads after decay");
    hover.move(300, 200, 600, 390, 2000);
    hover.dispose();
    assert.equal(document.documentElement.dataset.onImage, undefined);
    assert.equal(count("deleteTexture"), 1);
  } finally {
    hover.dispose(); global.document = previous;
  }
});
