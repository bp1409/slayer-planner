import assert from "node:assert/strict";
import test from "node:test";
import { slayerIds, slayers, type SlayerId } from "../src/data/slayers.ts";
import { calculatePlan, getTierAccess, maxSeconds, maxXp, type PlanInputs } from "../src/lib/calculator.ts";
import { loadPreferences, loadWorkspace, newPlan } from "../src/lib/preferences.ts";
import { lootSourceNote, slayerLoot } from "../src/lib/loot.ts";
import { formatTime } from "../src/lib/formatting.ts";

const inputs: PlanInputs = {
  slayer: "zombie", currentXp: 0, targetLevel: 5, tier: 4,
  secondsPerBoss: 60, confirmedAccess: true, aatroxXp: false, slashedPricing: false,
};
const expectedTiers: Record<SlayerId, readonly (readonly [number, number])[]> = {
  zombie: [[5, 2000], [25, 7500], [100, 20000], [500, 50000], [1500, 100000]],
  spider: [[5, 2000], [25, 7500], [100, 20000], [500, 50000], [1500, 100000]],
  wolf: [[5, 2000], [25, 7500], [100, 20000], [500, 50000]],
  enderman: [[5, 2000], [25, 7500], [100, 20000], [500, 50000]],
  blaze: [[5, 10000], [25, 25000], [100, 60000], [500, 150000]],
  vampire: [[10, 2000], [25, 4000], [60, 5000], [120, 7000], [150, 10000]],
};

function plan(changes: Partial<PlanInputs> = {}) {
  const result = calculatePlan({ ...inputs, ...changes }, true);
  if (!result.ok) throw new Error(result.message);
  return result;
}

for (const slayer of slayerIds) {
  test(`${slayer}: every live tier and loot table uses the same supported tier count`, () => {
    const expected = expectedTiers[slayer];
    assert.deepEqual(slayers[slayer].tiers, expected);
    assert.equal(slayerLoot[slayers[slayer].boss].tiers.length, expected.length);
    assert.equal(slayers[slayer].tierUnlocks.length, expected.length);
    for (const [index, [xp, fee]] of expected.entries()) {
      const drops = slayerLoot[slayers[slayer].boss].tiers[index];
      assert.ok(drops.length > 0);
      assert.equal(new Set(drops.map(([item]) => item)).size, drops.length);
      for (const [, chance, amount, level] of drops) {
        assert.ok(chance > 0 && chance <= 100);
        assert.match(amount, /^[1-9]\d*(?:-[1-9]\d*)?$/);
        assert.ok(level === undefined || (Number.isInteger(level) && level >= 1 && level <= slayers[slayer].thresholds.length));
      }
      const result = plan({ slayer, tier: index + 1, targetLevel: 1 });
      assert.equal(result.xpPerBoss, xp);
      assert.equal(result.feePerBoss, fee);
      assert.equal(result.cost, fee * result.bosses);
      assert.equal(result.currency, slayer === "vampire" ? "motes" : "coins");
    }
    assert.equal(calculatePlan({ ...inputs, slayer, tier: expected.length + 1 }).ok, false);
  });

  test(`${slayer}: every level boundary and maximum`, () => {
    const thresholds = slayers[slayer].thresholds;
    for (const [index, currentXp] of thresholds.entries()) {
      assert.equal(plan({ slayer, currentXp: currentXp - 0.01 }).currentLevel, index);
      assert.equal(plan({ slayer, currentXp }).currentLevel, index + 1);
    }
    assert.equal(plan({ slayer, currentXp: maxXp }).currentLevel, thresholds.length);
    assert.equal(calculatePlan({ ...inputs, slayer, targetLevel: thresholds.length + 1 }).ok, false);
  });
}

test("rounds required bosses up and derives cost and time from whole quests", () => {
  const result = plan({ currentXp: 4_499.99, secondsPerBoss: 21.25 });
  assert.equal(result.remainingXp, 500.01);
  assert.equal(result.bosses, 2);
  assert.equal(result.cost, 100_000);
  assert.equal(result.timeSeconds, 42.5);
  assert.equal(plan({ currentXp: 4_999.1, observedXp: .3 }).bosses, 3);
});

test("Tier V XP gates apply one XP and a hundredth below, and lift at the threshold", () => {
  for (const slayer of ["zombie", "spider"] as const) {
    const tierFive = { ...inputs, slayer, tier: 5, targetLevel: 8 };
    for (const currentXp of [0, 99_999, 99_999.99]) {
      const candidate = { ...tierFive, currentXp };
      assert.equal(getTierAccess(slayer, 5, currentXp).xpLocked, true);
      assert.equal(calculatePlan(candidate).ok, false);
      const future = calculatePlan(candidate, true);
      assert.ok(future.ok && future.assumesAccess);
      assert.equal(future.xpPerBoss, 1_500);
    }
    const exact = calculatePlan({ ...tierFive, currentXp: 100_000 });
    assert.ok(exact.ok && !exact.assumesAccess);
    assert.equal(exact.currentLevel, 7);
    assert.equal(exact.bosses, 200);
  }
  assert.equal(getTierAccess("vampire", 5, 0).xpLocked, false);
});

