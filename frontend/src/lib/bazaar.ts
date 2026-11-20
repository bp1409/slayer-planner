export type BazaarPrice = { sellPrice: number; fetchedAt: string };
export type BazaarSnapshot = {
  prices: Record<string, BazaarPrice>;
  fetchedAt: string;
};

export const bazaarPriceMaxAgeMs = 15 * 60 * 1000;
// The live Bazaar payload is currently roughly 3.6 MB and changes as products are added.
// Keep a bounded limit while leaving room for normal API growth.
export const bazaarResponseMaxBytes = 8_000_000;
export const bazaarPriceMax = 1_000_000_000_000;

export function isFreshBazaarPrice(fetchedAt: string, now = Date.now()) {
  const timestamp = Date.parse(fetchedAt);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= bazaarPriceMaxAgeMs;
}

type BazaarProduct = { quick_status?: { sellPrice?: unknown } };

const endpoint = "https://api.hypixel.net/v2/skyblock/bazaar";

// Matched against Hypixel's SkyBlock items and Bazaar APIs on 20 November 2026.
export const bazaarProductIds: Readonly<Record<string, string>> = {
  "Bubba Blister": "BUBBA_BLISTER",
  "Bundle of Magma Arrows": "ARROW_BUNDLE_MAGMA",
  "Derelict Ashe": "DERELICT_ASHE",
  "Enchanted Blaze Powder": "ENCHANTED_BLAZE_POWDER",
  "Enchanted Book (Bane of Arthropods VI)": "ENCHANTMENT_BANE_OF_ARTHROPODS_6",
  "Enchanted Book (Critical VI)": "ENCHANTMENT_CRITICAL_6",
  "Enchanted Book (Mana Steal I)": "ENCHANTMENT_MANA_STEAL_1",
  "Enchanted Book (Smarty Pants I)": "ENCHANTMENT_SMARTY_PANTS_1",
  "Enchanted Book (Smite VI)": "ENCHANTMENT_SMITE_6",
  "Enchanted Book (Smoldering VI)": "ENCHANTMENT_SMOLDERING_6",
  "End Stone Idol": "ENDSTONE_IDOL",
  "Ensnared Snail": "ENSNARED_SNAIL",
  "Fang-tastic Chocolate Chip": "CHOCOLATE_CHIP",
  "Festering Maggot": "FESTERING_MAGGOT",
  "Fine Opal Gemstone": "FINE_OPAL_GEM",
  "Fly Swatter": "FLY_SWATTER",
  "Foul Flesh": "FOUL_FLESH",
  "Furball": "FURBALL",
  "Gabagool Distillate": "CRUDE_GABAGOOL_DISTILLATE",
  "Guardian Lucky Block": "GUARDIAN_LUCKY_BLOCK",
  "Hamster Wheel": "HAMSTER_WHEEL",
  "Hazmat Enderman": "HAZMAT_ENDERMAN",
  "Kelvin Inverter": "KELVIN_INVERTER",
  "Mana Disintegrator": "MANA_DISINTEGRATOR",
  "Null Atom": "NULL_ATOM",
  "Null Sphere": "NULL_SPHERE",
  "Revenant Catalyst": "REVENANT_CATALYST",
  "Revenant Flesh": "REVENANT_FLESH",
  "Revenant Viscera": "REVENANT_VISCERA",
  "Scorched Books": "SCORCHED_BOOKS",
  "Scorched Power Crystal": "SCORCHED_POWER_CRYSTAL",
  "Severed Hand": "SEVERED_HAND",
  "Spider Catalyst": "SPIDER_CATALYST",
  "Subzero Inverter": "SUBZERO_INVERTER",
  "Summoning Eye": "SUMMONING_EYE",
  "Tarantula Catalyst": "TARANTULA_CATALYST",
  "Tarantula Silk": "TARANTULA_SILK",
  "Tarantula Web": "TARANTULA_WEB",
  "Toxic Arrow Poison": "TOXIC_ARROW_POISON",
  "Transmission Tuner": "TRANSMISSION_TUNER",
  "Twilight Arrow Poison": "TWILIGHT_ARROW_POISON",
  "Undead Catalyst": "UNDEAD_CATALYST",
  "Vial of Venom": "VIAL_OF_VENOM",
  "Wolf Tooth": "WOLF_TOOTH",
};

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= bazaarPriceMax;
}

export function parseBazaarResponse(value: unknown, productIds: Record<string, string>, fetchedAt: string): BazaarSnapshot {
  if (!isFreshBazaarPrice(fetchedAt)) throw new Error("Bazaar returned an invalid or stale timestamp.");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Bazaar returned an invalid response.");
  const { success, products } = value as { success?: unknown; products?: unknown };
  if (success === false) throw new Error("Hypixel reported a Bazaar API failure.");
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
  let response: Response;
  try {
    response = await fetcher(endpoint, { signal: AbortSignal.timeout(8_000) });
  } catch {
    throw new Error("Bazaar is unreachable. Check your connection and try again.");
  }
  if (!response.ok) throw new Error(`Bazaar request failed (${response.status}).`);
  const contentLength = response.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > bazaarResponseMaxBytes)) {
    throw new Error("Bazaar response is too large.");
  }
  const bodyText = await response.text().catch(() => "");
  if (new TextEncoder().encode(bodyText).byteLength > bazaarResponseMaxBytes) throw new Error("Bazaar response is too large.");
  let body: unknown = null;
  try { body = JSON.parse(bodyText); } catch { /* handled by the response validator */ }
  const snapshot = parseBazaarResponse(body, productIds, new Date().toISOString());
  if (Object.keys(snapshot.prices).length === 0) throw new Error("Bazaar returned no prices for mapped drops.");
  return snapshot;
}

export const bazaarEndpoint = endpoint;
