import { slayers } from "./data/slayers";
import { formatNumber } from "./lib/formatting";
import { profitRows, type PriceTable } from "./lib/profit";

export function ProfitPanel({ secondsPerBoss, table }: { secondsPerBoss: number; table: PriceTable }) {
  const rows = profitRows(secondsPerBoss, { ...table.prices, ...table.bazaarPrices });
  return <section className="profit-panel" aria-labelledby="profit-title">
    <header className="section-header"><h2 id="profit-title">Approximate coins/hour</h2><span className="metadata">{table.bazaarFetchedAt ? "Bazaar sell prices" : "Local prices"}</span></header>
    <p className="field-note">Uses bundled base loot rates and your seconds-per-boss. Magic Find and RNG Meter effects are not included.</p>
    <div className="profit-table-wrap"><table className="profit-table" aria-labelledby="profit-title">
      <thead><tr><th scope="col">Slayer</th><th scope="col">Tier</th><th scope="col">Expected coins/boss</th><th scope="col">Coins/hour</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={`${row.slayer}-${row.tier}`}>
        <th scope="row">{slayers[row.slayer].label}</th><td>{row.tier}</td><td>{formatNumber(row.coinsPerBoss)}</td><td>{formatNumber(row.coinsPerHour)}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
