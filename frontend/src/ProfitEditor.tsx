import { useState } from "react";
import { formatNumber } from "./lib/formatting";
import { lootItems, type PriceTable } from "./lib/profit";
import { fetchBazaarPrices, suggestedBazaarProductId } from "./lib/bazaar";

export function ProfitEditor({ table, onChange, bazaarEnabled }: { table: PriceTable; onChange: (table: PriceTable) => void; bazaarEnabled: boolean }) {
  const [prices, setPrices] = useState(table.prices);
  const [message, setMessage] = useState("");
  const [productIds, setProductIds] = useState(() => Object.fromEntries(
    lootItems().map((item) => [item, table.bazaarProductIds[item] ?? suggestedBazaarProductId(item)]),
  ));
  const [refreshing, setRefreshing] = useState(false);
  function update(item: string, raw: string) {
    const value = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) return;
    const next = { ...prices, [item]: value };
    setPrices(next);
    onChange({ ...table, prices: next, lastEdited: new Date().toISOString().slice(0, 10) });
    setMessage("Prices saved locally.");
  }
  async function refreshBazaar() {
    setRefreshing(true);
    setMessage("");
    try {
      const snapshot = await fetchBazaarPrices(productIds);
      const bazaarPrices = Object.fromEntries(Object.entries(snapshot.prices).map(([item, value]) => [item, value.sellPrice]));
      onChange({ ...table, bazaarProductIds: productIds, bazaarPrices, bazaarFetchedAt: snapshot.fetchedAt });
      setMessage(`Bazaar prices refreshed for ${Object.keys(bazaarPrices).length} mapped item(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bazaar refresh failed.");
    } finally { setRefreshing(false); }
  }
  return <div className="price-editor">
    <p className="field-note">Approximate local prices only. These values never alter audited game data or XP calculations.</p>
    <p className="field-note">Last edited: {table.lastEdited ?? "Never"}</p>
    {bazaarEnabled && <section className="bazaar-editor" aria-labelledby="bazaar-title">
      <h3 id="bazaar-title">Optional Bazaar refresh</h3>
      <p className="field-note">Product IDs are suggested from the existing drop names and remain editable. Bazaar sell prices override matching local prices until the next refresh; unmapped drops keep their local values. No plan data is sent.</p>
      <div className="price-list">{lootItems().map((item) => <div className="price-row" key={`bazaar-${item}`}>
        <label htmlFor={`bazaar-${item}`}>{item}</label>
        <input id={`bazaar-${item}`} placeholder="e.g. REVENANT_FLESH" value={productIds[item] ?? ""}
          onChange={(event) => {
            const value = event.currentTarget.value.toUpperCase();
            const next = { ...productIds };
            if (value) next[item] = value; else delete next[item];
            setProductIds(next);
            onChange({ ...table, bazaarProductIds: next });
          }} aria-label={`Bazaar product ID for ${item}`} />
      </div>)}</div>
      <button type="button" className="button" disabled={refreshing} onClick={() => void refreshBazaar()}>
        {refreshing ? "Refreshing Bazaar…" : "Refresh Bazaar sell prices"}
      </button>
      {table.bazaarFetchedAt && <p className="field-note">Last Bazaar refresh: {new Date(table.bazaarFetchedAt).toLocaleString()}</p>}
    </section>}
    <div className="price-list">
      {lootItems().map((item) => <div className="price-row" key={item}>
        <label htmlFor={`price-${item}`}>{item}</label>
        <div className="number-control"><input id={`price-${item}`} inputMode="numeric" type="number" min="0" max="1000000000000" step="1"
          value={prices[item] ?? ""} onChange={(event) => update(item, event.currentTarget.value)} aria-label={`Price for ${item}`} />
          <span aria-hidden="true">coins</span></div>
      </div>)}
    </div>
    {message && <p className="field-note" role="status">{message}</p>}
    <p className="field-note">Current entries: {formatNumber(Object.values(prices).filter((price) => price > 0).length)}</p>
  </div>;
}
