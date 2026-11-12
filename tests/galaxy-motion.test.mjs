// Run with npm run test:galaxy. No browser or GPU required.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../components/layout/cosmic-footer/galaxy-motion.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { GalaxyBrush, PULSE_COUNT, PULSE_INTERVAL, RETURN_SECONDS } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

test('a fast crossing leaves isolated impulses at the sampled points', () => {
  const brush = new GalaxyBrush();
  brush.move(-.75, .25, 0, 1.8);
  brush.move(0, 0, .1, 1.8);
  brush.move(.75, -.25, .4, 1.8);
  brush.update(.9);
  assert.deepEqual([...brush.pulses.slice(0, 2)], [-.75, .25]);
  assert.deepEqual([...brush.pulses.slice(3, 5)], [.75, -.25]);
  assert.ok(brush.pulses[2] > 0 && brush.pulses[5] > 0);
  assert.ok(brush.pulses.slice(6).every(value => value === 0));
});

test('stars settle under a parked cursor and after leaving', () => {
  const brush = new GalaxyBrush();
  brush.move(.5, .5, 0, 2);
  brush.update(.45);
  const peak = brush.pulses[2];
  assert.ok(peak > 0);
  for (let t = .5; t <= RETURN_SECONDS + .5; t += .1) {
    brush.move(.5, .5, t, 2);
    brush.update(t);
  }
  const weights = () => brush.pulses.filter((_, i) => i % 3 === 2);
  assert.ok(weights().every(weight => weight === 0));
  brush.leave();
  brush.move(-.5, -.5, 5, 2);
  brush.leave();
  brush.update(5.45);
  assert.ok(brush.pulses[5] > 0);
  brush.update(7);
  assert.ok(brush.pulses[5] > 0 && brush.pulses[5] < peak);
  brush.update(10);
  assert.ok(weights().every(weight => weight === 0));
});

test('rapid re-entry cannot reclaim an active sample', () => {
  assert.ok(PULSE_COUNT * PULSE_INTERVAL > RETURN_SECONDS);
  const brush = new GalaxyBrush();
  const last = new Float64Array(PULSE_COUNT).fill(-Infinity);
  for (let i = 1; i < 600; i++) {
    const before = brush.pulses.slice();
    const time = i / 60;
    brush.leave();
    brush.move(Math.sin(i), Math.cos(i), time, 1.8);
    brush.update(time);
    for (let slot = 0; slot < PULSE_COUNT; slot++) {
      if (before[slot * 3] === brush.pulses[slot * 3]) continue;
      assert.ok(time - last[slot] > RETURN_SECONDS);
      last[slot] = time;
    }
  }
  assert.ok(brush.pulses.every(Number.isFinite));
});
