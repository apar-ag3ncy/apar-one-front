// Run with npm run test:galaxy. No browser or GPU required.
import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { GalaxyBrush, STROKES, STROKE_INTERVAL, RETURN_SECONDS } = loadTypeScript('components/layout/cosmic-footer/galaxy-motion.ts');

test('dispersion follows a fast cursor crossing without gaps between stroke samples', () => {
  const brush = new GalaxyBrush();
  brush.move(-.75, .25, 0, 1.8);
  brush.move(0, 0, .1, 1.8);
  assert.deepEqual([...brush.segments.slice(0, 4)], [-.75, .25, 0, 0]);
  brush.move(.75, -.25, .4, 1.8);
  assert.deepEqual([...brush.segments.slice(4, 8)], [0, 0, .75, -.25]);
  assert.ok(brush.events[1] > 0 && brush.events[3] > 0);
  assert.ok(brush.events.filter((_, i) => i % 2 === 0).slice(2).every(time => time < 0));
});

test('a parked cursor does not restart the return animation', () => {
  const brush = new GalaxyBrush();
  brush.move(.5, .5, 0, 2);
  const parked = brush.events.slice();
  for (let t = .1; t <= RETURN_SECONDS + 1; t += .1) brush.move(.5, .5, t, 2);
  assert.deepEqual(brush.events, parked);
  brush.leave();
  assert.deepEqual(brush.events, parked, 'leaving lets existing strokes finish settling');
});

test('leaving and re-entering does not scatter across the gap between visits', () => {
  const brush = new GalaxyBrush();
  brush.move(.5, .5, 0, 2);
  brush.leave();
  const previous = brush.segments.slice();
  brush.move(-.5, -.5, .1, 2);
  assert.deepEqual(brush.segments, previous, 'rapid re-entry preserves the active stroke');
  brush.move(-.5, -.5, STROKE_INTERVAL, 2);
  assert.deepEqual([...brush.segments.slice(4, 8)], [-.5, -.5, -.5, -.5]);
  brush.move(-.25, -.25, STROKE_INTERVAL + .1, 2);
  assert.deepEqual([...brush.segments.slice(4, 8)], [-.5, -.5, -.25, -.25]);
});

test('rapid re-entry and continuous movement only recycle strokes after their return completes', () => {
  assert.ok(STROKES * STROKE_INTERVAL > RETURN_SECONDS);
  for (const reenter of [false, true]) {
    const brush = new GalaxyBrush();
    for (let i = 1; i < 1200; i++) {
      const previous = brush.events.slice();
      const time = i / 60;
      if (reenter) brush.leave();
      brush.move(Math.sin(i * .1), Math.cos(i * .1), time, 1.8);
      for (let slot = 0; slot < STROKES; slot++) {
        if (previous[slot * 2] === brush.events[slot * 2]) continue;
        assert.ok(time - previous[slot * 2] > RETURN_SECONDS, 'an active stroke must not snap home');
      }
    }
    assert.ok([...brush.events, ...brush.segments].every(Number.isFinite));
  }
});
