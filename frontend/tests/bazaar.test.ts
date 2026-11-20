import test from "node:test";
import assert from "node:assert/strict";
import { parseBazaarResponse } from "../src/lib/bazaar.ts";

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
