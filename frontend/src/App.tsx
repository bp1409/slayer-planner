import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { CircleHelp, Crosshair, Moon, Settings, Share2, Sun } from "lucide-react";
import { Modal } from "./components/ui/Modal";
import { Calculator } from "./components/calculator/Calculator";
import { PlannerHelp } from "./PlannerHelp";
import { PlannerSettings } from "./PlannerSettings";
import { loadPreferences, loadWorkspace, newPlan, savePreferences, saveWorkspace } from "./lib/preferences";
import { slayers } from "./data/slayers";
import { GAME_DATA_VERIFIED_DATE } from "./data/gameData";
import { checkForUpdates } from "./lib/updater";
import { SharePlan } from "./SharePlan";

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function subscribeToTheme(listener: () => void) {
  systemTheme.addEventListener("change", listener);
  return () => systemTheme.removeEventListener("change", listener);
}

export default function App() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
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
  useEffect(() => {
    if (!preferences.allowUpdates) return;
    void checkForUpdates(true).then((update) => {
      if (update) console.info(`Slayer Planner update ${update.version} is available.`);
    }).catch(() => {
      // Update checks are optional; local planning remains available when unavailable.
    });
  }, [preferences.allowUpdates]);

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
        <Modal title="Share plan" icon={<Share2 size={18} aria-hidden="true" />}>
          <SharePlan plan={workspace.plans[workspace.slayer] ?? newPlan(workspace.slayer, preferences)} onImport={(plan) => {
            setWorkspace((previous) => ({ ...previous, slayer: plan.slayer, plans: { ...previous.plans, [plan.slayer]: plan } }));
            setWorkspaceRevision((previous) => previous + 1);
          }} />
        </Modal>
      </div>
    </header>
    <main id="workspace" tabIndex={-1} className="workspace">
      <header className="workspace-header">
        <div><h1>{slayer.label} Slayer</h1><p>{slayer.boss}</p><small className="data-status">Game data verified on {GAME_DATA_VERIFIED_DATE}</small></div>
        <a href="#loot">View loot</a>
      </header>
      <Calculator key={workspaceRevision} initial={workspace.plans[workspace.slayer] ?? newPlan(workspace.slayer, preferences)}
        onFutureTiersChange={(allowFutureTiers) => setPreferences((previous) => ({ ...previous, allowFutureTiers }))}
        preferences={preferences} onSlayerChange={(slayer) => setWorkspace((previous) => ({ ...previous, slayer }))}
        onSave={(plan) => setWorkspace((previous) => ({
          ...previous, plans: { ...previous.plans, [plan.slayer]: plan },
        }))} />
    </main>
  </>;
}
