export type NumberFormat = "full" | "compact";
export type TimeFormat = "units" | "clock";

const full = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
export const formatNumber = (value: number, mode: NumberFormat = "full") =>
  mode === "compact" && value >= 1_000 ? compact.format(value) : full.format(value);

export function formatTime(seconds: number, mode: TimeFormat) {
  if (seconds < 1 && seconds > 0) return `${formatNumber(seconds)} s`;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  const secs = total % 60;
  if (mode === "clock") return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
  const days = Math.floor(hours / 24);
  return [days && `${formatNumber(days)}d`, hours % 24 && `${hours % 24}h`, minutes && `${minutes}m`, secs && `${secs}s`]
    .filter(Boolean).join(" ") || "0s";
}
