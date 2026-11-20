import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://127.0.0.1:4190", channel: process.env.PLAYWRIGHT_CHANNEL, locale: "en-US" },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4190 --strictPort",
    url: "http://127.0.0.1:4190",
  },
});
