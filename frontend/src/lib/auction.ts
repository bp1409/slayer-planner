export type AuctionPrice = { price: number; fetchedAt: string };
export type AuctionSnapshot = {
  prices: Record<string, AuctionPrice>;
  fetchedAt: string;
};

export const auctionEndpoint = "https://api.hypixel.net/v2/skyblock/auctions";
export const auctionResponseMaxBytes = 8_000_000;
export const auctionMaxPages = 100;
const priceMax = 1_000_000_000_000;

type AuctionPage = {
  success?: unknown;
  totalPages?: unknown;
  lastUpdated?: unknown;
  auctions?: unknown;
};

type Auction = {
  item_name?: unknown;
  bin?: unknown;
  starting_bid?: unknown;
  claimed?: unknown;
  end?: unknown;
};

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= priceMax;
}

function itemMatchesAuction(itemName: string, wanted: string) {
  if (itemName === wanted) return true;
  const normalized = itemName.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  if (normalized === wanted) return true;
  const suffix = normalized.slice(wanted.length).trim();
  return normalized.startsWith(`${wanted} `) && /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)$/.test(suffix);
}

export function parseAuctionPage(value: unknown, wantedItems: readonly string[], now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Auction House returned an invalid response.");
  const page = value as AuctionPage;
  if (page.success !== true) throw new Error("Auction House reported an API failure.");
  if (typeof page.totalPages !== "number" || !Number.isInteger(page.totalPages) || page.totalPages < 1 || page.totalPages > auctionMaxPages) {
    throw new Error("Auction House returned an invalid page count.");
  }
  if (typeof page.lastUpdated !== "number" || !Number.isFinite(page.lastUpdated) || page.lastUpdated > now + 60_000) {
    throw new Error("Auction House returned an invalid timestamp.");
  }
  if (!Array.isArray(page.auctions)) throw new Error("Auction House returned no auction list.");

  const prices: Record<string, AuctionPrice> = {};
  const fetchedAt = new Date(now).toISOString();
  for (const entry of page.auctions) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const auction = entry as Auction;
    if (auction.bin !== true || auction.claimed === true || typeof auction.item_name !== "string" || !validPrice(auction.starting_bid)) continue;
    if (typeof auction.end === "number" && auction.end <= now) continue;
    for (const item of wantedItems) {
      if (!itemMatchesAuction(auction.item_name, item)) continue;
      const previous = prices[item]?.price;
      if (previous === undefined || auction.starting_bid < previous) prices[item] = { price: auction.starting_bid, fetchedAt };
    }
  }
  return { prices, totalPages: page.totalPages, fetchedAt };
}

async function fetchPage(page: number, fetcher: typeof fetch) {
  let response: Response;
  try {
    response = await fetcher(`${auctionEndpoint}?page=${page}`, { signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new Error("Auction House is unreachable. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(`Auction House request failed (${response.status}).`);
  const contentLength = response.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > auctionResponseMaxBytes)) {
    throw new Error("Auction House response is too large.");
  }
  const bodyText = await response.text().catch(() => "");
  if (new TextEncoder().encode(bodyText).byteLength > auctionResponseMaxBytes) throw new Error("Auction House response is too large.");
  try { return JSON.parse(bodyText) as unknown; } catch { throw new Error("Auction House returned invalid JSON."); }
}

export async function fetchAuctionPrices(wantedItems: readonly string[], fetcher: typeof fetch = fetch): Promise<AuctionSnapshot> {
  if (wantedItems.length === 0) throw new Error("Add at least one loot item first.");
  const first = parseAuctionPage(await fetchPage(0, fetcher), wantedItems);
  const prices = { ...first.prices };
  for (let page = 1; page < first.totalPages; page += 4) {
    const pages = await Promise.all(Array.from({ length: Math.min(4, first.totalPages - page) }, (_, index) => fetchPage(page + index, fetcher)));
    for (const value of pages) {
      const parsed = parseAuctionPage(value, wantedItems);
      for (const [item, price] of Object.entries(parsed.prices)) {
        if (prices[item] === undefined || price.price < prices[item].price) prices[item] = price;
      }
    }
  }
  if (Object.keys(prices).length === 0) throw new Error("Auction House returned no matching BIN listings.");
  return { prices, fetchedAt: first.fetchedAt };
}
