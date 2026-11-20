import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { NumberField, parseDecimal } from "../ui/NumberField";
import { isSlayerId, mayorPerks, slayerIds, slayers, tierLabels } from "../../data/slayers";
import { calculatePlan, getTierAccess, isDecimalInRange, maxSeconds, maxXp, type PlanInputs } from "../../lib/calculator";
import { formatNumber } from "../../lib/formatting";
import { newPlan, type Preferences } from "../../lib/preferences";
import { Results } from "./Results";
import { LootTable } from "./LootTable";

type Draft = Omit<PlanInputs, "currentXp" | "secondsPerBoss" | "observedXp"> & {
  currentXp: string;
  secondsPerBoss: string;
  observedXp?: string;
};

function draftFrom(plan: PlanInputs): Draft {
  return {
    ...plan, currentXp: String(plan.currentXp), secondsPerBoss: String(plan.secondsPerBoss),
    observedXp: plan.observedXp === undefined ? undefined : String(plan.observedXp),
  };
}

function parseDraft(draft: Draft): PlanInputs {
  return {
    ...draft, currentXp: parseDecimal(draft.currentXp), secondsPerBoss: parseDecimal(draft.secondsPerBoss),
    observedXp: draft.observedXp === undefined ? undefined : parseDecimal(draft.observedXp),
  };
}