test("XP alone cannot establish combat, cross-Slayer or previous-tier requirements", () => {
  const candidate = { ...inputs, tier: 4, confirmedAccess: false, currentXp: 2_500 };
  assert.equal(calculatePlan(candidate).ok, false);
  const future = calculatePlan(candidate, true);
  assert.ok(future.ok && future.assumesAccess);
  assert.equal(future.bosses, 5);
  assert.equal(future.cost, 250_000);
  const available = calculatePlan({ ...candidate, confirmedAccess: true });
  assert.ok(available.ok && !available.assumesAccess);
  assert.equal(available.timeSeconds, 300);
  assert.equal(calculatePlan({ ...candidate, slayer: "spider", tier: 1 }).ok, false);
  assert.equal(calculatePlan({ ...candidate, slayer: "zombie", tier: 1, currentXp: 0 }).ok, true);
  assert.equal(calculatePlan({ ...candidate, currentXp: NaN }, true).ok, false);
});

test("loot notes identify source discrepancies on the affected tiers", () => {
  assert.equal(lootSourceNote("Revenant Horror", 1), undefined);
  assert.match(lootSourceNote("Revenant Horror", 5) ?? "", /Paragon Shard/);
  assert.match(lootSourceNote("Riftstalker Bloodfiend", 2) ?? "", /Fang-tastic Chocolate Chip/);
});

test("legacy saved plans retain a locked tier and prompt for obsolete tiers", (context) => {
  const values = new Map([
    ["slayer-planner-workspace", JSON.stringify({ slayer: "zombie", plans: {
      zombie: { ...inputs, confirmedAccess: undefined, tier: 5, currentXp: 900 },
      wolf: { ...inputs, slayer: "wolf", confirmedAccess: true, tier: 5, currentXp: 750 },
    } })],
    ["slayer-planner-preferences", JSON.stringify({ allowFutureTiers: "true", defaultTier: 5 })],
  ]);
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true, value: { getItem: (key: string) => values.get(key) ?? null },
  });
  context.after(() => {
    if (storage) Object.defineProperty(globalThis, "localStorage", storage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const preferences = loadPreferences();
  const workspace = loadWorkspace();
  assert.equal(preferences.allowFutureTiers, false);
  assert.equal(workspace.plans.zombie?.tier, 5);
  assert.equal(workspace.plans.zombie?.confirmedAccess, false);
  assert.equal(workspace.plans.wolf?.tier, 0);
  assert.equal(workspace.plans.wolf?.currentXp, 750);
  assert.equal(newPlan("wolf", preferences).tier, 0);
});

test("saved workspace plans use a whitelist of known fields", (context) => {
  const values = new Map([["slayer-planner-workspace", JSON.stringify({ slayer: "zombie", plans: {
    zombie: { ...inputs, unknownSecret: "discard me" },
  } })]]);
  const storage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null } });
  context.after(() => { if (storage) Object.defineProperty(globalThis, "localStorage", storage); else Reflect.deleteProperty(globalThis, "localStorage"); });
  const plan = loadWorkspace().plans.zombie;
  assert.ok(plan);
  assert.equal(Object.hasOwn(plan, "unknownSecret"), false);
});

test("Aatrox perks apply independently and fractional XP is identified as estimated", () => {
  const xpOnly = plan({ tier: 1, aatroxXp: true, currentXp: 4975 });
  assert.equal(xpOnly.xpPerBoss, 6.25);
  assert.equal(xpOnly.bosses, 4);
  assert.equal(xpOnly.feePerBoss, 2_000);
  assert.equal(xpOnly.fractionalPerkEstimate, true);
  const feeOnly = plan({ slashedPricing: true });
  assert.equal(feeOnly.cost, 250_000);
  assert.equal(feeOnly.xpPerBoss, 500);
  assert.equal(plan({ aatroxXp: true, slashedPricing: true }).cost, 200_000);
  assert.equal(calculatePlan({ ...inputs, observedXp: 626, aatroxXp: true }).ok, false);
  assert.equal(calculatePlan({ ...inputs, slayer: "vampire", aatroxXp: true }).ok, false);
  assert.equal(calculatePlan({ ...inputs, slayer: "vampire", slashedPricing: true }).ok, false);
});

test("already reached or exceeded target returns complete results", () => {
  for (const currentXp of [5000, 5001, maxXp]) {
    const result = plan({ currentXp });
    assert.equal(result.remainingXp, 0);
    assert.equal(result.bosses, 0);
    assert.equal(result.cost, 0);
    assert.equal(result.timeSeconds, 0);
    assert.equal(result.progress, 100);
  }
});

test("rejects invalid and out-of-range values rather than substituting another plan", () => {
  for (const changes of [
    { currentXp: NaN }, { currentXp: Infinity }, { currentXp: -1 },
    { currentXp: maxXp + 1 }, { currentXp: .001 }, { observedXp: 0 },
    { observedXp: Infinity }, { observedXp: -1 }, { secondsPerBoss: -1 },
    { secondsPerBoss: Infinity }, { secondsPerBoss: maxSeconds + 1 },
    { targetLevel: 0 }, { targetLevel: 1.5 }, { tier: 0 }, { tier: 1.5 }, { tier: Infinity },
  ]) assert.equal(calculatePlan({ ...inputs, ...changes }).ok, false);
  assert.equal(calculatePlan({ ...inputs, slayer: "unknown" as SlayerId }).ok, false);
  assert.equal(plan({ secondsPerBoss: 0 }).timeSeconds, 0);
  const largest = plan({ targetLevel: 9, tier: 5, observedXp: .01, secondsPerBoss: maxSeconds });
  assert.ok(Number.isSafeInteger(largest.cost));
  assert.ok(Number.isSafeInteger(largest.timeSeconds));
});

test("formats durations without a 24-hour rollover", () => {
  assert.equal(formatTime(90061, "clock"), "25:01:01");
  assert.equal(formatTime(90061, "units"), "1d 1h 1m 1s");
  assert.equal(formatTime(.25, "units"), "0.25 s");
});
