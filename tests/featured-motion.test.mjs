import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { coverFit, planeMesh, mediaBend } = loadTypeScript("lib/motion/media-plane.ts");

test("photographs fill the frame with a minimal crop and a face-safe Signi focal point", () => {
  assert.deepEqual(coverFit(1400, 1750, 1000, 650, .2), { x: 0, y: -120, width: 1000, height: 1250 });
  assert.deepEqual(coverFit(2000, 1000, 1000, 650), { x: -150, y: 0, width: 1300, height: 650 });
  assert.deepEqual(coverFit(2000, 1300, 1000, 650), { x: 0, y: 0, width: 1000, height: 650 });
});

test("responsive source density cannot change the crop and every frame edge stays filled without extra zoom", () => {
  for (const [width, height] of [[1400, 1750], [1600, 1067], [1600, 1195], [1600, 1131]]) {
    for (const [frameWidth, frameHeight] of [[343, 223], [880, 572], [1267, 824]]) {
      const fit = coverFit(width, height, frameWidth, frameHeight);
      assert.deepEqual(fit, coverFit(width / 2, height / 2, frameWidth, frameHeight));
      assert.ok(fit.x <= 1e-8 && fit.y <= 1e-8);
      assert.ok(fit.x + fit.width >= frameWidth - 1e-8);
      assert.ok(fit.y + fit.height >= frameHeight - 1e-8);
      assert.ok(Math.min(Math.abs(fit.width - frameWidth), Math.abs(fit.height - frameHeight)) < 1e-8);
      assert.ok(Math.abs(fit.width / fit.height - width / height) < 1e-8);
    }
  }
});

test("curved surface mesh covers the whole image without gaps and limits scroll distortion", () => {
  const mesh = planeMesh();
  let area = 0;
  for (let i = 0; i < mesh.length; i += 6) {
    const [ax, ay, bx, by, cx, cy] = mesh.slice(i, i + 6);
    area += Math.abs((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / 2;
  }
  assert.ok(mesh.every(value => value >= 0 && value <= 1));
  assert.ok(Math.abs(area - 1) < 1e-6);
  assert.equal(mediaBend(0), 0);
  assert.equal(mediaBend(100000), 14);
  assert.equal(mediaBend(-100000), -14);
});
