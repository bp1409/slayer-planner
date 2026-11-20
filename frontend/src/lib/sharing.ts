import { isSlayerId } from "../data/slayers.ts";
import { calculatePlan, type PlanInputs } from "./calculator.ts";

export const SHARE_VERSION = 1 as const;
export type SharedPlan = { v: typeof SHARE_VERSION; plan: PlanInputs };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const allowedPlanKeys = new Set(["slayer", "currentXp", "targetLevel", "tier", "confirmedAccess", "secondsPerBoss", "observedXp", "aatroxXp", "slashedPricing"]);

export function validateSharedPlan(value: unknown): PlanInputs {
  if (!isRecord(value) || value.v !== SHARE_VERSION || !isRecord(value.plan)) throw new Error("Unsupported plan format. Version 1 JSON is required.");
  if (Object.keys(value).some((key) => key !== "v" && key !== "plan") || Object.keys(value.plan).some((key) => !allowedPlanKeys.has(key))) throw new Error("Imported plan contains unsupported fields.");
  const candidate = value.plan;
  if (!isSlayerId(candidate.slayer) || !Number.isFinite(candidate.currentXp) || !Number.isFinite(candidate.targetLevel)
    || !Number.isFinite(candidate.tier) || !Number.isFinite(candidate.secondsPerBoss)
    || typeof candidate.aatroxXp !== "boolean" || typeof candidate.slashedPricing !== "boolean"
    || (candidate.confirmedAccess !== undefined && typeof candidate.confirmedAccess !== "boolean")
    || (candidate.observedXp !== undefined && !Number.isFinite(candidate.observedXp))) throw new Error("Imported plan contains invalid values.");
  const plan = candidate as unknown as PlanInputs;
  const validation = calculatePlan({ ...plan, tier: plan.tier || 1 }, true);
  if (!validation.ok) throw new Error(`Imported plan is invalid: ${validation.message}`);
  return plan;
}

export function encodePlan(plan: PlanInputs) {
  return JSON.stringify({ v: SHARE_VERSION, plan });
}

export function decodePlan(text: string): PlanInputs {
  if (text.length > 10_000) throw new Error("Plan JSON is too large.");
  try { return validateSharedPlan(JSON.parse(text) as unknown); }
  catch (error) { if (error instanceof SyntaxError) throw new Error("Plan JSON is malformed."); throw error; }
}
