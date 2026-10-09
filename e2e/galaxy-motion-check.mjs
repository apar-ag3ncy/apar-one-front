// Run with node e2e/galaxy-motion-check.mjs. No browser or GPU required.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../components/cosmic-footer/galaxy-motion.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { GalaxyBrush, STROKES, STROKE_INTERVAL, RETURN_SECONDS } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
const brush = new GalaxyBrush();
brush.move(.2, .3, 0, 1.8);
const parked = Array.from(brush.events);
for (let t = .016; t < 4; t += .016) brush.move(.2, .3, t, 1.8);
assert.deepEqual(Array.from(brush.events), parked, 'A parked cursor must let its disturbance expire');
brush.leave(); brush.move(-.7, -.3, 4, 1.8);
assert.equal(brush.segments[4], brush.segments[6], 'Re-entry must not draw a stroke from the old cursor position');
assert.equal(brush.segments[5], brush.segments[7]);
assert.ok(STROKES * STROKE_INTERVAL > RETURN_SECONDS, 'History must outlive its return envelope');
for (let i = 1; i < 600; i++) {
  const before = Array.from(brush.events);
  if (i % 2 === 0) brush.leave();
  const t = 4 + i / 60;
  brush.move(Math.sin(i * .1), Math.cos(i * .1), t, 1.8);
  for (let slot = 0; slot < STROKES; slot++) {
    if (before[slot * 2] !== brush.events[slot * 2]) {
      assert.ok(t - before[slot * 2] > RETURN_SECONDS, 'An active stroke must not be overwritten, even with rapid re-entry');
    }
  }
}
assert.ok([...brush.events, ...brush.segments].every(Number.isFinite));
console.log('PASS: stationary recovery, clean re-entry, expired-only reuse and finite cursor data');
