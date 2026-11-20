import { useState } from "react";
import { NumberField, parseDecimal } from "./components/ui/NumberField";
import { tierLabels } from "./data/slayers";
import { isDecimalInRange, maxSeconds } from "./lib/calculator";
import { defaults, type Preferences } from "./lib/preferences";
import { isTauri } from "./lib/platform";

export function PlannerSettings({ preferences, onChange }: {
  preferences: Preferences; onChange: (preferences: Preferences) => void;
}) {
  const [seconds, setSeconds] = useState(String(preferences.defaultSeconds));
  const invalidSeconds = !isDecimalInRange(parseDecimal(seconds), 0, maxSeconds);
  return <div className="preferences">
    <section>
      <h3>Appearance</h3>
      <label className="preference-row">Theme
        <select value={preferences.theme} onChange={(event) =>
          onChange({ ...preferences, theme: event.currentTarget.value as Preferences["theme"] })}>
          <option value="dark">Dark</option><option value="light">Light</option><option value="system">Follow system</option>
        </select>
      </label>
      <label className="preference-row">Number format
        <select value={preferences.numberFormat} onChange={(event) =>
          onChange({ ...preferences, numberFormat: event.currentTarget.value as Preferences["numberFormat"] })}>
          <option value="full">Full numbers</option><option value="compact">Compact</option>
        </select>
      </label>
      <label className="preference-row">Time format
        <select value={preferences.timeFormat} onChange={(event) =>
          onChange({ ...preferences, timeFormat: event.currentTarget.value as Preferences["timeFormat"] })}>
          <option value="units">1h 30m</option><option value="clock">01:30:00</option>
        </select>
      </label>
      <label className="preference-row">Show XP milestones
        <input type="checkbox" checked={preferences.showMilestones}
          onChange={(event) => onChange({ ...preferences, showMilestones: event.currentTarget.checked })} />
      </label>
      <label className="preference-row">Reduce motion
        <input type="checkbox" checked={preferences.reduceMotion}
          onChange={(event) => onChange({ ...preferences, reduceMotion: event.currentTarget.checked })} />
      </label>
      <label className="preference-row">Enable Bazaar Pricing (web only)
        <input type="checkbox" checked={preferences.allowBazaar} disabled={isTauri()}
          onChange={(event) => onChange({ ...preferences, allowBazaar: event.currentTarget.checked })} />
      </label>
      <p className="field-note">When enabled, the web app may refresh approximate Bazaar prices. The offline desktop app never connects.</p>
    </section>
    <section>
      <h3>Calculator defaults</h3>
      <p>Used for new and reset plans. Unsupported tiers require a new selection. Target levels are limited to the Slayer’s maximum.</p>
      <label className="preference-row">Default target level
        <select value={preferences.defaultTarget} onChange={(event) =>
          onChange({ ...preferences, defaultTarget: Number(event.currentTarget.value) })}>
          {Array.from({ length: 9 }, (_, i) => <option key={i} value={i + 1}>Level {i + 1}</option>)}
        </select>
      </label>
      <label className="preference-row">Default quest tier
        <select value={preferences.defaultTier} onChange={(event) =>
          onChange({ ...preferences, defaultTier: Number(event.currentTarget.value) })}>
          {tierLabels.map((tier, i) => <option key={tier} value={i + 1}>Tier {tier}</option>)}
        </select>
      </label>
      <NumberField label="Default time per boss" unit="sec" value={seconds}
        error={invalidSeconds ? "Enter 0 to 86,400 seconds." : undefined}
        onChange={(value) => {
          setSeconds(value);
          const parsed = parseDecimal(value);
          if (isDecimalInRange(parsed, 0, maxSeconds)) onChange({ ...preferences, defaultSeconds: parsed });
        }} />
    </section>
    <button type="button" className="button" onClick={() => {
      setSeconds(String(defaults.defaultSeconds));
      onChange(defaults);
    }}>Reset preferences</button>
  </div>;
}
