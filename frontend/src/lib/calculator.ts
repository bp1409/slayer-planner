import { isSlayerId, mayorPerks, slayerPrerequisites, slayers, tierLabels, type SlayerId, type TierUnlock } from "../data/slayers.ts";

export const maxXp = 1_000_000_000_000;
export const maxSeconds = 86_400;

export type PlanInputs = {
  slayer: SlayerId;
  currentXp: number;
  targetLevel: number;
  tier: number;
  confirmedAccess?: boolean;
  secondsPerBoss: number;
  observedXp?: number;
  aatroxXp: boolean;
  slashedPricing: boolean;
};

export type InputIssue = { field: keyof PlanInputs; message: string };

export function isDecimalInRange(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max &&
    Number(value.toFixed(2)) === value;
}

export function getTierAccess(slayerId: SlayerId, tier: number, currentXp: number) {
  const slayer = slayers[slayerId];
  const requirement: TierUnlock | undefined = slayer.tierUnlocks[tier - 1];
  const currentLevel = slayer.thresholds.filter((xp) => currentXp >= xp).length;
  const requiredXp = requirement?.level ? slayer.thresholds[requirement.level - 1] : undefined;
  const prerequisites = [
    slayerPrerequisites[slayerId],
    requirement?.combatLevel && `Combat level ${requirement.combatLevel}`,
    requirement?.previousTier && `Tier ${tierLabels[tier - 2]} completion`,
  ].filter(Boolean).join(", ");
  return {
    currentLevel,
    requiredLevel: requirement?.level,
    requiredXp,
    xpLocked: requiredXp !== undefined && currentXp < requiredXp,
    prerequisites,
    uncertain: requirement?.uncertain,
  };
}

export function calculatePlan(input: PlanInputs, allowFutureTiers = false) {
  const invalid = (field: InputIssue["field"], message: string) => ({ ok: false as const, field, message });
  if (!isSlayerId(input.slayer)) return invalid("slayer", "Slayer data is unavailable.");
  const slayer = slayers[input.slayer];
  const tier = slayer.tiers[input.tier - 1];
  const targetXp = slayer.thresholds[input.targetLevel - 1];

  if (!Number.isInteger(input.tier) || !tier) return invalid("tier", "Choose a supported quest tier.");
  if (!Number.isInteger(input.targetLevel) || targetXp === undefined) return invalid("targetLevel", "Choose a supported target level.");
  if (!isDecimalInRange(input.currentXp, 0, maxXp)) return invalid("currentXp", "Enter XP from 0 to 1 trillion, with up to two decimal places.");
  if (!isDecimalInRange(input.secondsPerBoss, 0, maxSeconds)) return invalid("secondsPerBoss", "Enter 0 to 86,400 seconds, with up to two decimal places.");
  if (input.observedXp !== undefined && !isDecimalInRange(input.observedXp, 0.01, maxXp)) {
    return invalid("observedXp", "Enter XP from 0.01 to 1 trillion, with up to two decimal places.");
  }
  if (input.aatroxXp && (!slayer.mayorPerksVerified || input.observedXp !== undefined)) {
    return invalid("aatroxXp", "Use the XP perk with a supported Slayer and the standard tier reward.");
  }
  if (input.slashedPricing && !slayer.mayorPerksVerified) {
    return invalid("slashedPricing", "Slashed Pricing is unavailable for this Slayer.");
  }

  const access = getTierAccess(input.slayer, input.tier, input.currentXp);
  const assumesAccess = access.xpLocked || Boolean(access.prerequisites && input.confirmedAccess !== true);
  if (assumesAccess && !allowFutureTiers) {
    return invalid("tier", access.xpLocked
      ? `Tier ${tierLabels[input.tier - 1]} requires Slayer level ${access.requiredLevel}.`
      : "Confirm that you can start this quest to see your estimate.");
  }

  const [baseXp, baseFee] = tier;
  const xpPerBoss = input.observedXp ?? (input.aatroxXp ? baseXp * mayorPerks.xpMultiplier : baseXp);
  const feePerBoss = input.slashedPricing ? baseFee * mayorPerks.feeMultiplier : baseFee;
  // Use hundredths so exact decimal boundaries never add an extra boss through float division.
  const remainingHundredths = Math.max(0, targetXp * 100 - Math.round(input.currentXp * 100));
  const bosses = Math.ceil(remainingHundredths / Math.round(xpPerBoss * 100));

  return {
    ok: true as const,
    currentLevel: access.currentLevel,
    assumesAccess,
    tierUnlockXp: access.requiredXp,
    targetXp,
    remainingXp: remainingHundredths / 100,
    xpPerBoss,
    feePerBoss,
    bosses,
    timeSeconds: bosses * Math.round(input.secondsPerBoss * 100) / 100,
    cost: bosses * feePerBoss,
    currency: slayer.currency,
    progress: Math.min(100, input.currentXp / targetXp * 100),
    fractionalPerkEstimate: input.aatroxXp && !Number.isInteger(xpPerBoss),
  };
}
