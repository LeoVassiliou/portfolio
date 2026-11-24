// Run with: node TPE/tests/engine.test.js
// Extracts the pure-maths ENGINE block from index.html so the tests always run against the real code.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/ENGINE:START[^\n]*\n([\s\S]*?)\/\* ===== ENGINE:END/);
assert(m, 'engine block not found');
const { soundness, atLeastOne, posterior } = new Function(`${m[1]}; return {soundness, atLeastOne, posterior};`)();

const close = (a, b, eps = 1e-9) => assert(Math.abs(a - b) < eps, `${a} !~ ${b}`);
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok -', name); };

test('soundness is the product of premises', () => close(soundness([0.9, 0.5, 0.8]), 0.36));
test('soundness is null if any premise is unrated', () => assert.strictEqual(soundness([0.9, null]), null));
test('soundness of no premises is null', () => assert.strictEqual(soundness([]), null));
test('atLeastOne of nothing is 0', () => close(atLeastOne([]), 0));
test('atLeastOne combines independently', () => close(atLeastOne([0.5, 0.5]), 0.75));
test('no arguments leaves the prior unchanged', () => close(posterior(0.3, [], []), 0.3));
test('only pro: P = A + prior(1-A)', () => close(posterior(0.4, [0.5], []), 0.5 + 0.4 * 0.5));
test('only con mirrors pro', () => close(posterior(0.4, [], [0.5]), 1 - posterior(0.6, [0.5], [])));
test('equal strength: lands between the prior and 50%', () => {
  for (const prior of [0.1, 0.3, 0.7, 0.9]) for (const s of [0.2, 0.6, 0.95]) {
    const p = posterior(prior, [s], [s]);
    assert(p >= Math.min(prior, 0.5) - 1e-12 && p <= Math.max(prior, 0.5) + 1e-12, `${p} not between ${prior} and 0.5`);
  }
});
test('equal strength at prior 50% stays at 50%', () => {
  for (const s of [0.2, 0.6, 0.95]) close(posterior(0.5, [s], [s]), 0.5);
});
test('matches the closed-form formula', () => {
  const A = 1 - (1 - 0.6) * (1 - 0.3), B = 0.4, prior = 0.35;
  close(posterior(prior, [0.6, 0.3], [0.4]), (A * (1 - B) + prior * (1 - A) * (1 - B)) / (1 - A * B));
});
test('result is always a probability', () => {
  for (let i = 0; i < 2000; i++) {
    const r = () => Math.random() * 0.99;
    const p = posterior(Math.min(.99, Math.max(.01, Math.random())), [r(), r()], [r()]);
    assert(p >= 0 && p <= 1, `out of range: ${p}`);
  }
});
test('monotonic: stronger pro argument never lowers P(God)', () => {
  let last = -1;
  for (let q = 0; q <= 0.99; q += 0.05) { const p = posterior(0.5, [q], [0.4]); assert(p >= last - 1e-12); last = p; }
});
test('certain contradiction returns null', () => assert.strictEqual(posterior(0.5, [1], [1]), null));
console.log(`\n${n} tests passed`);
