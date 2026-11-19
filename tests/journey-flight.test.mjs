import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { cameraAtScroll, overlayAt, nextFlightStop } = loadTypeScript('components/journey/flight.ts');
const { bindJourneyGestures } = loadTypeScript('components/journey/gestures.ts');

test('chapter controls land on a readable frame across phone and desktop strides', () => {
  for (const stride of [124, 150, 194.12, 200, 213.72, 234]) {
    const range = Math.round(stride * 6);
    for (let chapter = 0; chapter <= 6; chapter++) {
      const camera = cameraAtScroll(Math.round(chapter * stride), range, 6);
      assert.equal(camera, chapter);
      assert.deepEqual(overlayAt(camera), { chapter, opacity: 1, reel: chapter === 5 ? 1 : 0 });
    }
  }
});

test('a chapter holds across small scrolls and eases out in either direction', () => {
  const camera = y => cameraAtScroll(y, 1200, 6);
  for (const y of [381, 390, 400, 410, 419]) assert.equal(camera(y), 2);
  const first = camera(425) - camera(420);
  const cruising = camera(465) - camera(460);
  assert.ok(first > 0 && first < cruising / 4);
  assert.ok(Math.abs(camera(425) + camera(375) - 4) < 1e-9);
  assert.equal(camera(500), 2.5);
});

test('direct navigation and scrollbar scrubbing can traverse the whole track in either direction', () => {
  const range = 1200;
  assert.equal(cameraAtScroll(985, range, 6), 5);
  assert.equal(overlayAt(cameraAtScroll(985, range, 6)).reel, 1);
  const between = cameraAtScroll(696, range, 6);
  assert.ok(between > 3.4 && between < 3.5);
  assert.equal(overlayAt(between).opacity, 0);
  assert.equal(overlayAt(cameraAtScroll(754, range, 6)).chapter, 4);
  const forward = Array.from({length: range + 1}, (_, y) => cameraAtScroll(y, range, 6));
  for (let y = range; y > 0; y--) {
    assert.ok(forward[y] >= forward[y-1]);
    assert.ok(forward[y] - forward[y-1] < .008);
    assert.equal(cameraAtScroll(y-1, range, 6), forward[y-1]);
  }
});

for (const input of ['wheel', 'touch']) {
  test(`12 distinct ${input} gestures reach the finale and a fresh gesture releases the page`, () => {
    const track = new EventTarget();
    const visited = [0];
    const cleanup = bindJourneyGestures(track,
      direction => nextFlightStop(visited.at(-1), direction, .001),
      stop => visited.push(stop));
    let time = 0;
    function fire(type, props) {
      const event = Object.assign(new Event(type, {cancelable:true}), props);
      Object.defineProperty(event, 'timeStamp', {value:time});
      time += 14;
      track.dispatchEvent(event);
      return event.defaultPrevented;
    }
    function gesture(direction) {
      time += 220;
      if (input === 'wheel') {
        return [95, 3400, 320, 125, 57, 20, 7, 1].map(delta =>
          fire('wheel', {deltaY:delta*direction, deltaX:0, deltaMode:0}));
      }
      const touches = y => ({touches:[{clientX:120,clientY:y}]});
      fire('touchstart', touches(400));
      const captured = [3, 20, 75, 310].map(dy => fire('touchmove', touches(400-dy*direction)));
      fire('touchend', {touches:[]});
      return captured;
    }
    for (let i = 1; i <= 12; i++) {
      assert.ok(gesture(1).every(Boolean));
      assert.equal(visited.length, i+1);
      const stop = visited.at(-1);
      if (i % 2 === 0) assert.equal(stop, i/2);
      else assert.ok(stop > (i-1)/2 && stop < (i+1)/2);
      assert.equal(overlayAt(cameraAtScroll(stop, 6, 6)).opacity, 1);
    }
    assert.ok(gesture(1).every(prevented => !prevented));
    const forward = [...visited];
    for (let i = 11; i >= 0; i--) {
      assert.ok(gesture(-1).every(Boolean));
      assert.equal(visited.at(-1), forward[i]);
    }
    assert.ok(gesture(-1).every(prevented => !prevented));
    cleanup();
    assert.ok(gesture(1).every(prevented => !prevented));
  });
}

test('bounds and mobile overscroll hold the first or final frame', () => {
  assert.equal(cameraAtScroll(200, 0, 6), 0);
  assert.equal(cameraAtScroll(-51, 1200, 6), 0);
  assert.equal(cameraAtScroll(1260, 1200, 6), 6);
});
