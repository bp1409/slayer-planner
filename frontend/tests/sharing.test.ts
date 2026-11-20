import test from "node:test";
import assert from "node:assert/strict";
import { decodePlan, encodePlan } from "../src/lib/sharing.ts";

const valid = { slayer: "zombie", currentXp: 0, targetLevel: 5, tier: 1, confirmedAccess: false, secondsPerBoss: 60, aatroxXp: false, slashedPricing: false } as const;
test("share plan round-trips through versioned JSON", () => assert.deepEqual(decodePlan(encodePlan(valid)), valid));
test("share plan rejects malformed and malicious input", () => {
  assert.throws(() => decodePlan("not json"), /malformed/);
  assert.throws(() => decodePlan(JSON.stringify({ v: 1, plan: { ...valid, currentXp: -1 } })), /invalid|XP/);
  assert.throws(() => decodePlan('{"v":1,"plan":{"slayer":"zombie","currentXp":0,"targetLevel":5,"tier":1,"confirmedAccess":false,"secondsPerBoss":60,"aatroxXp":false,"slashedPricing":false},"__proto__":{"polluted":true}}'), /unsupported/);
  assert.throws(() => decodePlan("x".repeat(10_001)), /large/);
});
