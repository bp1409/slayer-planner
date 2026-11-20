import { slayerIds, slayers, type SlayerId } from "../data/slayers.ts";
import { calculatePlan, getTierAccess, type PlanInputs } from "./calculator.ts";

export type ProgressionStep = { tier: number; bosses: number; xp: number; fee: number; timeSeconds: number };

export function planProgression(input: PlanInputs, allowFuture = false): ProgressionStep[] {
  const slayer = slayers[input.slayer];
  const targetXp = slayer.thresholds[input.targetLevel - 1];
  if (targetXp === undefined) return [];
  let xp = input.currentXp;
  const steps: ProgressionStep[] = [];
  while (xp < targetXp) {
    const accessible = slayer.tiers.map((_, index) => index + 1).filter((tier) => {
      const access = getTierAccess(input.slayer, tier, xp);
      return !access.xpLocked && (!access.prerequisites || input.confirmedAccess === true) && !access.uncertain;
    });
    const tier = accessible.at(-1) ?? (allowFuture ? slayer.tiers.length : 0);
    if (!tier) break;
    const result = calculatePlan({ ...input, currentXp: xp, tier }, true);
    if (!result.ok || result.bosses <= 0) break;
    steps.push({ tier, bosses: result.bosses, xp: result.bosses * result.xpPerBoss, fee: result.cost, timeSeconds: result.timeSeconds });
    xp += result.bosses * result.xpPerBoss;
  }
  return steps;
}

export function availableSlayers() {
  return slayerIds.filter((id: SlayerId) => slayers[id].tiers.length > 0);
}
