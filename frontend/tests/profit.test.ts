import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlan } from "../src/lib/calculator.ts";
import { loadCompletionTimes, saveCompletionTimes } from "../src/lib/preferences.ts";
import { coinsPerHour, estimateLoot, estimateProfit, compareSlayers } from "../src/lib/profit.ts";
import { planProgression } from "../src/lib/progression.ts";
import { createBugReport } from "../src/lib/bugReport.ts";

const plan = { slayer: "zombie", tier: 1, currentXp: 0, targetLevel: 2, secondsPerBoss: 60,
  aatroxXp: false, slashedPricing: false } as const;

test("uses audited loot expectations and quest fees, including Slashed Pricing", () => {
  const prices = { "Revenant Flesh": 10, "Matcha Dye": 100_000 };
  const result = calculatePlan(plan);
  assert.ok(result.ok);
  assert.equal(result.feePerBoss, 2_000);
  const estimate = estimateProfit(plan, result, 30 + 30, prices);
  assert.equal(estimate.loot.coins, 15.04);
  assert.equal(estimate.grossPerHour, 902.4);
  assert.equal(Math.round(estimate.netPerBoss * 100), -198496);
  assert.equal(Math.round(estimate.netPerHour!), -119098);
  assert.equal(Math.round(estimate.totalNet), -5955);

  const discounted = calculatePlan({ ...plan, slashedPricing: true });
  assert.ok(discounted.ok);
  assert.equal(discounted.feePerBoss, 1_000);
  assert.ok(estimateProfit(plan, discounted, 60, prices).netPerBoss > estimate.netPerBoss);
});

test("counts explicit zero prices and reports missing eligible drops", () => {
  const loot = estimateLoot("zombie", 1, 0, { "Revenant Flesh": 0 });
  assert.equal(loot.coins, 0);
  assert.equal(loot.priced, 1);
  assert.deepEqual(loot.missing, ["Matcha Dye"]);
});

test("applies published level gates and flags disputed Vampire eligibility", () => {
  const prices = { "Undead Catalyst": 100 };
  assert.equal(estimateLoot("zombie", 2, 2, prices).priced, 0);
  assert.equal(estimateLoot("zombie", 2, 3, prices).coins, 1);
  const chips = { "Fang-tastic Chocolate Chip": 100 };
  assert.equal(estimateLoot("vampire", 2, 2, chips).uncertainUnlock, false);
  assert.equal(estimateLoot("vampire", 2, 3, chips).uncertainUnlock, true);
  assert.equal(estimateLoot("vampire", 2, 3, chips).priced, 0);
  assert.equal(estimateLoot("vampire", 2, 4, chips).coins, 7.5);
});

test("keeps Rift fees and net profit in Motes", () => {
  const rift = { ...plan, slayer: "vampire", confirmedAccess: true } as const;
  const result = calculatePlan(rift);
  assert.ok(result.ok);
  const estimate = estimateProfit(rift, result, 60, {});
  assert.equal(estimate.grossPerBoss, 1000);
  assert.equal(estimate.netPerBoss, 1000 - result.feePerBoss);
  assert.equal(estimate.totalNet, estimate.netPerBoss * result.bosses);
});

test("completion times persist independently by Slayer and tier", (t) => {
  const storage = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const times = { zombie: { 1: { spawn: 20.5, kill: 9.5 }, 2: { spawn: 35, kill: 15 } },
    spider: { 1: { spawn: 10, kill: 0 } } };
  saveCompletionTimes({ ...times, wolf: { 5: { spawn: 60, kill: 5 }, 1: { spawn: -1, kill: 10 } } });
  assert.deepEqual(loadCompletionTimes(), times);
  assert.equal(coinsPerHour(10, times.zombie[1].spawn + times.zombie[1].kill), 1200);
  for (const seconds of [0, -1, NaN, Infinity]) assert.equal(coinsPerHour(100, seconds), null);
});

test("progression uses verified tiers and comparison marks missing prices", () => {
  const steps = planProgression({ ...plan, targetLevel: 3 }, true);
  assert.ok(steps.length > 0);
  assert.ok(steps.every((step) => step.bosses > 0 && step.fee >= 0));
  const comparison = compareSlayers({ zombie: 60 }, { "Revenant Flesh": 10 });
  assert.equal(comparison.length, 27);
  assert.equal(comparison.find((row) => row.slayer === "zombie" && row.tier === 1)?.incomplete, true);
});

test("bug reports contain only safe diagnostic fields", () => {
  const report = createBugReport("Open the planner and select Tier II.");
  assert.match(report, /App version: 1\.1\.0/);
  assert.match(report, /Reproduction steps:/);
  assert.doesNotMatch(report, /localStorage|api-key|password/);
});
// @ts-nocheck
