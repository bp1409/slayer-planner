import { slayers } from "../../data/slayers";
import { type calculatePlan, type PlanInputs } from "../../lib/calculator";
import { formatNumber, formatTime } from "../../lib/formatting";
import type { Preferences } from "../../lib/preferences";

export function Results({ result, input, preferences, baseFee }: {
  result: ReturnType<typeof calculatePlan>; input: PlanInputs; preferences: Preferences; baseFee: number;
}) {
  const number = (value: number) => formatNumber(value, preferences.numberFormat);
  if (!result.ok) return <section className="results" aria-labelledby="results-title">
    <header className="section-header"><h2 id="results-title">Results</h2></header>
    <p className="result-message" role="status">{result.message}</p>
  </section>;

  const { bosses, cost, currency, currentLevel, remainingXp, timeSeconds, targetXp, progress } = result;
  const completed = remainingXp === 0;
  const thresholds = slayers[input.slayer].thresholds;
  const currentIsMax = currentLevel === thresholds.length;
  const milestoneLevels = [...new Set([currentLevel + 1, input.targetLevel])]
    .filter((level) => level > currentLevel && level <= thresholds.length).sort((a, b) => a - b);

  return <section className="results" aria-labelledby="results-title">
    <header className="section-header">
      <h2 id="results-title">Results</h2>
      <span className="metadata">{result.assumesAccess ? "Future estimate" : "Current capability"}</span>
    </header>
    <div className="results-body">
      {result.assumesAccess && !completed && <p className="estimate-note">
        All quests in this estimate use the selected tier. {result.tierUnlockXp !== undefined && result.tierUnlockXp >= targetXp
          ? "The tier’s XP requirement is at or above your target."
          : "Any quests needed to unlock it are outside the estimate."}
      </p>}
      <dl className="metrics">
        <Metric label="Bosses required" value={formatNumber(bosses)} />
        <Metric label="XP remaining" value={number(remainingXp)} unit="XP" />
        <Metric label="Estimated time" value={input.secondsPerBoss || completed ? formatTime(timeSeconds, preferences.timeFormat) : "—"}
          detail={!input.secondsPerBoss && !completed ? "Time per boss is unset" : undefined} />
        <Metric label="Quest cost" value={number(cost)} unit={currency}
          detail={result.feePerBoss !== baseFee ? `${formatNumber(result.feePerBoss)} ${currency} per quest` : undefined} />
      </dl>
      <div className="progress-heading">
        <div><h3>Progress to level {input.targetLevel}</h3>
          <p><strong>{formatNumber(input.currentXp)}</strong> / {formatNumber(targetXp)} XP</p>
        </div>
        <span>{progress === 100 ? "100" : progress >= 99.9 ? ">99.9" : formatNumber(Math.floor(progress * 10) / 10)}%</span>
      </div>
      <progress aria-label="Progress to target level" max={100} value={progress} />
      {completed && <p className="result-message">Target reached. No more quests required.</p>}
      {currentIsMax && <p className="field-note">Maximum Slayer level reached.</p>}
      {result.fractionalPerkEstimate && !completed && <p className="field-note">Fractional XP is estimated. Use observed XP to match the reward shown in-game.</p>}
      {preferences.showMilestones && milestoneLevels.length > 0 && <section className="milestones" aria-labelledby="milestones-title">
        <h3 id="milestones-title">XP milestones</h3>
        <dl>{milestoneLevels.map((level) => <div key={level}>
          <dt>Level {level}{level === input.targetLevel && <small>Target</small>}</dt>
          <dd>{formatNumber(thresholds[level - 1])} XP</dd>
          <dd>{formatNumber(thresholds[level - 1] - input.currentXp)} XP left</dd>
        </div>)}</dl>
      </section>}
    </div>
  </section>;
}

function Metric({ label, value, unit, detail }: { label: string; value: string; unit?: string; detail?: string }) {
  return <div className="metric">
    <dt>{label}</dt>
    <dd className="metric-value"><strong>{value}</strong>{unit && <span>{unit}</span>}</dd>
    {detail && <dd className="metric-detail">{detail}</dd>}
  </div>;
}
