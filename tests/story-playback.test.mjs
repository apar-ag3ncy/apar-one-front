import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScript } from "./load-typescript.mjs";

const { createStoryPlayback, nextStory, STORY_INTERVAL } = loadTypeScript("lib/motion/story-playback.ts");

test("visible stories advance after 2.5 seconds with only one timer", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let advances = 0;
  const playback = createStoryPlayback(() => advances++);
  t.mock.timers.tick(10000);
  assert.equal(advances, 0, "offscreen stories must remain still");
  playback.resume("offscreen");
  playback.resume("offscreen");
  t.mock.timers.tick(2499);
  assert.equal(advances, 0);
  t.mock.timers.tick(1);
  assert.equal(advances, 1);
  t.mock.timers.tick(STORY_INTERVAL);
  assert.equal(advances, 2);
  playback.dispose();
});

test("independent reading, visibility and accessibility pauses cannot override each other", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let advances = 0;
  const states = [];
  const playback = createStoryPlayback(() => advances++, value => states.push(value));
  playback.resume("offscreen");
  for (const reason of ["hover", "focus", "hidden", "reduced", "pointer", "manual"]) playback.pause(reason);
  for (const reason of ["hover", "focus", "hidden", "pointer", "manual"]) playback.resume(reason);
  t.mock.timers.tick(10000);
  assert.equal(advances, 0, "reduced motion must still prevent autoplay");
  playback.resume("reduced");
  t.mock.timers.tick(STORY_INTERVAL);
  assert.equal(advances, 1);
  assert.deepEqual(states, [true, false, true]);
  playback.dispose();
});

test("manual scrolling restarts the reading interval and unmount cancels future playback", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let advances = 0;
  const playback = createStoryPlayback(() => advances++);
  playback.resume("offscreen");
  t.mock.timers.tick(2000);
  playback.restart();
  t.mock.timers.tick(2000);
  assert.equal(advances, 0);
  t.mock.timers.tick(500);
  assert.equal(advances, 1);
  playback.dispose();
  playback.resume("offscreen");
  t.mock.timers.tick(10000);
  assert.equal(advances, 1);
});

test("automatic playback reverses at the ends without jumping across the gallery", () => {
  let current = { index: 0, direction: 1 };
  const visited = [0];
  for (let step = 0; step < 28; step++) {
    const next = nextStory(current.index, current.direction, 14);
    assert.equal(Math.abs(next.index - current.index), 1);
    assert.ok(next.index >= 0 && next.index < 14);
    current = next;
    visited.push(current.index);
  }
  assert.equal(new Set(visited).size, 14);
  assert.equal(nextStory(0, 1, 1).index, 0);
  assert.equal(nextStory(0, 1, 0).index, 0);
});
