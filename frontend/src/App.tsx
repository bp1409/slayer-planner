import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { CircleHelp, Crosshair, Moon, Settings, Sun } from "lucide-react";
import { Modal } from "./components/ui/Modal";
import { Calculator } from "./components/calculator/Calculator";
import { PlannerHelp } from "./PlannerHelp";
import { PlannerSettings } from "./PlannerSettings";
import { loadPreferences, loadWorkspace, newPlan, savePreferences, saveWorkspace } from "./lib/preferences";
import { slayers } from "./data/slayers";

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function subscribeToTheme(listener: () => void) {
  systemTheme.addEventListener("change", listener);
  return () => systemTheme.removeEventListener("change", listener);
}

export default function App() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const systemDark = useSyncExternalStore(subscribeToTheme, () => systemTheme.matches);
  const theme = preferences.theme === "system" ? (systemDark ? "dark" : "light") : preferences.theme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const slayer = slayers[workspace.slayer];

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
  }, [theme, preferences.reduceMotion]);
  useEffect(() => savePreferences(preferences), [preferences]);
  useEffect(() => saveWorkspace(workspace), [workspace]);

  return <>
    <a className="skip-link" href="#workspace">Skip to calculator</a>
    <header className="toolbar">
      <div className="product"><Crosshair size={19} aria-hidden="true" /><strong>Slayer Planner</strong></div>
      <div className="toolbar-actions">
        <Modal title="Help" icon={<CircleHelp size={18} aria-hidden="true" />}><PlannerHelp /></Modal>
        <button type="button" className="icon-button" aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`} onClick={() => setPreferences({ ...preferences, theme: nextTheme })}>
          {nextTheme === "light" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
        <Modal title="Settings" icon={<Settings size={18} aria-hidden="true" />}>
          <PlannerSettings preferences={preferences} onChange={setPreferences} />
        </Modal>
      </div>
    </header>
    <main id="workspace" tabIndex={-1} className="workspace">
      <header className="workspace-header">
        <div><h1>{slayer.label} Slayer</h1><p>{slayer.boss}</p></div>
        <a href="#loot">View loot</a>
      </header>
      <Calculator initial={workspace.plans[workspace.slayer] ?? newPlan(workspace.slayer, preferences)}
        onFutureTiersChange={(allowFutureTiers) => setPreferences((previous) => ({ ...previous, allowFutureTiers }))}
        preferences={preferences} onSlayerChange={(slayer) => setWorkspace((previous) => ({ ...previous, slayer }))}
        onSave={(plan) => setWorkspace((previous) => ({
          ...previous, plans: { ...previous.plans, [plan.slayer]: plan },
        }))} />
    </main>
  </>;
}
