import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("blocks locked tiers, allows explicit future estimates, and retains per-Slayer selections", async ({ page }) => {
  const slayer = page.getByLabel("Slayer", { exact: true });
  const tier = page.getByLabel("Quest tier", { exact: true });
  const currentXp = page.getByLabel("Current XP", { exact: true });
  const reward = page.getByLabel("XP per boss", { exact: true });
  const future = page.getByLabel("Allow future tiers", { exact: false });
  const confirmed = page.getByLabel("I can start this quest");
  await page.getByLabel("Target level", { exact: true }).selectOption("8");
  await currentXp.fill("99999");
  await expect(tier.locator('option[value="5"]')).toBeDisabled();
  await future.check();
  await tier.selectOption("5");
  await expect(reward).toHaveValue("1,500");
  await expect(page.getByText("Future estimate", { exact: true })).toBeVisible();
  await future.uncheck();
  await expect(tier).toHaveValue("5");
  await expect(page.getByRole("status")).toContainText("Tier V requires Slayer level 7");
  await expect(page.getByText("Bosses required")).toHaveCount(0);
  await currentXp.fill("100000");
  await expect(page.getByRole("status")).toContainText("Confirm that you can start");
  await confirmed.check();
  await expect(page.locator(".metric").filter({ hasText: "Bosses required" })).toContainText("200");
  await currentXp.fill("99999.99");
  await expect(confirmed).toBeDisabled();
  await expect(page.getByText("Bosses required")).toHaveCount(0);
  await future.check();
  await slayer.focus();
  await slayer.selectOption("vampire");
  await expect(slayer).toBeFocused();
  await expect(page.getByLabel("Target level", { exact: true }).locator("option")).toHaveCount(5);
  await expect(reward).toHaveValue("10");
  await expect(page.getByText("Rift perk behaviour is unverified", { exact: false })).toBeVisible();
  await slayer.selectOption("wolf");
  await expect(tier.locator("option:not([value='0'])")).toHaveCount(4);
  await slayer.selectOption("zombie");
  await expect(currentXp).toHaveValue("99999.99");
  await expect(tier).toHaveValue("5");
  await page.reload();
  await expect(future).toBeChecked();
  await expect(currentXp).toHaveValue("99999.99");
  await expect(tier).toHaveValue("5");
});

test("invalid drafts do not produce results or overwrite the last valid configuration", async ({ page }) => {
  const field = page.getByLabel("Current XP", { exact: true });
  await field.fill("700");
  for (const value of ["", "-4", "1e30", "1.234"]) {
    await field.fill(value);
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("status")).toContainText("Enter XP");
    await expect(page.getByText("Bosses required")).toHaveCount(0);
  }
  await page.reload();
  await expect(field).toHaveValue("700");
  await page.getByLabel("Use observed XP", { exact: false }).check();
  await page.getByLabel("XP per boss", { exact: true }).fill("0");
  await expect(page.getByRole("status")).toContainText("0.01");
  await page.getByLabel("XP per boss", { exact: true }).fill("0,25");
  await expect(page.getByText("Bosses required")).toBeVisible();
  await page.getByRole("button", { name: "Reset plan" }).click();
  await expect(field).toHaveValue("0");
});

