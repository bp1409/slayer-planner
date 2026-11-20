import { isTauri } from "./platform";

export async function checkForUpdates(enabled: boolean) {
  if (!enabled || !isTauri()) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  return check();
}
