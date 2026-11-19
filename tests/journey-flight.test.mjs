import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { cameraAtScroll, easeCamera, journeyWheelDelta, overlayAt, nextFlightStop } = loadTypeScript('components/journey/flight.ts');

test('large trackpad flicks take 11 to 14 strokes while every momentum sample still advances the film', () => {
  for (const height of [667, 844, 900, 1080]) {
    const range = 6 * 1.6 * height;
    const stroke = [95, 3400, 320, 125, 57, 20, 7, 1];
    let travel = 0;
    for (const delta of stroke) {
      const distance = journeyWheelDelta(delta, height);
      assert.ok(distance > 0 && distance <= delta);
      assert.equal(journeyWheelDelta(-delta, height), -distance);
      if (delta <= 20) assert.equal(distance, delta);
      travel += distance;
    }
    const gestures = Math.ceil(range / travel);
    assert.ok(gestures >= 11 && gestures <= 14);
  }
});

test('an uninterrupted scroll moves the camera at every pixel, even across chapter boundaries', () => {
  for (const height of [667, 844, 900]) {
    const range = Math.round(6 * 1.6 * height);
    for (let pixel = 1; pixel <= range; pixel++) {
      const previous = cameraAtScroll(pixel - 1, range, 6);
      const current = cameraAtScroll(pixel, range, 6);
      const speed = (current - previous) * range / 6;
      assert.ok(speed >= .449 && speed <= 1.551);
    }
    const middle = range / 2;
    const nearCaption = cameraAtScroll(middle + 1, range, 6) - cameraAtScroll(middle, range, 6);
    const fast = cameraAtScroll(range / 4 + 1, range, 6) - cameraAtScroll(range / 4, range, 6);
    assert.ok(nearCaption < fast / 3);
  }
});

test('the twelve navigation beats land on readable captions forward and backward', () => {
  for (const stride of [198.4, 1067.2, 1350.4, 1440]) {
    const range = Math.round(stride * 6);
    let stop = 0;
    const visits = [stop];
    for (let beat = 1; beat <= 12; beat++) {
      stop = nextFlightStop(stop, 1, 6 / range);
      assert.notEqual(stop, null);
      visits.push(stop);
      const pixel = Math.round(stop / 6 * range);
      const camera = cameraAtScroll(pixel, range, 6);
      const cue = overlayAt(camera);
      assert.equal(cue.chapter, Math.ceil(beat / 2));
      assert.ok(cue.opacity > .999);
      if (beat === 10) assert.ok(cue.reel > .999);
    }
    assert.equal(stop, 6);
    assert.equal(nextFlightStop(stop, 1, 6 / range), null);
    for (const previous of visits.slice(0, -1).reverse()) {
      stop = nextFlightStop(stop, -1, 6 / range);
      assert.equal(stop, previous);
    }
    assert.equal(nextFlightStop(0, -1, 6 / range), null);
  }
});

test('a held swipe and its reversal keep updating, then the camera settles without overshoot', () => {
  for (const hz of [30, 60, 120]) {
    const dt = 1000 / hz;
    let position = 0;
    for (let frame = 1; frame <= hz * 4; frame++) {
      const target = cameraAtScroll(frame, hz * 4, 6);
      const next = easeCamera(position, target, dt);
      assert.ok(next > position && next <= target);
      position = next;
    }
    const reversal = cameraAtScroll(850, 1000, 6);
    const previous = position;
    position = easeCamera(position, reversal, dt);
    assert.ok(position < previous && position >= reversal);
    for (let frame = 0; frame < hz; frame++) position = easeCamera(position, reversal, dt);
    assert.equal(position, reversal);
  }
  const progressAfter = hz => {
    let position = 0;
    for (let frame = 0; frame < hz / 10; frame++) position = easeCamera(position, 1, 1000 / hz);
    return position;
  };
  assert.ok(Math.abs(progressAfter(60) - progressAfter(120)) < 1e-12);
});

test('the camera stays in range before and after the sticky section', () => {
  assert.equal(cameraAtScroll(200, 0, 6), 0);
  assert.equal(cameraAtScroll(-51, 1200, 6), 0);
  assert.equal(cameraAtScroll(1260, 1200, 6), 6);
});
