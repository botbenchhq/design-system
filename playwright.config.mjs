import { defineConfig } from "@playwright/test";

// The tests that also run in WebKit and Firefox: five spec files whole, and the gallery tests tagged @engines, at 390px
// and 1280px. A test's grep title starts with its file path, so the second pattern takes the five files whole.
const ENGINE_FILES = ["composer-context", "option-picker", "menu", "themes", "reflow"];
const engines = {
  testMatch: ["visual/gallery.spec.mjs", ...ENGINE_FILES.map((name) => `visual/${name}.spec.mjs`)],
  grep: [/@engines/, new RegExp(`visual/(${ENGINE_FILES.join("|")})\\.spec\\.mjs`)],
};

export default defineConfig({
  testDir: "test",
  testMatch: ["visual/*.spec.mjs", "checker/*.spec.mjs"],
  outputDir: "node_modules/.cache/playwright",
  reporter: "list",
  // A baseline is named by its test, with no browser or platform in the name: the committed file in test/visual/screenshots/.
  snapshotPathTemplate: "{testDir}/visual/screenshots/{arg}{ext}",
  expect: {
    toHaveScreenshot: { maxDiffPixels: 20, animations: "disabled", caret: "hide" },
  },
  projects: [
    // The default: the Chrome installed on the machine, so no browser download is needed. Only this project takes screenshots.
    { name: "chrome", use: { channel: "chrome", headless: true } },
    // Playwright's own engines, installed once with `npx playwright install webkit firefox`.
    { name: "webkit", use: { browserName: "webkit", headless: true }, ...engines },
    { name: "firefox", use: { browserName: "firefox", headless: true }, ...engines },
  ],
});
