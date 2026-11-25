import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { Snowfall } = loadTypeScript('components/journey/snowfall.ts');
const points = snow => snow.mesh.geometry.attributes.position.array;
const tick = (snow, seconds, cursor = null, hz = 60) => {
  for (let i = 0; i < seconds * hz; i++) snow.update(1 / hz, i / hz, 3, false, cursor);
};

test('snow keeps falling while the chapter is stationary and recycles offscreen', () => {
  const snow = new Snowfall(12, () => .5);
  tick(snow, 1);
  assert.ok(points(snow)[1] < -.1);
  let wraps = 0, previous = points(snow)[1];
  for (let i = 0; i < 60 * 90; i++) {
    snow.update(1 / 60, i / 60, 3, false, null);
    const y = points(snow)[1];
    if (y > previous + 1) wraps++;
    previous = y;
    assert.ok(points(snow).every(Number.isFinite));
    assert.ok(y >= -1.12001 && y <= 1.12001, 'allow Float32 rounding at the wrap boundary');
  }
  assert.ok(wraps >= 5, 'particles must replenish throughout a long visit');
  snow.dispose();
});

test('hover repels nearby flakes on both sides and leaves distant snow undisturbed', () => {
  const hover = new Snowfall(3, () => .5), control = new Snowfall(3, () => .5);
  for (const snow of [hover, control]) {
    points(snow)[0] = -.08;
    points(snow)[3] = .08;
    points(snow)[6] = .8;
  }
  tick(hover, .5, { x: 0, y: 0 });
  tick(control, .5);
  assert.ok(points(hover)[0] < points(control)[0] - .04);
  assert.ok(points(hover)[3] > points(control)[3] + .04);
  assert.equal(points(hover)[6], points(control)[6]);
  assert.equal(points(hover)[7], points(control)[7]);
  const before = points(hover)[1];
  tick(hover, 2);
  assert.ok(points(hover)[1] < before, 'flakes resume falling after the cursor leaves');
  hover.dispose(); control.dispose();
});

test('reduced motion and other chapters suspend the snow without resetting it', () => {
  const snow = new Snowfall(8, () => .5);
  tick(snow, .5);
  const before = points(snow).slice();
  for (const [chapter, reduced] of [[3, true], [0, false], [4, false], [6, false]]) {
    snow.update(.05, 2, chapter, reduced, { x: 0, y: 0 });
    assert.equal(snow.mesh.visible, false);
    assert.deepEqual(points(snow), before);
  }
  snow.update(1 / 60, 2, 3, false, null);
  assert.equal(snow.mesh.visible, true);
  assert.ok(points(snow)[1] < before[1]);
  snow.dispose();
});

test('resizing keeps horizontal placement proportional and caps phone particle count', () => {
  const snow = new Snowfall(620, () => .7);
  const x = points(snow)[0];
  snow.resize(.5, 2, true);
  assert.ok(Math.abs(points(snow)[0] - x * .5) < 1e-6);
  assert.equal(snow.mesh.geometry.drawRange.count, 360);
  snow.resize(1.8, 1.25, false);
  assert.ok(Math.abs(points(snow)[0] - x * 1.8) < 1e-6);
  assert.equal(snow.mesh.geometry.drawRange.count, 620);
  assert.equal(snow.mesh.material.uniforms.pointScale.value, 1.25);
  snow.dispose();
});

test('hover dispersion stays consistent across common display refresh rates', () => {
  const results = [30, 60, 120].map(hz => {
    const snow = new Snowfall(1, () => .5);
    points(snow)[0] = .08;
    tick(snow, 1, { x: 0, y: 0 }, hz);
    const result = points(snow).slice(0, 2);
    snow.dispose();
    return result;
  });
  for (const result of results) assert.ok(Math.hypot(result[0] - results[1][0], result[1] - results[1][1]) < .015);
});
