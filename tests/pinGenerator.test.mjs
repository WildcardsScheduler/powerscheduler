import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomPin } from '../src/utils/pinGenerator.ts';

test('Random Team PIN Generator', async (t) => {
  await t.test('generates a 4-digit numeric string', () => {
    for (let i = 0; i < 50; i++) {
      const pin = generateRandomPin();
      assert.strictEqual(typeof pin, 'string');
      assert.strictEqual(pin.length, 4, `PIN "${pin}" should be exactly 4 digits long`);
      assert.match(pin, /^[1-9][0-9]{3}$/, `PIN "${pin}" should be between 1000 and 9999`);
    }
  });

  await t.test('generates diverse randomized values without fixed collisions', () => {
    const pins = new Set();
    const iterations = 100;
    for (let i = 0; i < iterations; i++) {
      pins.add(generateRandomPin());
    }
    // Across 100 random samples in range [1000, 9999], distinct count should be high (> 85)
    assert.ok(
      pins.size > 85,
      `Expected high entropy: got ${pins.size} unique PINs across ${iterations} runs`
    );
  });
});
