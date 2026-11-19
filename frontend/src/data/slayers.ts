export const tierLabels = ["I", "II", "III", "IV", "V"] as const;
export const mayorPerks = { xpMultiplier: 1.25, feeMultiplier: 0.5 } as const;

type QuestTier = readonly [xp: number, fee: number];
export type TierUnlock = {
  previousTier?: true;
  level?: number;
  combatLevel?: number;
  uncertain?: string;
};
type SlayerData = {
  boss: keyof typeof import("../lib/loot.ts").slayerLoot;
  label: string;
  currency: "coins" | "motes";
  thresholds: readonly number[];
  tiers: readonly QuestTier[];
  tierUnlocks: readonly TierUnlock[];
  mayorPerksVerified: boolean;
};

const firstLevels = [5, 15, 200, 1_000];
const lateLevels = [5_000, 20_000, 100_000, 400_000, 1_000_000];
const advancedLevels = [10, 30, 250, 1_500, ...lateLevels];
const standardTiers = [[5, 2_000], [25, 7_500], [100, 20_000], [500, 50_000]] as const;
const fiveTiers = [...standardTiers, [1_500, 100_000]] as const;
const standardUnlocks: readonly TierUnlock[] = [
  {},
  { previousTier: true, combatLevel: 5 },
  { previousTier: true, combatLevel: 10 },
  { previousTier: true, combatLevel: 15 },
];
const fiveUnlocks: readonly TierUnlock[] = [
  ...standardUnlocks,
  { previousTier: true, combatLevel: 25, level: 7 },
];
const vampireUnlocks: readonly TierUnlock[] = [
  {},
  { previousTier: true },
  { previousTier: true },
  { previousTier: true, uncertain: "The wiki disagrees on a Combat level 15 requirement." },
  { previousTier: true, combatLevel: 25 },
];

// Live quest data. The source pages and patch context are listed in the frontend README.
export const slayers = {
  zombie: { boss: "Revenant Horror", label: "Zombie", currency: "coins",
    thresholds: [...firstLevels, ...lateLevels], tiers: fiveTiers, tierUnlocks: fiveUnlocks, mayorPerksVerified: true },
  spider: { boss: "Tarantula Broodfather", label: "Spider", currency: "coins",
    thresholds: [5, 25, 200, 1_000, ...lateLevels], tiers: fiveTiers, tierUnlocks: fiveUnlocks, mayorPerksVerified: true },
  wolf: { boss: "Sven Packmaster", label: "Wolf", currency: "coins",
    thresholds: advancedLevels, tiers: standardTiers, tierUnlocks: standardUnlocks, mayorPerksVerified: true },
  enderman: { boss: "Voidgloom Seraph", label: "Enderman", currency: "coins",
    thresholds: advancedLevels, tiers: standardTiers, tierUnlocks: standardUnlocks, mayorPerksVerified: true },
  blaze: { boss: "Inferno Demonlord", label: "Blaze", currency: "coins", thresholds: advancedLevels,
    tiers: [[5, 10_000], [25, 25_000], [100, 60_000], [500, 150_000]], tierUnlocks: standardUnlocks, mayorPerksVerified: true },
  vampire: { boss: "Riftstalker Bloodfiend", label: "Vampire", currency: "motes",
    thresholds: [20, 75, 240, 840, 2_400], tiers: [[10, 2_000], [25, 4_000], [60, 5_000], [120, 7_000], [150, 10_000]],
    tierUnlocks: vampireUnlocks, mayorPerksVerified: false },
} as const satisfies Record<string, SlayerData>;

export type SlayerId = keyof typeof slayers;
export const slayerPrerequisites: Record<SlayerId, string | undefined> = {
  zombie: undefined,
  spider: "a Tier II Revenant Horror kill",
  wolf: "a Tier II Tarantula Broodfather kill",
  enderman: "a Tier IV Sven Packmaster kill",
  blaze: "a Tier III Voidgloom Seraph kill",
  vampire: "access to Stillgore Château in the Rift",
};
export const slayerIds = Object.keys(slayers) as SlayerId[];
export const isSlayerId = (value: unknown): value is SlayerId =>
  typeof value === "string" && Object.hasOwn(slayers, value);
