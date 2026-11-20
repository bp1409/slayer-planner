const topics = [
  ["Current XP", "Enter your total XP for this Slayer. Use the cumulative total from the in-game Slayer menu."],
  ["Target level and XP", "Each Slayer level requires a cumulative XP total. The target XP is shown beside the progress bar. The milestones list shows upcoming thresholds and XP still needed."],
  ["Quest access", "Your current XP determines your Slayer level. Locked tiers also require the listed Combat level, previous-tier completion, or other verified prerequisite. Confirm access when the game has a prerequisite the planner cannot verify."],
  ["Future tiers", "Enable Allow future tiers to estimate using a tier you may need to unlock. Every quest in the estimate uses that tier. Any quests needed to unlock it are outside the estimate."],
  ["Profit inputs", "Set spawn and kill time for each Slayer and tier in Expected profit. Both are saved locally. Hourly values stay unavailable until the combined time is greater than zero."],
  ["Quest cost", "The total covers starting the required number of quests. Failed quests, equipment, consumables, and other discounts are outside this estimate."],
  ["Aatrox and other XP bonuses", "Enable Slayer XP Buff and Slashed Pricing independently when active. Fractional Aatrox XP uses the published multiplier as an estimate. Use observed XP to enter the actual reward with any applicable bonuses already included. Rift perk behaviour has not been verified, so the planner uses base Rift fees."],
  ["Loot odds", "Loot tables show verified base chances and only verified Slayer-level requirements. Missing prices are excluded from profit totals and are listed as an incomplete estimate. Magic Find and RNG Meter are not included."],
];

export function PlannerHelp() {
  return <dl className="help-list">
    {topics.map(([term, definition]) => <div key={term}>
      <dt>{term}</dt>
      <dd>{definition}</dd>
    </div>)}
  </dl>;
}
