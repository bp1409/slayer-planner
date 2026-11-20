import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const template = await readFile(join(root, "public", "sw.js"), "utf8");
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else files.push(path);
  }
  return files;
}

const files = (await filesIn(dist))
  .filter((path) => !path.endsWith(`${sep}sw.js`))
  .map((path) => `./${relative(dist, path).split(sep).join("/")}`)
  .sort();
files.unshift("./");
const buildId = files.join("|").replace(/[^a-zA-Z0-9|._-]/g, "").slice(-32);
const cacheName = `slayer-planner-${packageJson.version}-${buildId}`;
const serviceWorker = template
  .replace('"__CACHE_NAME__"', JSON.stringify(cacheName))
  .replace("__PRECACHE_URLS__", JSON.stringify(files));
await writeFile(join(dist, "sw.js"), serviceWorker);
