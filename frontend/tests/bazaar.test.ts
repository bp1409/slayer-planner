import test from "node:test";
import assert from "node:assert/strict";
import { bazaarProductIds, fetchBazaarPrices, parseBazaarResponse } from "../src/lib/bazaar.ts";

test("maps verified product IDs without inventing IDs for unmapped drops", () => {
  assert.equal(bazaarProductIds["Revenant Flesh"], "REVENANT_FLESH");
  assert.equal(bazaarProductIds["Enchanted Book (Smite VI)"], "ENCHANTMENT_SMITE_6");
  assert.equal(bazaarProductIds["Gabagool Distillate"], "CRUDE_GABAGOOL_DISTILLATE");
  assert.equal(bazaarProductIds["Unmapped loot label"], undefined);
});

test("parses only finite non-negative Bazaar sell prices for requested IDs", () => {
  const result = parseBazaarResponse({ products: {
    REVENANT_FLESH: { quick_status: { sellPrice: 12.5 } },
    BAD: { quick_status: { sellPrice: -1 } },
  } }, { "Revenant Flesh": "REVENANT_FLESH", Missing: "BAD" }, "2026-11-20T00:00:00.000Z");
  assert.deepEqual(result.prices, { "Revenant Flesh": { sellPrice: 12.5, fetchedAt: "2026-11-20T00:00:00.000Z" } });
});

test("rejects malformed Bazaar responses and ignores unsafe product IDs", () => {
  assert.throws(() => parseBazaarResponse(null, {}, "now"), /invalid response/);
  assert.throws(() => parseBazaarResponse({ products: [] }, {}, "now"), /no product list/);
  const result = parseBazaarResponse({ products: { X: { quick_status: { sellPrice: 4 } } } }, { Safe: "X", Unsafe: "javascript:alert(1)" }, "now");
  assert.deepEqual(Object.keys(result.prices), ["Safe"]);
});

test("surfaces Bazaar network, HTTP, malformed JSON, API and no-price failures", async () => {
  const ids = { Flesh: "REVENANT_FLESH" };
  await assert.rejects(fetchBazaarPrices(ids, async () => { throw new TypeError("offline"); }), /unreachable/);
  await assert.rejects(fetchBazaarPrices(ids, async () => new Response(null, { status: 429 })), /429/);
  await assert.rejects(fetchBazaarPrices(ids, async () => new Response("{")), /invalid response/);
  await assert.rejects(fetchBazaarPrices(ids, async () => Response.json({ success: false })), /API failure/);
  await assert.rejects(fetchBazaarPrices(ids, async () => Response.json({ products: {} })), /no prices/);
});
