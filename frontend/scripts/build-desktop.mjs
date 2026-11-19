import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve("@tauri-apps/cli/package.json")), "tauri.js");
const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const userHome = homedir();
const cargoHome = resolve(process.env.CARGO_HOME || join(userHome, ".cargo"));
const separator = "\x1f";
const flags = process.env.CARGO_ENCODED_RUSTFLAGS === undefined
  ? (process.env.RUSTFLAGS ?? "").split(/\s+/).filter(Boolean)
  : process.env.CARGO_ENCODED_RUSTFLAGS.split(separator).filter(Boolean);

// Rust embeds source paths in panic messages, including paths from dependencies.
flags.push(
  `--remap-path-prefix=${userHome}=/build-home`,
  `--remap-path-prefix=${workspace}=/workspace`,
  `--remap-path-prefix=${cargoHome}=/cargo`,
);
const result = spawnSync(process.execPath, [cli, "build", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, CARGO_ENCODED_RUSTFLAGS: flags.join(separator) },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
