import { useState } from "react";
import { formatNumber } from "./lib/formatting";
import { lootItems, type PriceTable } from "./lib/profit";

export function ProfitEditor({ table, onChange }: { table: PriceTable; onChange: (table: PriceTable) => void }) {
  const [prices, setPrices] = useState(table.prices);
  const [message, setMessage] = useState("");
  function update(item: string, raw: string) {
    const value = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) return;
    const next = { ...prices, [item]: value };
    setPrices(next);
    onChange({ prices: next, lastEdited: new Date().toISOString().slice(0, 10) });
    setMessage("Prices saved locally.");
  }
  return <div className="price-editor">
    <p className="field-note">Approximate local prices only. These values never alter audited game data or XP calculations.</p>
    <p className="field-note">Last edited: {table.lastEdited ?? "Never"}</p>
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
