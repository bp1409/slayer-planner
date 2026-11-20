import { isSlayerId, slayers, type SlayerId } from "../data/slayers.ts";
import { calculatePlan, isDecimalInRange, maxSeconds, type PlanInputs } from "./calculator.ts";
import type { NumberFormat, TimeFormat } from "./formatting.ts";

type Theme = "dark" | "light" | "system";
export type Preferences = {
  theme: Theme;
  numberFormat: NumberFormat;
  timeFormat: TimeFormat;
  showMilestones: boolean;
  reduceMotion: boolean;
  allowFutureTiers: boolean;
  allowUpdates: boolean;
  allowBazaar: boolean;
  defaultTarget: number;
  defaultTier: number;
  defaultSeconds: number;
};

export const defaults: Preferences = {
  theme: "dark", numberFormat: "full", timeFormat: "units", showMilestones: true,
  reduceMotion: false, allowFutureTiers: false, allowUpdates: false, allowBazaar: false, defaultTarget: 5, defaultTier: 1, defaultSeconds: 60,
};

const preferencesKey = "slayer-planner-preferences";
const workspaceKey = "slayer-planner-workspace";

function read(key: string): Record<string, unknown> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch {
    // Storage is optional in restricted WebViews and private browser contexts.
  }
  return {};
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the current session usable when storage is unavailable.
  }
}

function integerPreference(value: unknown, maximum: number, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= maximum ? value : fallback;
}

export function loadPreferences(): Preferences {
  const saved = read(preferencesKey);
  return {
    theme: saved.theme === "light" || saved.theme === "system" ? saved.theme : "dark",
    numberFormat: saved.numberFormat === "compact" ? "compact" : "full",
    timeFormat: saved.timeFormat === "clock" ? "clock" : "units",
    showMilestones: (saved.showMilestones ?? saved.showChart) !== false,
    reduceMotion: saved.reduceMotion === true,
    allowFutureTiers: saved.allowFutureTiers === true,
    allowUpdates: saved.allowUpdates === true,
    allowBazaar: saved.allowBazaar === true,
    defaultTarget: integerPreference(saved.defaultTarget, 9, defaults.defaultTarget),
    defaultTier: integerPreference(saved.defaultTier, 5, defaults.defaultTier),
    defaultSeconds: typeof saved.defaultSeconds === "number" && isDecimalInRange(saved.defaultSeconds, 0, maxSeconds)
      ? saved.defaultSeconds : defaults.defaultSeconds,
  };
}

export const savePreferences = (settings: Preferences) => write(preferencesKey, settings);

export type Workspace = { slayer: SlayerId; plans: Partial<Record<SlayerId, PlanInputs>> };

export function newPlan(slayer: SlayerId, prefs: Preferences): PlanInputs {
  return {
    slayer, currentXp: 0, targetLevel: Math.min(prefs.defaultTarget, slayers[slayer].thresholds.length),
    tier: prefs.defaultTier <= slayers[slayer].tiers.length ? prefs.defaultTier : 0,
    secondsPerBoss: prefs.defaultSeconds, aatroxXp: false, slashedPricing: false,
  };
}

export function loadWorkspace(): Workspace {
  const saved = read(workspaceKey);
  const plans: Workspace["plans"] = {};
  if (saved.plans && typeof saved.plans === "object") {
    for (const [id, candidate] of Object.entries(saved.plans)) {
      if (!isSlayerId(id) || !candidate || typeof candidate !== "object") continue;
      const savedPlan = candidate as PlanInputs;
      if (savedPlan.slayer !== id) continue;
      const slayer = slayers[id];
      const supportedTier = integerPreference(savedPlan.tier, slayer.tiers.length, 0);
      const plan: PlanInputs = {
        ...savedPlan, tier: supportedTier,
        confirmedAccess: supportedTier > 0 && savedPlan.confirmedAccess === true,
        observedXp: supportedTier ? savedPlan.observedXp : undefined,
        aatroxXp: slayer.mayorPerksVerified && savedPlan.observedXp === undefined && savedPlan.aatroxXp === true,
        slashedPricing: slayer.mayorPerksVerified && savedPlan.slashedPricing === true,
      };
      // Preserve valid inputs and the selected tier even when current access is blocked.
      if (calculatePlan({ ...plan, tier: supportedTier || 1 }, true).ok) plans[id] = plan;
    }
  }
  return { slayer: isSlayerId(saved.slayer) ? saved.slayer : "zombie", plans };
}

export const saveWorkspace = (workspace: Workspace) => write(workspaceKey, workspace);
