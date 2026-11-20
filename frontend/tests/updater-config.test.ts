import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("updater registration is opt-in and disabled for the default desktop build", async () => {
  const main = await readFile(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");
  const cargo = await readFile(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
  assert.match(main, /option_env!\("TAURI_UPDATER_PUBLIC_KEY"\)[\s\S]*tauri_plugin_updater/);
  assert.match(cargo, /tauri-plugin-updater\s*=\s*"=2\.14\.1"/);
  assert.doesNotMatch(main, /\.plugin\(tauri_plugin_updater::Builder::new\(\)\.build\(\)\)\s*\.run/);
});
