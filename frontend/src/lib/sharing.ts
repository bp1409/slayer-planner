import { isSlayerId, slayers } from "../data/slayers.ts";
import { calculatePlan, type PlanInputs } from "./calculator.ts";

export const SHARE_VERSION = 1 as const;
export type SharedPlan = { v: typeof SHARE_VERSION; plan: PlanInputs };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const allowedPlanKeys = new Set(["slayer", "currentXp", "targetLevel", "tier", "confirmedAccess", "secondsPerBoss", "observedXp", "aatroxXp", "slashedPricing"]);
const requiredPlanKeys = ["slayer", "currentXp", "targetLevel", "tier", "secondsPerBoss", "aatroxXp", "slashedPricing"] as const;

export function validateSharedPlan(value: unknown): PlanInputs {
  if (!isRecord(value) || value.v !== SHARE_VERSION || !isRecord(value.plan)) throw new Error("Unsupported plan format. Version 1 JSON is required.");
  if (Object.keys(value).some((key) => key !== "v" && key !== "plan") || Object.keys(value.plan).some((key) => !allowedPlanKeys.has(key))) throw new Error("Imported plan contains unsupported fields.");
  const candidate = value.plan;
  if (requiredPlanKeys.some((key) => !Object.hasOwn(candidate, key))) throw new Error("Imported plan is missing required fields.");
  const slayer = candidate.slayer;
  const currentXp = candidate.currentXp;
  const targetLevel = candidate.targetLevel;
  const tier = candidate.tier;
  const secondsPerBoss = candidate.secondsPerBoss;
  const aatroxXp = candidate.aatroxXp;
  const slashedPricing = candidate.slashedPricing;
  const confirmedAccess = candidate.confirmedAccess;
  const observedXp = candidate.observedXp;
  if (!isSlayerId(slayer) || typeof currentXp !== "number" || !Number.isFinite(currentXp) || typeof targetLevel !== "number" || !Number.isFinite(targetLevel)
    || typeof tier !== "number" || !Number.isFinite(tier) || typeof secondsPerBoss !== "number" || !Number.isFinite(secondsPerBoss)
    || typeof aatroxXp !== "boolean" || typeof slashedPricing !== "boolean"
    || (confirmedAccess !== undefined && typeof confirmedAccess !== "boolean")
    || (observedXp !== undefined && (typeof observedXp !== "number" || !Number.isFinite(observedXp)))) throw new Error("Imported plan contains invalid values.");
  const maxTier = slayers[slayer].tiers.length;
  if (!Number.isInteger(tier) || tier < 1 || tier > maxTier) throw new Error("Imported plan contains an unsupported quest tier.");
  const plan: PlanInputs = {
    slayer,
    currentXp,
    targetLevel,
    tier,
    secondsPerBoss,
    aatroxXp,
    slashedPricing,
    ...(confirmedAccess === undefined ? {} : { confirmedAccess }),
    ...(observedXp === undefined ? {} : { observedXp }),
  };
  const validation = calculatePlan(plan, true);
  if (!validation.ok) throw new Error(`Imported plan is invalid: ${validation.message}`);
  return { ...plan };
}

export function encodePlan(plan: PlanInputs) {
  return JSON.stringify({ v: SHARE_VERSION, plan });
}

export function decodePlan(text: string): PlanInputs {
  if (text.length > 10_000) throw new Error("Plan JSON is too large.");
  try { return validateSharedPlan(JSON.parse(text) as unknown); }
  catch (error) { if (error instanceof SyntaxError) throw new Error("Plan JSON is malformed."); throw error; }
}