export function Calculator({ initial, preferences, onFutureTiersChange, onSlayerChange, onSave, renderProfit }: {
  initial: PlanInputs; preferences: Preferences;
  onFutureTiersChange: (allow: boolean) => void;
  onSlayerChange: (slayer: PlanInputs["slayer"]) => void; onSave: (plan: PlanInputs) => void;
  renderProfit: (plan: PlanInputs, result: ReturnType<typeof calculatePlan>) => ReactNode;
}) {
  const [draft, setDraft] = useState(() => draftFrom(initial));
  if (draft.slayer !== initial.slayer) setDraft(draftFrom(initial));
  const slayer = slayers[draft.slayer];
  const plan = parseDraft(draft);
  const result = calculatePlan(plan, preferences.allowFutureTiers);
  const selectedTier = slayer.tiers[draft.tier - 1];
  const [baseXp, baseFee] = selectedTier ?? [0, 0];
  const xpReward = draft.aatroxXp ? baseXp * mayorPerks.xpMultiplier : baseXp;
  const currentXpError = !isDecimalInRange(plan.currentXp, 0, maxXp) ? "Enter 0 to 1 trillion XP, with up to two decimals." : undefined;
  const timeError = !isDecimalInRange(plan.secondsPerBoss, 0, maxSeconds) ? "Enter 0 to 86,400 seconds, with up to two decimals." : undefined;
  const rewardError = plan.observedXp !== undefined && !isDecimalInRange(plan.observedXp, 0.01, maxXp)
    ? "Enter 0.01 to 1 trillion XP, with up to two decimals." : undefined;
  const access = getTierAccess(draft.slayer, draft.tier, plan.currentXp);

  function update(changes: Partial<Draft>) {
    const next = { ...draft, ...changes };
    setDraft(next);
    const parsed = parseDraft(next);
    if (calculatePlan({ ...parsed, tier: parsed.tier || 1 }, true).ok) onSave(parsed);
  }

  return <>
    <div className="calculator">
      <section className="configuration" aria-labelledby="config-title">
        <header className="section-header">
          <h2 id="config-title">Quest plan</h2>
          <button className="text-button" type="button" onClick={() => {
            const fresh = newPlan(draft.slayer, preferences);
            setDraft(draftFrom(fresh));
            onSave(fresh);
          }}><RotateCcw size={14} aria-hidden="true" /> Reset plan</button>
        </header>
        <div className="fields">
          <div className="field">
            <label htmlFor="slayer">Slayer</label>
            <select id="slayer" value={draft.slayer} onChange={(event) => {
              const value = event.currentTarget.value;
              if (isSlayerId(value)) onSlayerChange(value);
            }}>
              {slayerIds.map((id) => <option key={id} value={id}>{slayers[id].label}</option>)}
            </select>
          </div>
          <NumberField label="Current XP" unit="XP" value={draft.currentXp} error={currentXpError}
            onChange={(currentXp) => update({ currentXp })} />
          <div className="field">
            <label htmlFor="target">Target level</label>
            <select id="target" value={draft.targetLevel} onChange={(event) => update({ targetLevel: Number(event.currentTarget.value) })}>
              {slayer.thresholds.map((xp, i) => <option value={i + 1} key={xp}>Level {i + 1}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tier">Quest tier</label>
            <select id="tier" value={draft.tier} aria-describedby={selectedTier ? "tier-unlock" : undefined}
              onChange={(event) => update({ tier: Number(event.currentTarget.value), observedXp: undefined, confirmedAccess: false })}>
              <option value={0} disabled>Choose a quest tier</option>
              {slayer.tiers.map((_, i) => {
                const tier = i + 1;
                const requirement = getTierAccess(draft.slayer, tier, plan.currentXp);
                const status = requirement.xpLocked ? "Locked"
                  : requirement.prerequisites && !(tier === draft.tier && draft.confirmedAccess) ? "Verify" : "Available";
                return <option value={tier} key={tier} disabled={requirement.xpLocked && !preferences.allowFutureTiers}>
                  Tier {tierLabels[i]} · {currentXpError ? "Check XP" : status}
                </option>;
              })}
            </select>
          </div>
          {selectedTier && <div className="tier-requirements" id="tier-unlock">
            {!currentXpError && <p className="field-note">
              {access.requiredXp === undefined
                ? `Slayer level ${access.currentLevel}`
                : `Slayer level ${access.currentLevel} · Tier ${tierLabels[draft.tier - 1]} requires level ${access.requiredLevel} (${formatNumber(access.requiredXp)} XP)`}
            </p>}
            {access.prerequisites && <>
              <p className="field-note">Requires {access.prerequisites}.</p>
              {access.uncertain && <p className="field-note">{access.uncertain}</p>}
              <label className="check-row">
                <input type="checkbox" checked={Boolean(draft.confirmedAccess)} disabled={Boolean(currentXpError) || access.xpLocked}
                  onChange={(event) => update({ confirmedAccess: event.currentTarget.checked })} />
                <span>I can start this quest</span>
              </label>
            </>}
          </div>}
          {draft.observedXp === undefined
            ? <div className="field">
              <label htmlFor="tier-xp">XP per boss</label>
              <div className="number-control"><input id="tier-xp" value={selectedTier ? formatNumber(xpReward) : "—"} readOnly /><span aria-hidden="true">XP</span></div>
            </div>
            : <NumberField label="XP per boss" unit="XP" value={draft.observedXp} error={rewardError}
              onChange={(observedXp) => update({ observedXp })} />}
          <NumberField label="Time per boss" unit="sec" value={draft.secondsPerBoss} error={timeError}
            onChange={(secondsPerBoss) => update({ secondsPerBoss })} />
        </div>
        <label className="planning-mode check-row">
          <input type="checkbox" checked={preferences.allowFutureTiers}
            onChange={(event) => onFutureTiersChange(event.currentTarget.checked)} />
          <span>Allow future tiers <small>Estimate a single tier before you can start it.</small></span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={draft.observedXp !== undefined} disabled={!selectedTier} onChange={(event) =>
            update(event.currentTarget.checked ? { observedXp: String(xpReward), aatroxXp: false } : { observedXp: undefined })} />
          <span>Use observed XP <small>Enter the reward with bonuses already included.</small></span>
        </label>
        <fieldset className="modifiers">
          <legend>Aatrox perks</legend>
          {slayer.mayorPerksVerified ? <div className="modifier-options">
            <label className="check-row">
              <input type="checkbox" checked={draft.aatroxXp} disabled={draft.observedXp !== undefined}
                onChange={(event) => update({ aatroxXp: event.currentTarget.checked })} />
              <span>Slayer XP Buff <small>+25% XP</small></span>
            </label>
            <label className="check-row">
              <input type="checkbox" checked={draft.slashedPricing}
                onChange={(event) => update({ slashedPricing: event.currentTarget.checked })} />
              <span>Slashed Pricing <small>Half-price quests</small></span>
            </label>
          </div> : <p className="field-note">Rift perk behaviour is unverified. Use observed XP if you see a bonus.</p>}
        </fieldset>
      </section>
      <Results result={result} input={plan} preferences={preferences} baseFee={baseFee} />
    </div>
    <LootTable boss={slayer.boss} tier={draft.tier} currentLevel={currentXpError ? undefined : access.currentLevel} />
    {renderProfit(plan, result)}
  </>;
}
