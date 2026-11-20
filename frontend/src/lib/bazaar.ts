export type BazaarPrice = { sellPrice: number; fetchedAt: string };
export type BazaarSnapshot = {
  prices: Record<string, BazaarPrice>;
  fetchedAt: string;
};

type BazaarProduct = { quick_status?: { sellPrice?: unknown } };

const endpoint = "https://api.hypixel.net/v2/skyblock/bazaar";

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function parseBazaarResponse(value: unknown, productIds: Record<string, string>, fetchedAt: string): BazaarSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Bazaar returned an invalid response.");
  const products = (value as { products?: unknown }).products;
  if (!products || typeof products !== "object" || Array.isArray(products)) throw new Error("Bazaar returned no product list.");
  const result: Record<string, BazaarPrice> = {};
  for (const [item, productId] of Object.entries(productIds)) {
    if (typeof productId !== "string" || !/^[A-Z0-9_:-]{1,80}$/.test(productId)) continue;
    const product = (products as Record<string, unknown>)[productId];
    if (!product || typeof product !== "object" || Array.isArray(product)) continue;
    const sellPrice = (product as BazaarProduct).quick_status?.sellPrice;
    if (isFiniteNonNegative(sellPrice)) result[item] = { sellPrice, fetchedAt };
  }
  return { prices: result, fetchedAt };
}

export async function fetchBazaarPrices(productIds: Record<string, string>, fetcher = fetch): Promise<BazaarSnapshot> {
  if (Object.keys(productIds).length === 0) throw new Error("Add at least one verified Bazaar product ID first.");
  const response = await fetcher(endpoint, { signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Bazaar request failed (${response.status}).`);
  return parseBazaarResponse(await response.json(), productIds, new Date().toISOString());
}

export const bazaarEndpoint = endpoint;
