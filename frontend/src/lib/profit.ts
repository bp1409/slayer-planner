import { slayerIds, slayers, type SlayerId } from "../data/slayers.ts";
import { slayerLoot } from "./loot.ts";

export type PriceTable = { prices: Record<string, number>; lastEdited: string | null };
export type ProfitRow = { slayer: SlayerId; tier: number; coinsPerBoss: number; coinsPerHour: number };

const priceTableKey = "slayer-planner-prices";
const maxPrice = 1_000_000_000_000;

export function lootItems() {
  return [...new Set(slayerIds.flatMap((id) => slayerLoot[slayers[id].boss].tiers.flatMap((tier) => tier.map(([item]) => item))))].sort();
}

export function emptyPriceTable(): PriceTable {
  return { prices: {}, lastEdited: null };
}

function validPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maxPrice;
}

export function loadPriceTable(): PriceTable {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(priceTableKey) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyPriceTable();
    const candidate = parsed as { prices?: unknown; lastEdited?: unknown };
    const prices: Record<string, number> = {};
    if (candidate.prices && typeof candidate.prices === "object" && !Array.isArray(candidate.prices)) {
      for (const item of lootItems()) {
        const value = (candidate.prices as Record<string, unknown>)[item];
        if (validPrice(value)) prices[item] = value;
      }
    }
    return { prices, lastEdited: typeof candidate.lastEdited === "string" ? candidate.lastEdited : null };
  } catch { return emptyPriceTable(); }
}

export function savePriceTable(table: PriceTable) {
  localStorage.setItem(priceTableKey, JSON.stringify(table));
}

function averageAmount(amount: string) {
  const values = amount.split("-").map(Number);
  return values.length === 2 ? (values[0] + values[1]) / 2 : values[0];
}

export function expectedCoinsPerBoss(boss: keyof typeof slayerLoot, tier: number, prices: Record<string, number>) {
  const drops = slayerLoot[boss].tiers[tier - 1];
  if (!drops) return 0;
  return drops.reduce((total, [item, chancePercent, amount]) => total + chancePercent / 100 * averageAmount(amount) * (prices[item] ?? 0), 0);
}

export function coinsPerHour(coinsPerBoss: number, secondsPerBoss: number) {
  return secondsPerBoss > 0 ? coinsPerBoss * 3_600 / secondsPerBoss : 0;
}

export function profitRows(secondsPerBoss: number, prices: Record<string, number>): ProfitRow[] {
  return slayerIds.flatMap((slayer) => slayers[slayer].tiers.map((_, index) => {
    const coins = expectedCoinsPerBoss(slayers[slayer].boss, index + 1, prices);
    return { slayer, tier: index + 1, coinsPerBoss: coins, coinsPerHour: coinsPerHour(coins, secondsPerBoss) };
  }));
}
