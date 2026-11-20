export async function checkForUpdates(enabled: boolean) {
  if (!enabled || !("__TAURI__" in window)) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  return check();
}
