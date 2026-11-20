import { bazaarProductIds as verifiedIds } from "./bazaar.ts";
import type { calculatePlan, PlanInputs } from "./calculator.ts";
import { slayerIds, slayers, type SlayerId } from "../data/slayers.ts";
import { slayerLoot } from "./loot.ts";
import { isFreshBazaarPrice } from "./bazaar.ts";

export type PriceTable = {
  prices: Record<string, number>;
  lastEdited: string | null;
  bazaarProductIds: Record<string, string>;
  bazaarPrices: Record<string, number>;
  bazaarFetchedAt: string | null;
};
export type SlayerComparison = { slayer: SlayerId; tier: number; xpPerHour: number | null; netCoinsPerHour: number | null; timeSeconds: number; incomplete: boolean };


const priceTableKey = "slayer-planner-prices";
const maxPrice = 1_000_000_000_000;

export function lootItems() {
  return [...new Set(slayerIds.flatMap((id) => slayerLoot[slayers[id].boss].tiers.flatMap((tier) => tier.map(([item]) => item))))].sort();
}

export function emptyPriceTable(): PriceTable {
  return { prices: {}, lastEdited: null, bazaarProductIds: {}, bazaarPrices: {}, bazaarFetchedAt: null };
}

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maxPrice;
}

export function loadPriceTable(): PriceTable {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(priceTableKey) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyPriceTable();
    const candidate = parsed as { prices?: unknown; lastEdited?: unknown; bazaarProductIds?: unknown; bazaarPrices?: unknown; bazaarFetchedAt?: unknown };
    const prices: Record<string, number> = {};
    if (candidate.prices && typeof candidate.prices === "object" && !Array.isArray(candidate.prices)) {
      for (const item of lootItems()) {
        const value = (candidate.prices as Record<string, unknown>)[item];
        if (validPrice(value)) prices[item] = value;
      }
    }
    const bazaarProductIds: Record<string, string> = {};
    if (candidate.bazaarProductIds && typeof candidate.bazaarProductIds === "object" && !Array.isArray(candidate.bazaarProductIds)) {
      for (const item of lootItems()) {
        const value = (candidate.bazaarProductIds as Record<string, unknown>)[item];
        if (typeof value === "string" && /^[A-Z0-9_:-]{1,80}$/.test(value)) bazaarProductIds[item] = value;
      }
    }
    const bazaarPrices: Record<string, number> = {};
    if (candidate.bazaarPrices && typeof candidate.bazaarPrices === "object" && !Array.isArray(candidate.bazaarPrices)) {
      for (const item of lootItems()) {
        const value = (candidate.bazaarPrices as Record<string, unknown>)[item];
        if (bazaarProductIds[item] === verifiedIds[item] && verifiedIds[item] && validPrice(value)) bazaarPrices[item] = value;
      }
    }
    const bazaarFetchedAt = typeof candidate.bazaarFetchedAt === "string" && isFreshBazaarPrice(candidate.bazaarFetchedAt)
      ? candidate.bazaarFetchedAt : null;
    return {
      prices, bazaarProductIds, bazaarPrices: bazaarFetchedAt ? bazaarPrices : {},
      lastEdited: typeof candidate.lastEdited === "string" ? candidate.lastEdited : null,
      bazaarFetchedAt,
    };
  } catch { return emptyPriceTable(); }
}

export function savePriceTable(table: PriceTable) {
  try {
    localStorage.setItem(priceTableKey, JSON.stringify(table));
  } catch {
    // Keep session pricing available when storage is blocked.
  }
}

function averageAmount(amount: string) {
  const values = amount.split("-").map(Number);
  return values.length === 2 ? (values[0] + values[1]) / 2 : values[0];
}

export function estimateLoot(slayer: SlayerId, tier: number, currentLevel: number, prices: Record<string, number>) {
  const drops = slayerLoot[slayers[slayer].boss].tiers[tier - 1] ?? [];
  const missing: string[] = [];
  let coins = 0;
  let priced = 0;
  let uncertainUnlock = false;
  for (const [item, chance, amount, requiredLevel] of drops) {
    // GAME-DATA.md records conflicting level 3 / level 4 requirements for this row.
    if (slayer === "vampire" && tier === 2 && item === "Fang-tastic Chocolate Chip" && currentLevel === 3) {
      uncertainUnlock = true;
      continue;
    }
    if (requiredLevel !== undefined && currentLevel < requiredLevel) continue;
    const price = prices[item];
    if (validPrice(price)) {
      priced++;
      coins += chance / 100 * averageAmount(amount) * price;
    } else {
      missing.push(item);
    }
  }
  return { coins, missing, priced, uncertainUnlock };
}

export function coinsPerHour(valuePerBoss: number, secondsPerBoss: number) {
  return Number.isFinite(secondsPerBoss) && secondsPerBoss > 0 ? valuePerBoss * 3_600 / secondsPerBoss : null;
}

export function estimateProfit(
  plan: Pick<PlanInputs, "slayer" | "tier">,
  result: Extract<ReturnType<typeof calculatePlan>, { ok: true }>,
  secondsPerBoss: number,
  prices: Record<string, number>,
) {
  const loot = estimateLoot(plan.slayer, plan.tier, result.currentLevel, prices);
  // Riftstalker drops 1,000 Motes per quest (see GAME-DATA.md). Keep the two currencies separate.
  const grossPerBoss = result.currency === "motes" ? 1_000 : loot.coins;
  const netPerBoss = grossPerBoss - result.feePerBoss;
  return {
    loot, grossPerBoss, netPerBoss,
    grossPerHour: coinsPerHour(grossPerBoss, secondsPerBoss),
    netPerHour: coinsPerHour(netPerBoss, secondsPerBoss),
    totalNet: result.bosses * netPerBoss,
  };
}

export function compareSlayers(secondsBySlayer: Partial<Record<SlayerId, number>>, prices: Record<string, number>): SlayerComparison[] {
  return slayerIds.flatMap((slayer) => slayers[slayer].tiers.map((_, index) => {
    const seconds = secondsBySlayer[slayer] ?? 0;
    const loot = estimateLoot(slayer, index + 1, slayers[slayer].thresholds.length, prices);
    const fee = slayers[slayer].tiers[index][1];
    const net = coinsPerHour(loot.coins - fee, seconds);
    const xp = coinsPerHour(slayers[slayer].tiers[index][0], seconds);
    return { slayer, tier: index + 1, xpPerHour: xp, netCoinsPerHour: net, timeSeconds: seconds, incomplete: loot.missing.length > 0 };
  }));
}
