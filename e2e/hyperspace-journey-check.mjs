// GPU-independent invariants: forward travel, reversible sampling, seamless exit.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../components/hyperspace-intro/journey.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { journeyFrame, JOURNEY_SECONDS, HERO_REVEAL_PROGRESS } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
assert.ok(JOURNEY_SECONDS >= 5 && JOURNEY_SECONDS <= 6);
const forward = Array.from({ length: 1001 }, (_, index) => journeyFrame(index / 1000));
for (let i = 1; i < forward.length; i++) {
  assert.ok(Object.values(forward[i]).every(Number.isFinite));
  assert.ok(forward[i].travel > forward[i - 1].travel, 'Forward scroll cannot reverse star travel');
  assert.ok(forward[i].reveal >= forward[i - 1].reveal, 'The landing aperture must open continuously');
  assert.ok(Math.abs(forward[i].travel - forward[i - 1].travel) < 0.5, 'No travel jump across shot boundaries');
}
for (let i = forward.length - 1; i >= 0; i--) {
  assert.deepEqual(journeyFrame(i / 1000), forward[i], 'Reverse scrubbing must sample the same scene');
}
assert.equal(journeyFrame(-1).progress, 0);
assert.equal(journeyFrame(2).reveal, 1);
assert.equal(journeyFrame(HERO_REVEAL_PROGRESS).reveal, 0, 'Hero entrance starts while still fully covered');
assert.ok((1 - HERO_REVEAL_PROGRESS) * JOURNEY_SECONDS > 2.3, 'Hero choreography has time to settle before handoff');
console.log('PASS: 5–6s duration, monotonic/reversible travel, continuous aperture and hero preparation');
