export function createBugReport(steps: string) {
  const platform = typeof navigator === "undefined" ? "Unknown" : navigator.platform || "Unknown";
  const version = "1.1.0";
  return [`Slayer Planner bug report`, `App version: ${version}`, `Platform: ${platform}`, ``, `Reproduction steps:`, steps.trim() || "(not provided)", ``, `Diagnostics: offline calculator, no account data included.`].join("\n");
}
