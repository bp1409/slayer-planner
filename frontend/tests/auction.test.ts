import assert from "node:assert/strict";
import test from "node:test";
import { auctionMaxPages, fetchAuctionPrices, parseAuctionPage } from "../src/lib/auction.ts";

test("uses the lowest active BIN and ignores ordinary bids", () => {
  const now = Date.now();
  const result = parseAuctionPage({ success: true, totalPages: 1, lastUpdated: now, auctions: [
    { item_name: "Matcha Dye", bin: true, starting_bid: 25, end: now + 10_000 },
    { item_name: "Matcha Dye", bin: true, starting_bid: 12, end: now + 10_000 },
    { item_name: "Matcha Dye", bin: false, starting_bid: 1, end: now + 10_000 },
  ] }, ["Matcha Dye"], now);
  assert.equal(result.prices["Matcha Dye"].price, 12);
});

test("matches rarity and rune level prefixes without accepting unrelated names", () => {
  const now = Date.now();
  const result = parseAuctionPage({ success: true, totalPages: 1, lastUpdated: now, auctions: [
    { item_name: "◆ Spirit Rune I", bin: true, starting_bid: 50, end: now + 10_000 },
    { item_name: "◆ Spirit Rune II", bin: true, starting_bid: 60, end: now + 10_000 },
    { item_name: "Spirit Rune Fragment", bin: true, starting_bid: 1, end: now + 10_000 },
  ] }, ["Spirit Rune"], now);
  assert.equal(result.prices["Spirit Rune"].price, 50);
});

test("fetches all auction pages in bounded batches", async () => {
  const now = Date.now();
  const requests: string[] = [];
  const fetcher = async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    const page = Number(new URL(url).searchParams.get("page"));
    return Response.json({ success: true, totalPages: 2, lastUpdated: now, auctions: [
      { item_name: page === 0 ? "Matcha Dye" : "Warden Heart", bin: true, starting_bid: page + 10, end: now + 10_000 },
    ] });
  };
  const result = await fetchAuctionPrices(["Matcha Dye", "Warden Heart"], fetcher);
  assert.deepEqual(Object.keys(result.prices).sort(), ["Matcha Dye", "Warden Heart"]);
  assert.equal(requests.length, 2);
});

test("rejects an unsafe page count", () => {
  assert.throws(() => parseAuctionPage({ success: true, totalPages: auctionMaxPages + 1, lastUpdated: Date.now(), auctions: [] }, [], Date.now()), /page count/);
});