test("settings, theme, persisted defaults and Escape work", async ({ page }) => {
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await settings.click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByLabel("Default target level").selectOption("9");
  await dialog.getByLabel("Default quest tier").selectOption("5");
  await dialog.getByLabel("Default time per boss").fill("45");
  await dialog.getByLabel("Time format").selectOption("clock");
  await dialog.getByLabel("Show XP milestones").uncheck();
  await page.keyboard.press("Escape");
  await expect(settings).toBeFocused();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Slayer", { exact: true }).selectOption("vampire");
  await expect(page.getByLabel("Target level", { exact: true })).toHaveValue("5");
  await expect(page.getByLabel("Quest tier")).toHaveValue("5");
  await expect(page.getByLabel("Time per boss", { exact: true })).toHaveValue("45");
  await expect(page.getByRole("heading", { name: "XP milestones" })).toHaveCount(0);
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Help" })).toContainText("cumulative total");
  await page.keyboard.press("Escape");
  await settings.click();
  await dialog.getByRole("button", { name: "Reset preferences" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(dialog.getByLabel("Check for updates")).not.toBeChecked();
});

test("shows the audited game-data date", async ({ page }) => {
  await expect(page.getByText("Game data verified on 19 November 2026", { exact: true })).toBeVisible();
});

test("system theme, independent perks and completed targets update in place", async ({ page }) => {
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("dialog", { name: "Settings" }).getByLabel("Theme").selectOption("system");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const reward = page.getByLabel("XP per boss", { exact: true });
  await page.getByLabel("Quest tier", { exact: true }).selectOption("4");
  await page.getByLabel("I can start this quest").check();
  await page.getByLabel("Slashed Pricing", { exact: false }).check();
  await expect(reward).toHaveValue("500");
  await expect(page.locator(".metric").filter({ hasText: "Quest cost" })).toContainText("250,000");
  await page.getByLabel("Slayer XP Buff", { exact: false }).check();
  await expect(reward).toHaveValue("625");
  await page.getByLabel("Current XP", { exact: true }).fill("5000");
  await expect(page.getByText("Target reached. No more quests required.")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "100");
});

test("workspace and dialogs fit desktop and narrow widths", async ({ page }) => {
  for (const width of [1440, 1024, 800, 680, 320, 280]) {
    await page.setViewportSize({ width, height: 520 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    const cost = page.locator(".metric").filter({ hasText: "Quest cost" }).locator("strong");
    expect(await cost.evaluate((value) => value.offsetHeight < 1.5 * parseFloat(getComputedStyle(value).fontSize))).toBe(true);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const bounds = await dialog.boundingBox();
    expect(bounds?.width).toBeLessThan(width);
    expect(bounds?.height).toBeLessThan(520);
    await page.keyboard.press("Escape");
  }
});

test("loot distinguishes level gates from a published eligibility discrepancy", async ({ page }) => {
  await page.getByLabel("Slayer", { exact: true }).selectOption("vampire");
  await page.getByLabel("Quest tier", { exact: true }).selectOption("2");
  const loot = page.getByRole("region", { name: "Loot reference" });
  await expect(loot.getByText(/release sheet lists level 3/)).toBeVisible();
  const chip = loot.getByRole("row", { name: /Fang-tastic Chocolate Chip/ });
  await expect(chip).toContainText("Locked");
  await page.getByLabel("Current XP", { exact: true }).fill("240");
  await expect(chip).not.toContainText("Locked");
});

test("navigates the workspace and Help by keyboard", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to calculator" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workspace")).toBeFocused();
  const tier = page.getByLabel("Quest tier", { exact: true });
  await tier.focus();
  await page.keyboard.press("ArrowDown");
  await expect(tier).toHaveValue("2");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("I can start this quest")).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByText("Bosses required")).toBeVisible();
  const help = page.getByRole("button", { name: "Help", exact: true });
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Help" })).toBeVisible();
  await page.getByRole("button", { name: "Close help" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator(".dialog-body")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(help).toBeFocused();
});

test("share dialog rejects malformed and malicious plan input", async ({ page }) => {
  await page.getByRole("button", { name: "Share plan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Share plan" });
  const json = dialog.getByLabel("Import plan JSON");
  await json.fill("not json");
  await dialog.getByRole("button", { name: "Import plan", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("malformed");
  await json.fill('{"v":1,"plan":{"slayer":"zombie","currentXp":0,"targetLevel":5,"tier":1,"confirmedAccess":false,"secondsPerBoss":60,"aatroxXp":false,"slashedPricing":false},"__proto__":{"polluted":true}}');
  await dialog.getByRole("button", { name: "Import plan", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("unsupported");
});

test("share dialog copies a summary and exports then imports a plan", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4190" });
  await page.getByRole("button", { name: "Share plan", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Share plan" });
  await dialog.getByRole("button", { name: "Copy summary", exact: true }).click();
  await expect(dialog.getByRole("status")).toHaveText("Summary copied.");
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Export plan", exact: true }).click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  expect(exportedPath).not.toBeNull();
  const json = await readFile(exportedPath!, "utf8");
  await dialog.getByLabel("Import plan JSON").fill(json);
  await dialog.getByRole("button", { name: "Import plan", exact: true }).click();
  await expect(dialog.getByRole("status")).toHaveText("Plan imported.");
  await expect(page.getByLabel("Slayer", { exact: true })).toHaveValue("zombie");
});

test("a second visit works offline after the service worker precache", async ({ page }) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => { await navigator.serviceWorker?.ready; });
  await expect(page.getByRole("heading", { name: "Zombie Slayer" })).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await page.context().setOffline(true);
  const offlineCache = await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find((key) => key.startsWith("slayer-planner-"))!);
    const shell = await cache.match("./index.html");
    const asset = (await cache.keys()).some((request) => request.url.includes("/assets/"));
    return { shell: shell?.ok === true, asset };
  });
  expect(offlineCache).toEqual({ shell: true, asset: true });
  await page.context().setOffline(false);
});

test("local prices update the approximate coins-per-hour table", async ({ page }) => {
  await page.getByRole("button", { name: "Profit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Profit" });
  await expect(dialog).toContainText("Approximate local prices only");
  await dialog.getByLabel("Price for Revenant Flesh").fill("10");
  await expect(dialog.getByRole("status")).toHaveText("Prices saved locally.");
  await page.keyboard.press("Escape");
  const zombieTierOne = page.locator(".profit-table tbody tr").filter({ hasText: "Zombie" }).first();
  await expect(zombieTierOne).toContainText("15");
  await expect(zombieTierOne).toContainText("900");
});
