const topics = [
  ["Current XP", "Enter your total XP for this Slayer. Use the cumulative total from the in-game Slayer menu."],
  ["Target level and XP", "Each Slayer level requires a cumulative XP total. The target XP is shown beside the progress bar. The milestones list shows upcoming thresholds and XP still needed."],
  ["Quest access", "Your current XP determines your Slayer level. Confirm that you can start the selected quest where access also depends on Combat level, previous boss completions, or other prerequisites."],
  ["Future tiers", "Enable Allow future tiers to estimate using a tier you may need to unlock. Every quest in the estimate uses that tier. Any quests needed to unlock it are outside the estimate."],
  ["Time per boss", "Enter your average seconds for one complete quest, including spawning and fighting the boss. Use zero to omit time from the estimate."],
  ["Quest cost", "The total covers starting the required number of quests. Failed quests, equipment, consumables, and other discounts are outside this estimate."],
  ["Aatrox and other XP bonuses", "Enable Slayer XP Buff and Slashed Pricing independently when active. Fractional Aatrox XP uses the published multiplier as an estimate. Use observed XP to enter the actual reward with any applicable bonuses already included. Rift perk behaviour has not been verified, so the planner uses base Rift fees."],
  ["Loot odds", "Loot tables show base chances for the selected tier. Actual odds may vary with your unlocks and loot modifiers such as Magic Find or RNG Meter."],
];

export function PlannerHelp() {
  return <dl className="help-list">
    {topics.map(([term, definition]) => <div key={term}>
      <dt>{term}</dt>
      <dd>{definition}</dd>
    </div>)}
  </dl>;
}
