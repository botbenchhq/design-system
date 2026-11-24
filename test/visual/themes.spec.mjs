import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { verifyVendored } from "../../checker/vendor.mjs";
import { tempDir } from "../helpers.mjs";

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
async function openPage(page, { mode = null, stylesheets = ["design-system.css", "themes/botbench.css"], from = "dist", colorScheme = "light", extra = "", body = "" } = {}) {
  await page.emulateMedia({ colorScheme });
  const links = stylesheets.map((name) => `<link rel="stylesheet" href="/${from}/${name}">`).join("\n");
  const html = `<!doctype html>
<html lang="en"${mode ? ` data-theme="${mode}"` : ""}>
<head><meta charset="utf-8"><title>Theme</title>
${links}${extra}</head>
<body><p>Fix the login timeout</p><button type="button" class="ds-button ds-button--primary">Start task</button>${body}</body>
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
  expect(before.radius).toBe("6px");

  await openPage(page, { mode: "light" });
  const after = await read(page);
  expect(after.surface).toBe("#F2F2F7");
  expect(hex(after.body)).toBe("#F2F2F7");
  expect(hex(after.button)).toBe("#1C1C1E");
  expect(hex(after.buttonText)).toBe("#FFFFFF");
  // The radius scale is the system's under every theme: a button is a control, 6px.
  expect(after.radius).toBe("6px");
});

// One element for each type role, and the places a density reaches.
const TYPE_BODY = `
<h1 id="display">Session refresh</h1>
<h2 id="heading">Checks</h2>
<h3 id="title">Danger area</h3>
<p id="body">Run <code id="code">npm test</code> before the review.</p>
<pre id="block"><code id="block-code">npm test</code></pre>
<p class="ds-field__description" id="helper">Put a slash between the owner and the name.</p>
<small id="caption">2 minutes ago</small>
<ul class="ds-list"><li class="ds-list__row"><span class="ds-list__content" id="row">fix/session-refresh</span></li></ul>
<table class="ds-data-table"><thead><tr><th id="micro">Duration</th></tr></thead><tbody><tr><td id="cell">42 s</td></tr></tbody></table>
<div data-ds-density="compact"><p id="compact">Compact text</p><button type="button" class="ds-button" id="compact-button">Retry</button></div>`;

// Each role's size and line in px at a 16px root, and its tracking in em, as the owner approved them.
const ROLES = {
  micro: { size: 11, line: 14, tracking: 0.02, weight: "500" },
  caption: { size: 12, line: 16, tracking: 0 },
  helper: { size: 13, line: 18, tracking: 0 },
  row: { size: 13, line: 18, tracking: 0 },
  cell: { size: 13, line: 18, tracking: 0 },
  body: { size: 14, line: 21, tracking: 0 },
  title: { size: 16, line: 22, tracking: -0.01, weight: "600" },
  heading: { size: 20, line: 26, tracking: -0.015, weight: "600" },
  display: { size: 26, line: 30, tracking: -0.02, weight: "600" },
  block: { size: 13, line: 19.5, tracking: 0 },
};

const measureType = (page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll("[id]")].map((element) => {
        const style = getComputedStyle(element);
        return [element.id, { size: parseFloat(style.fontSize), line: parseFloat(style.lineHeight), tracking: style.letterSpacing === "normal" ? 0 : parseFloat(style.letterSpacing), weight: style.fontWeight, wrap: style.textWrapStyle ?? style.textWrap }];
      }),
    ),
  );

// What a role measures when every size is `larger` px above the table and the root is `scale` times 16px.
function expectRoles(measured, { larger = 0, scale = 1 } = {}) {
  for (const [id, role] of Object.entries(ROLES)) {
    const size = (role.size + larger) * scale;
    expect(measured[id].size, `${id} size`).toBeCloseTo(size, 2);
    expect(Math.abs(measured[id].line - (size * role.line) / role.size), `${id} line height is ${measured[id].line}px`).toBeLessThan(0.1 * scale);
    expect(measured[id].tracking, `${id} tracking`).toBeCloseTo(size * role.tracking, 2);
    if (role.weight) expect(measured[id].weight, `${id} weight`).toBe(role.weight);
  }
}

for (const stylesheets of [["design-system.css"], ["design-system.css", "themes/botbench.css"]]) {
  const theme = stylesheets.length > 1 ? "the botbench theme" : "the default theme";

  test.describe(`type under ${theme}, with a fine pointer`, () => {
    test.use({ hasTouch: false });

    test("each role is the size, line height, weight and tracking of the scale at a 16px root, and inline code is 0.93 of the text around it", async ({ page }) => {
      await openPage(page, { mode: "light", stylesheets, body: TYPE_BODY });
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(false);
      const measured = await measureType(page);
      expectRoles(measured);
      expect(measured.code.size).toBeCloseTo(14 * 0.93, 1);
      // Inside a block of code the code is the block's size, not a share of it.
      expect(measured["block-code"].size).toBe(13);
      for (const id of ["display", "heading", "title"]) expect(measured[id].wrap, id).toBe("balance");
    });

    test("with a 20px root, as a reader who asked for larger text has, every size, line and tracking is 1.25 times larger", async ({ page }) => {
      await openPage(page, { mode: "light", stylesheets, body: TYPE_BODY, extra: "\n<style>html { font-size: 20px; }</style>" });
      const measured = await measureType(page);
      expectRoles(measured, { scale: 1.25 });
      expect(measured.body.size).toBe(17.5);
      expect(measured.display.size).toBe(32.5);
      expect(measured.code.size).toBeCloseTo(17.5 * 0.93, 1);
    });

    test("a compact container sets body text to the dense 13px on an 18px line, and a control inside it is 32px tall", async ({ page }) => {
      await openPage(page, { mode: "light", stylesheets, body: TYPE_BODY });
      const measured = await measureType(page);
      expect(measured.compact.size).toBe(13);
      expect(Math.abs(measured.compact.line - 18)).toBeLessThan(0.1);
      expect(measured["compact-button"].size).toBe(13);
      expect(await page.locator("#compact-button").evaluate((element) => element.getBoundingClientRect().height)).toBe(32);
      // Outside the container nothing changed.
      expect(measured.body.size).toBe(14);
    });
  });

  test.describe(`type under ${theme}, with a coarse pointer`, () => {
    test.use({ hasTouch: true });

    test("every size is one pixel larger, with the line height and tracking in the same proportion, and a compact container is not dense", async ({ page }) => {
      await openPage(page, { mode: "light", stylesheets, body: TYPE_BODY });
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
      const measured = await measureType(page);
      expectRoles(measured, { larger: 1 });
      expect(measured.code.size).toBeCloseTo(15 * 0.93, 1);
      expect(measured.compact.size).toBe(15);
      expect(measured.compact.line).toBe(22.5);
      expect(measured["compact-button"].size).toBe(15);
    });
  });
}

test("the theme's layer comes after ds.tokens whatever order the files load in, and unlayered app CSS still wins over both", async ({ page }) => {
  await openPage(page, { mode: "dark", stylesheets: ["themes/botbench.css", "design-system.css"] });
  expect(hex((await read(page)).body)).toBe("#161618");
  expect(hex((await read(page)).button)).toBe("#F5F5F7");
  // A test page may carry a style element. An app sets no token itself; this only shows where unlayered CSS falls.
  await openPage(page, { mode: "dark", extra: "\n<style>:root { --ds-color-surface: #000000; }</style>" });
  expect(hex((await read(page)).body)).toBe("#000000");
});

// The colour scheme native controls and scrollbars are drawn in follows the mode on screen.
const cases = [
  { mode: null, colorScheme: "light", expected: "#161618", scheme: "dark", reason: "the theme's default mode is dark" },
  { mode: null, colorScheme: "dark", expected: "#161618", scheme: "dark", reason: "the default mode does not follow the system" },
  { mode: "light", colorScheme: "dark", expected: "#F2F2F7", scheme: "light", reason: "light is set outright" },
  { mode: "dark", colorScheme: "light", expected: "#161618", scheme: "dark", reason: "dark is set outright" },
  { mode: "auto", colorScheme: "light", expected: "#F2F2F7", scheme: "light dark", reason: "auto follows a light system" },
  { mode: "auto", colorScheme: "dark", expected: "#161618", scheme: "light dark", reason: "auto follows a dark system" },
];

for (const { mode, colorScheme, expected, scheme, reason } of cases) {
  test(`with data-theme ${mode ?? "unset"} and a ${colorScheme} system, the botbench page background is ${expected} and the colour scheme ${scheme}: ${reason}`, async ({ page }) => {
    await openPage(page, { mode, colorScheme });
    const { body, scheme: drawn } = await read(page);
    expect(hex(body)).toBe(expected);
    expect(drawn).toBe(scheme);
    expect(summary.themeColor[expected === "#161618" ? "dark" : "light"]).toBe(expected);
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
  vendored = join(tempDir(), "vendor", "design-system");
  const result = spawnSync(process.execPath, [join(repoRoot, "scripts", "sync.mjs"), "--to", vendored], { encoding: "utf8" });
  expect(result.status).toBe(0);
  const { files } = JSON.parse(readFileSync(join(vendored, "hashes.json"), "utf8"));
  const themeFiles = ["themes/botbench.css", "themes/botbench.design-tokens.md", "themes/botbench.json", "themes/botbench.tokens.json"];
  for (const name of themeFiles) {
    expect(files[name]).toBe(createHash("sha256").update(readFileSync(join(dist, name))).digest("hex"));
  }
  expect(verifyVendored(vendored)).toEqual([]);

  await openPage(page, { from: "vendor" });
  expect(hex((await read(page)).body)).toBe("#161618");

  writeFileSync(join(vendored, "themes/botbench.css"), readFileSync(join(vendored, "themes/botbench.css"), "utf8").replace("#161618", "#000000"));
  expect(verifyVendored(vendored).map((finding) => finding.file)).toEqual([join(vendored, "themes/botbench.css")]);
});
