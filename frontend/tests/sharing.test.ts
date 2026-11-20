import test from "node:test";
import assert from "node:assert/strict";
import { slayers, slayerIds } from "../src/data/slayers.ts";
import { decodePlan, encodePlan, validateSharedPlan } from "../src/lib/sharing.ts";

const valid = { slayer: "zombie", currentXp: 0, targetLevel: 5, tier: 1, confirmedAccess: false, secondsPerBoss: 60, aatroxXp: false, slashedPricing: false } as const;
test("share plan round-trips through versioned JSON for every Slayer", () => {
  for (const slayer of slayerIds) {
    const plan = { ...valid, slayer, targetLevel: slayers[slayer].thresholds.length, tier: 1 };
    assert.deepEqual(decodePlan(encodePlan(plan)), plan);
  }
});
test("share plan rejects malformed, wrong-type, missing, oversized, and malicious input", () => {
  const cases = [
    ["not json", /malformed/],
    [JSON.stringify({ v: 1, plan: { ...valid, currentXp: "0" } }), /invalid values/],
    [JSON.stringify({ v: 1, plan: { ...valid, aatroxXp: undefined } }), /missing required/],
    [JSON.stringify({ v: 1, plan: { ...valid, currentXp: 1e30 } }), /invalid plan|Enter XP/],
    [JSON.stringify({ v: 1, plan: { ...valid, currentXp: -1 } }), /invalid plan|Enter XP/],
    [JSON.stringify({ v: 1, plan: { ...valid, currentXp: 1.234 } }), /invalid plan|Enter XP/],
    [JSON.stringify({ v: 1, plan: { ...valid, tier: 0 } }), /unsupported quest tier/],
    [JSON.stringify({ v: 1, plan: { ...valid, tier: 6 } }), /unsupported quest tier/],
    [JSON.stringify({ v: 1, plan: { ...valid, slayer: "unknown" } }), /invalid values/],
    [`{"v":1,"plan":${JSON.stringify(valid)},"__proto__":{"polluted":true}}`, /unsupported/],
    [`${JSON.stringify({ v: 1, plan: valid })}${" ".repeat(10_001)}`, /too large/],
  ] as const;
  for (const [text, message] of cases) assert.throws(() => decodePlan(text), message);
  assert.equal(Object.prototype.polluted, undefined);
});
test("validation returns a sanitized plan rather than the imported object", () => {
  const input = { v: 1, plan: { ...valid } };
  const decoded = validateSharedPlan(input);
  assert.deepEqual(decoded, valid);
  assert.notStrictEqual(decoded, input.plan);
});
