import type { SlayerId } from "../data/slayers.ts";
import { isCompletionTime, type CompletionTime, type CompletionTimes } from "./preferences.ts";

export type GrindingProfile = { id: string; name: string; completionTimes: CompletionTimes };
const key = "slayer-planner-profiles";

function read(): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}

export function loadProfiles(fallback: CompletionTimes): GrindingProfile[] {
  const saved = read();
  if (!Array.isArray(saved)) return [{ id: "default", name: "Default", completionTimes: fallback }];
  const profiles = saved.filter((item): item is GrindingProfile => {
    if (!item || typeof item !== "object") return false;
    const value = item as Partial<GrindingProfile>;
    return typeof value.id === "string" && typeof value.name === "string" && value.completionTimes !== undefined;
  }).map((profile) => ({ ...profile, name: profile.name.trim().slice(0, 40) || "Profile", completionTimes: validateTimes(profile.completionTimes) }));
  return profiles.length ? profiles : [{ id: "default", name: "Default", completionTimes: fallback }];
}

function validateTimes(value: unknown): CompletionTimes {
  const result: CompletionTimes = {};
  if (!value || typeof value !== "object") return result;
  for (const [slayer, tiers] of Object.entries(value)) {
    if (!tiers || typeof tiers !== "object") continue;
    for (const [tier, time] of Object.entries(tiers)) {
      if (isCompletionTime(time)) (result[slayer as SlayerId] ??= {})[Number(tier)] = time;
    }
  }
  return result;
}

export const saveProfiles = (profiles: GrindingProfile[]) => {
  try { localStorage.setItem(key, JSON.stringify(profiles)); } catch { /* storage is optional */ }
};

export const newProfile = (name: string): GrindingProfile => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: name.trim().slice(0, 40) || "Profile", completionTimes: {} });
