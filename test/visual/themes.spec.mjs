import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { verifyVendored } from "../../checker/vendor.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const dist = join(repoRoot, "dist");
const summary = JSON.parse(readFileSync(join(dist, "themes", "botbench.json"), "utf8"));
const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript" };

// Serves dist/ at /dist/ and a synced copy of it at /vendor/, once the sync test has made one.
let server;
let origin;
let vendored = null;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    const [, area, ...rest] = path.split("/");
    const root = area === "dist" ? dist : area === "vendor" ? vendored : null;
    try {
      const body = await readFile(join(root, ...rest));
      response.writeHead(200, { "content-type": TYPES[extname(path)] }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(() => server.close());

// A bare page that links the system and, when asked, the theme, in the order given.
async function openPage(page, { mode = null, stylesheets = ["design-system.css", "themes/botbench.css"], from = "dist", colorScheme = "light", extra = "" } = {}) {
  await page.emulateMedia({ colorScheme });
  const links = stylesheets.map((name) => `<link rel="stylesheet" href="/${from}/${name}">`).join("\n");
  const html = `<!doctype html>
<html lang="en"${mode ? ` data-theme="${mode}"` : ""}>
<head><meta charset="utf-8"><title>Theme</title>
${links}${extra}</head>
<body><p>Fix the login timeout</p><button type="button" class="ds-button ds-button--primary">Start task</button></body>
</html>`;
  await page.route(`${origin}/page.html`, (route) => route.fulfill({ contentType: "text/html", body: html }));
  await page.goto(`${origin}/page.html`);
}

const hex = (rgb) => `#${rgb.match(/\d+/g).slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("").toUpperCase()}`;

const read = (page) =>
  page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const button = getComputedStyle(document.querySelector("button"));
    return {
      surface: root.getPropertyValue("--ds-color-surface").trim(),
      shadow: root.getPropertyValue("--ds-shadow-overlay").trim(),
      body: getComputedStyle(document.body).backgroundColor,
      button: button.backgroundColor,
      buttonText: button.color,
      radius: button.borderTopLeftRadius,
      scheme: root.colorScheme,
    };
  });

test("loaded after design-system.css, the theme's values win over the default tokens", async ({ page }) => {
  await openPage(page, { mode: "light", stylesheets: ["design-system.css"] });
  const before = await read(page);
  expect(hex(before.body)).toBe("#FAFAF9");
  expect(before.radius).toBe("8px");

  await openPage(page, { mode: "light" });
  const after = await read(page);
  expect(after.surface).toBe("#FAF8F4");
  expect(hex(after.body)).toBe("#FAF8F4");
  expect(hex(after.button)).toBe("#AD5D02");
  expect(hex(after.buttonText)).toBe("#FFFFFF");
  expect(after.radius).toBe("6px");
});

test("the theme's layer comes after ds.tokens whatever order the files load in, and unlayered app CSS still wins over both", async ({ page }) => {
  await openPage(page, { mode: "dark", stylesheets: ["themes/botbench.css", "design-system.css"] });
  expect(hex((await read(page)).body)).toBe("#121417");
  expect(hex((await read(page)).button)).toBe("#F59E0B");
  // A test page may carry a style element. An app sets no token itself; this only shows where unlayered CSS falls.
  await openPage(page, { mode: "dark", extra: "\n<style>:root { --ds-color-surface: #000000; }</style>" });
  expect(hex((await read(page)).body)).toBe("#000000");
});

// The colour scheme native controls and scrollbars are drawn in follows the mode on screen.
const cases = [
  { mode: null, colorScheme: "light", expected: "#121417", scheme: "dark", reason: "the theme's default mode is dark" },
  { mode: null, colorScheme: "dark", expected: "#121417", scheme: "dark", reason: "the default mode does not follow the system" },
  { mode: "light", colorScheme: "dark", expected: "#FAF8F4", scheme: "light", reason: "light is set outright" },
  { mode: "dark", colorScheme: "light", expected: "#121417", scheme: "dark", reason: "dark is set outright" },
  { mode: "auto", colorScheme: "light", expected: "#FAF8F4", scheme: "light dark", reason: "auto follows a light system" },
  { mode: "auto", colorScheme: "dark", expected: "#121417", scheme: "light dark", reason: "auto follows a dark system" },
];

for (const { mode, colorScheme, expected, scheme, reason } of cases) {
  test(`with data-theme ${mode ?? "unset"} and a ${colorScheme} system, the botbench page background is ${expected} and the colour scheme ${scheme}: ${reason}`, async ({ page }) => {
    await openPage(page, { mode, colorScheme });
    const { body, scheme: drawn } = await read(page);
    expect(hex(body)).toBe(expected);
    expect(drawn).toBe(scheme);
    expect(summary.themeColor[expected === "#121417" ? "dark" : "light"]).toBe(expected);
  });
}

test("with the botbench theme and no data-theme, the root and a date field are drawn in the dark colour scheme", async ({ page }) => {
  await openPage(page);
  await page.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<input class="ds-field__control" type="date" aria-label="Due date" value="2026-11-22">'));
  const schemes = await page.evaluate(() => [document.documentElement, document.querySelector("input")].map((element) => getComputedStyle(element).colorScheme));
  expect(schemes).toEqual(["dark", "dark"]);
});

test("with no data-theme the dark default mode matches data-theme dark in every token, including those the theme does not set", async ({ page }) => {
  const all = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries([...style].filter((name) => name.startsWith("--ds-")).map((name) => [name, style.getPropertyValue(name).trim()]));
    });
  await openPage(page, { mode: "dark" });
  const dark = await all();
  await openPage(page);
  expect(await all()).toEqual(dark);
  expect(dark["--ds-shadow-overlay"]).toBe("0 8px 24px 0 rgb(0 0 0 / 0.5)");
});

test("without a theme, a page with no data-theme is light and drawn in the light colour scheme, as before", async ({ page }) => {
  await openPage(page, { stylesheets: ["design-system.css"], colorScheme: "dark" });
  expect(hex((await read(page)).body)).toBe("#FAFAF9");
  expect((await read(page)).scheme).toBe("light");
});

test("after a sync the hash manifest covers every theme file, the copy verifies, and the vendored theme loads", async ({ page }) => {
  vendored = join(mkdtempSync(join(tmpdir(), "design-system-")), "vendor", "design-system");
  const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "sync.mjs"), "--to", vendored], { encoding: "utf8" });
  expect(result.status).toBe(0);
  const { files } = JSON.parse(readFileSync(join(vendored, "hashes.json"), "utf8"));
  const themeFiles = ["themes/botbench.css", "themes/botbench.design-tokens.md", "themes/botbench.json", "themes/botbench.tokens.json"];
  for (const name of themeFiles) {
    expect(files[name]).toBe(createHash("sha256").update(readFileSync(join(dist, name))).digest("hex"));
  }
  expect(verifyVendored(vendored)).toEqual([]);

  await openPage(page, { from: "vendor" });
  expect(hex((await read(page)).body)).toBe("#121417");

  writeFileSync(join(vendored, "themes/botbench.css"), readFileSync(join(vendored, "themes/botbench.css"), "utf8").replace("#121417", "#000000"));
  expect(verifyVendored(vendored).map((finding) => finding.file)).toEqual([join(vendored, "themes/botbench.css")]);
});
