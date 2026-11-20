import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { Bug, CircleDollarSign, CircleHelp, Crosshair, Moon, Settings, Share2, Sun } from "lucide-react";
import { Modal } from "./components/ui/Modal";
import { Calculator } from "./components/calculator/Calculator";
import { PlannerHelp } from "./PlannerHelp";
import { PlannerSettings } from "./PlannerSettings";
import { loadCompletionTimes, loadPreferences, loadWorkspace, newPlan, saveCompletionTimes, savePreferences, saveWorkspace } from "./lib/preferences";
import { slayers } from "./data/slayers";
import { GAME_DATA_VERIFIED_DATE } from "./data/gameData";
import { SharePlan } from "./SharePlan";
import { ProfitEditor } from "./ProfitEditor";
import { ProfitPanel } from "./ProfitPanel";
import { loadPriceTable, savePriceTable, type PriceTable } from "./lib/profit";
import { loadProfiles, saveProfiles, type GrindingProfile } from "./lib/profiles";
import { ProfileManager } from "./ProfileManager";
import { BugReport } from "./BugReport";
import { isFreshBazaarPrice } from "./lib/bazaar";

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function subscribeToTheme(listener: () => void) {
  systemTheme.addEventListener("change", listener);
  return () => systemTheme.removeEventListener("change", listener);
}

export default function App() {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const [priceTable, setPriceTable] = useState<PriceTable>(loadPriceTable);
  const [completionTimes, setCompletionTimes] = useState(loadCompletionTimes);
  const [profiles, setProfiles] = useState<GrindingProfile[]>(() => loadProfiles(loadCompletionTimes()));
  const [activeProfileId, setActiveProfileId] = useState(() => loadProfiles(loadCompletionTimes())[0].id);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const systemDark = useSyncExternalStore(subscribeToTheme, () => systemTheme.matches);
  const theme = preferences.theme === "system" ? (systemDark ? "dark" : "light") : preferences.theme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const slayer = slayers[workspace.slayer];
  const bazaarEnabled = preferences.allowBazaar && !("__TAURI__" in window);
  const bazaarPrices = bazaarEnabled && priceTable.bazaarFetchedAt && isFreshBazaarPrice(priceTable.bazaarFetchedAt)
    ? priceTable.bazaarPrices : {};
  const auctionPrices = bazaarEnabled && priceTable.auctionFetchedAt && isFreshBazaarPrice(priceTable.auctionFetchedAt)
    ? priceTable.auctionPrices : {};

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
  }, [theme, preferences.reduceMotion]);
  useEffect(() => savePreferences(preferences), [preferences]);
  useEffect(() => saveWorkspace(workspace), [workspace]);
  useEffect(() => saveCompletionTimes(completionTimes), [completionTimes]);
  useEffect(() => saveProfiles(profiles), [profiles]);
  useEffect(() => savePriceTable(priceTable), [priceTable]);

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
          <ProfileManager profiles={profiles} activeId={activeProfileId} onSelect={(id) => { setActiveProfileId(id); const profile = profiles.find((item) => item.id === id); if (profile) setCompletionTimes(profile.completionTimes); }} onChange={setProfiles} />
        </Modal>
        <Modal title="Bug report" icon={<Bug size={18} aria-hidden="true" />}><BugReport /></Modal>
        <Modal title="Profit" icon={<CircleDollarSign size={18} aria-hidden="true" />}>
          <ProfitEditor table={priceTable} onChange={setPriceTable} bazaarEnabled={bazaarEnabled} />
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
        <div><h1>{slayer.label} Slayer</h1><p>{slayer.boss}</p><small className="data-status">Game data verified on {GAME_DATA_VERIFIED_DATE}. <a href="https://github.com/bp1409/slayer-planner/blob/dev/frontend/GAME-DATA.md">Some Zombie loot figures have open discrepancies.</a></small></div>
        <a href="#loot">View loot</a>
      </header>
      <Calculator key={workspaceRevision} initial={workspace.plans[workspace.slayer] ?? newPlan(workspace.slayer, preferences)}
        onFutureTiersChange={(allowFutureTiers) => setPreferences((previous) => ({ ...previous, allowFutureTiers }))}
        preferences={preferences} onSlayerChange={(slayer) => setWorkspace((previous) => ({ ...previous, slayer }))}
        onSave={(plan) => setWorkspace((previous) => ({
          ...previous, plans: { ...previous.plans, [plan.slayer]: plan },
        }))}
        bazaarPrices={bazaarPrices}
        auctionPrices={auctionPrices}
        renderProfit={(plan, result) => <ProfitPanel key={plan.slayer + ":" + plan.tier}
          plan={plan} result={result} table={priceTable} bazaarEnabled={bazaarEnabled}
          time={completionTimes[plan.slayer]?.[plan.tier]}
          onTimeChange={(time) => setCompletionTimes((previous) => {
            const next = { ...previous, [plan.slayer]: { ...previous[plan.slayer], [plan.tier]: time } };
            setProfiles((items) => items.map((profile) => profile.id === activeProfileId ? { ...profile, completionTimes: next } : profile));
            return next;
          })} />} />
    </main>
  </>;
}
