import { tierLabels } from "../../data/slayers";
import { formatNumber } from "../../lib/formatting";
import { lootSourceNote, slayerLoot } from "../../lib/loot";

const percent = new Intl.NumberFormat(undefined, { maximumFractionDigits: 10 });

export function LootTable({ boss, tier, currentLevel, bazaarPrices }: {
  boss: keyof typeof slayerLoot; tier: number; currentLevel?: number; bazaarPrices: Record<string, number>;
}) {
  const { source, tiers } = slayerLoot[boss];
  const rows = tiers[tier - 1];
  const sourceNote = lootSourceNote(boss, tier);
  return <section className="loot" id="loot" aria-labelledby="loot-title">
    <header className="section-header">
      <h2 id="loot-title">Loot reference</h2>
      {tier > 0 && <span className="metadata">Tier {tierLabels[tier - 1]}</span>}
    </header>
    {rows ? <>
      <p id="loot-note">Base odds per roll, before loot modifiers.{sourceNote && <><br />{sourceNote}</>}</p>
      <div className="loot-table-wrap">
        <table aria-labelledby="loot-title" aria-describedby="loot-note">
          <thead><tr><th scope="col">Item</th><th scope="col">Bazaar price</th><th scope="col">Chance</th><th scope="col">Amount</th><th scope="col">Required level</th></tr></thead>
          <tbody>{rows.map(([item, chance, amount, level]) => <tr key={item}>
            <th scope="row">{item}</th>
            <td className="loot-price">{bazaarPrices[item] === undefined ? "—" : `${formatNumber(bazaarPrices[item])} coins`}</td>
            <td>{percent.format(chance)}%</td>
            <td>{amount.replace("-", "–")}</td>
            <td>{level ?? "—"}{level !== undefined && currentLevel !== undefined && currentLevel < level &&
              <small className="loot-locked">Locked</small>}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </> : <p>{tier ? "Drop data is unavailable for this tier." : "Choose a quest tier to see its loot."}</p>}
    <a className="source-link" href={source} target="_blank" rel="noreferrer">Hypixel loot source</a>
  </section>;
}
