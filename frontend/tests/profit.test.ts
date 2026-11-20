import test from "node:test";
import assert from "node:assert/strict";
import { coinsPerHour, expectedCoinsPerBoss, lootItems, profitRows } from "../src/lib/profit.ts";

test("expected loot value uses bundled chance and average amount without changing game data", () => {
  const value = expectedCoinsPerBoss("Revenant Horror", 1, { "Revenant Flesh": 10, "Matcha Dye": 100_000 });
  assert.equal(value, 15.04);
  assert.equal(coinsPerHour(value, 60), 902.4);
});

test("profit rows cover every bundled Slayer tier and tolerate missing prices", () => {
  const rows = profitRows(60, {});
  assert.equal(rows.length, 27);
  assert.ok(rows.every((row) => row.coinsPerBoss === 0 && row.coinsPerHour === 0));
  assert.ok(lootItems().length > 0);
});

test("invalid or zero time produces no hourly estimate", () => {
  assert.equal(coinsPerHour(100, 0), 0);
  assert.equal(coinsPerHour(100, -1), 0);
});
