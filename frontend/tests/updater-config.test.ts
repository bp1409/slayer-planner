import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the updater is fully disabled until signed update support is implemented", async () => {
  const main = await readFile(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");
  const cargo = await readFile(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8");
  const config = await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8");
  const capability = await readFile(new URL("../src-tauri/capabilities/default.json", import.meta.url), "utf8");
  assert.doesNotMatch(main, /tauri_plugin_updater|TAURI_UPDATER_PUBLIC_KEY/);
  assert.doesNotMatch(cargo, /tauri-plugin-updater/);
  assert.doesNotMatch(config, /"updater"|latest\.json|REPLACE_WITH_TAURI_UPDATER_PUBLIC_KEY/);
  assert.doesNotMatch(capability, /updater/);
});
// @ts-nocheck
