import { defineConfig } from "@playwright/test";

// Uses the Chrome already installed on the machine, so no browser download is needed.
export default defineConfig({
  testDir: "test/visual",
  outputDir: "node_modules/.cache/playwright",
  reporter: "list",
  use: { channel: "chrome", headless: true },
});
