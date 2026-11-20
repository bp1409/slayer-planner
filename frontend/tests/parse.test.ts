import test from "node:test";
import assert from "node:assert/strict";
import { parseDecimal } from "../src/lib/parse.ts";

test("parses grouped and decimal-comma values without accepting ambiguous groups", () => {
  assert.equal(parseDecimal("12,345"), 12345);
  assert.equal(parseDecimal("1,234,567.5"), 1234567.5);
  assert.equal(parseDecimal("0,25"), 0.25);
  assert.equal(parseDecimal("1,5"), 1.5);
  assert.ok(Number.isNaN(parseDecimal("1234,567")));
  assert.ok(Number.isNaN(parseDecimal("1,23,456")));
});
