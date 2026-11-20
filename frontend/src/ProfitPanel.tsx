import { useState } from "react";
import { NumberField, parseDecimal } from "./components/ui/NumberField";
import { slayers, tierLabels } from "./data/slayers";
import { maxSeconds, type calculatePlan, type PlanInputs } from "./lib/calculator";
import { formatNumber } from "./lib/formatting";
import { isCompletionTime, type CompletionTime } from "./lib/preferences";
import { coinsPerHour, estimateProfit, type PriceTable } from "./lib/profit";

function display(value: number | null, signed = false) {
  if (value === null) return "—";
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  return (rounded && signed ? (value < 0 ? "−" : "+") : "") + formatNumber(signed ? rounded : value);
}

export function ProfitPanel({ plan, result, time, onTimeChange, table, bazaarEnabled }: {
  plan: PlanInputs;
  result: ReturnType<typeof calculatePlan>;
  time?: CompletionTime;
  onTimeChange: (time: CompletionTime) => void;
  table: PriceTable;
  bazaarEnabled: boolean;
}) {
  const [draft, setDraft] = useState<Partial<Record<keyof CompletionTime, string>>>({});
  const spawn = draft.spawn ?? String(time?.spawn ?? 0);
  const kill = draft.kill ?? String(time?.kill ?? plan.secondsPerBoss);
  const parseTime = (raw: string) => raw.trim() === "" ? 0 : parseDecimal(raw);
  const completionTime = { spawn: parseTime(spawn), kill: parseTime(kill) };
  const valid = isCompletionTime(completionTime);
  const seconds = valid ? completionTime.spawn + completionTime.kill : NaN;
  const cached = bazaarEnabled ? table.bazaarPrices : {};
  const prices = { ...cached, ...table.prices };

  function update(field: keyof CompletionTime, raw: string) {
    setDraft((previous) => ({ ...previous, [field]: raw }));
    const next = { ...completionTime, [field]: parseTime(raw) };
    if (isCompletionTime(next)) onTimeChange(next);
  }

  const estimate = result.ok ? estimateProfit(plan, result, seconds, prices) : null;
  const rift = result.ok && result.currency === "motes";
  const unit = rift ? "Motes" : "coins";
  return <section className="profit-panel" aria-labelledby="profit-title">
    <header className="section-header"><h2 id="profit-title">Expected profit</h2>
      <span className="metadata">{Object.keys(cached).length ? "Local and Bazaar pricing" : "Local prices"}</span></header>
    {tierLabels[plan.tier - 1] && <>
      <div className="fields profit-times">
        <NumberField label="Spawn time" unit="s" value={spawn} onChange={(raw) => update("spawn", raw)} />
        <NumberField label="Kill time" unit="s" value={kill} onChange={(raw) => update("kill", raw)} />
      </div>
      {!valid && <p className="field-error" role="status">Enter 0 to {formatNumber(maxSeconds)} seconds per field, with up to two decimals.</p>}
      {valid && seconds === 0 && <p className="field-note">Enter a completion time above zero to see hourly estimates.</p>}
      <p className="field-note">{time ? "Times are saved for this Slayer and tier." : "Uses the quest plan time until you set times for this Slayer and tier."}</p>
    </>}
    {estimate && result.ok ? <>
      <p className="field-note">Base drop rates at current Slayer level {result.currentLevel} are used throughout the plan. Market taxes and other expenses are excluded.</p>
      <p className="field-note">Pricing coverage: {estimate.loot.priced} of {estimate.loot.priced + estimate.loot.missing.length} eligible drops priced. Edit prices in Profit.</p>
      {estimate.loot.missing.length > 0 && <p className="field-note"><strong>Partial estimate.</strong> Missing prices are excluded: {estimate.loot.missing.join(", ")}.</p>}
      {estimate.loot.uncertainUnlock && <p className="field-note">Fang-tastic Chocolate Chip is excluded because its Tier II unlock at Slayer level 3 is disputed.</p>}
      {rift && <p className="field-note">Rift quest fees and net profit are in Motes. Item loot is valued separately in coins.</p>}
      <div className="profit-table-wrap"><table className="profit-table" aria-label="Profit estimate for selected quest">
        <tbody>
          <tr><th scope="row">Selected quest</th><td>{slayers[plan.slayer].label} {tierLabels[plan.tier - 1]}</td></tr>
          <tr><th scope="row">Expected item loot / boss</th><td>{display(estimate.loot.coins)} coins</td></tr>
          <tr><th scope="row">Quest fee / boss</th><td>{display(result.feePerBoss)} {unit}</td></tr>
          <tr><th scope="row">Net / boss</th><td>{display(estimate.netPerBoss, true)} {unit}</td></tr>
          {rift && <tr><th scope="row">Gross item loot / hour</th><td>{display(coinsPerHour(estimate.loot.coins, seconds))} coins</td></tr>}
          <tr><th scope="row">Gross / hour</th><td>{display(estimate.grossPerHour)} {unit}</td></tr>
          <tr><th scope="row">Net / hour</th><td>{display(estimate.netPerHour, true)} {unit}</td></tr>
          <tr><th scope="row">Total net ({formatNumber(result.bosses)} bosses)</th><td>{display(estimate.totalNet, true)} {unit}</td></tr>
          {rift && <tr><th scope="row">Total item loot</th><td>{display(estimate.loot.coins * result.bosses)} coins</td></tr>}
        </tbody>
      </table></div>
    </> : <p className="field-note">Complete the quest plan inputs to see the profit estimate.</p>}
  </section>;
}
