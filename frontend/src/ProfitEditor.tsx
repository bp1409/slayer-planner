import { useState, type Dispatch, type SetStateAction } from "react";
import { formatNumber } from "./lib/formatting";
import { lootItems, type PriceTable } from "./lib/profit";
import { bazaarProductIds, fetchBazaarPrices } from "./lib/bazaar";
import { fetchAuctionPrices } from "./lib/auction";

export function ProfitEditor({ table, onChange, bazaarEnabled }: { table: PriceTable; onChange: Dispatch<SetStateAction<PriceTable>>; bazaarEnabled: boolean }) {
  const { prices } = table;
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  function update(item: string, raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000) return;
    onChange((previous) => {
      const next = { ...previous.prices };
      if (raw === "") delete next[item];
      else next[item] = value;
      return { ...previous, prices: next, lastEdited: new Date().toISOString().slice(0, 10) };
    });
    setMessage("Prices saved locally.");
  }
  async function refreshBazaar() {
    if (!bazaarEnabled || refreshing) return;
    setRefreshing(true);
    setMessage("");
    try {
      const [bazaarResult, auctionResult] = await Promise.allSettled([
        fetchBazaarPrices(bazaarProductIds), fetchAuctionPrices(lootItems()),
      ]);
      if (bazaarResult.status === "rejected" && auctionResult.status === "rejected") {
        throw new Error("Bazaar and Auction House prices could not be refreshed.");
      }
      const bazaarPrices = bazaarResult.status === "fulfilled"
        ? Object.fromEntries(Object.entries(bazaarResult.value.prices).map(([item, value]) => [item, value.sellPrice])) : undefined;
      const auctionPrices = auctionResult.status === "fulfilled"
        ? Object.fromEntries(Object.entries(auctionResult.value.prices).map(([item, value]) => [item, value.price])) : undefined;
      onChange((previous) => ({
        ...previous,
        ...(bazaarResult.status === "fulfilled" ? { bazaarProductIds, bazaarPrices, bazaarFetchedAt: bazaarResult.value.fetchedAt } : {}),
        ...(auctionResult.status === "fulfilled" ? { auctionPrices, auctionFetchedAt: auctionResult.value.fetchedAt } : {}),
      }));
      const details = [
        bazaarPrices && `${Object.keys(bazaarPrices).length} Bazaar`,
        auctionPrices && `${Object.keys(auctionPrices).length} Auction House`,
      ].filter(Boolean).join(" and ");
      setMessage(`Market prices refreshed: ${details}.`);
    } catch (error) {
      setMessage((error instanceof Error ? error.message : "Bazaar refresh failed.") + " Saved prices are still available.");
    } finally { setRefreshing(false); }
  }
  return <div className="price-editor">
    <p className="field-note">Enter a local price per item. Local prices take priority, followed by Bazaar and Auction House estimates.</p>
    <p className="field-note">Last edited: {table.lastEdited ?? "Never"}</p>
    {bazaarEnabled && <section className="bazaar-editor" aria-labelledby="bazaar-title">
      <h3 id="bazaar-title">Optional market refresh</h3>
      <p className="field-note">Refreshes verified Bazaar prices and lowest active Auction House BIN estimates. No plan data is sent.</p>
      <button type="button" className="button" disabled={refreshing} onClick={() => void refreshBazaar()}>
        {refreshing ? "Refreshing market prices…" : "Refresh market prices"}
      </button>
      {table.bazaarFetchedAt && <p className="field-note">Last Bazaar refresh: {new Date(table.bazaarFetchedAt).toLocaleString()}</p>}
    </section>}
    <div className="price-list">
      {lootItems().map((item) => <div className="price-row" key={item}>
        <label htmlFor={`price-${item}`}>{item}</label>
        <div className="number-control"><input id={`price-${item}`} inputMode="numeric" type="number" min="0" max="1000000000000" step="any"
          value={prices[item] ?? ""} onChange={(event) => update(item, event.currentTarget.value)} aria-label={`Price for ${item}`} />
          <span aria-hidden="true">coins</span></div>
        {bazaarEnabled && table.bazaarPrices[item] !== undefined && <small className="field-note">Bazaar: {formatNumber(table.bazaarPrices[item])} coins</small>}
      </div>)}
    </div>
    {message && <p className="field-note" role="status">{message}</p>}
    <p className="field-note">Current entries: {formatNumber(Object.keys(prices).length)}</p>
  </div>;
}
