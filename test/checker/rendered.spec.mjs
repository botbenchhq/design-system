import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { build } from "esbuild";
import { expect, test } from "@playwright/test";

import { RULES } from "../../checker/rules/index.mjs";
import { FIXTURE_CLASSES, manifestWithClasses, repoRoot, tempDir } from "../helpers.mjs";

const dist = join(repoRoot, "dist");
const fixtures = join(repoRoot, "test", "fixtures");
const bundle = join(dist, "check-dom.js");
const structuralRules = new Set(RULES.map((rule) => rule.id));

const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript" };

const REACT_PAGE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Draft</title><link rel="stylesheet" href="/groundwork.css"></head>
  <body><div id="root"></div><script src="/react/app.js"></script></body>
</html>`;

// The fixtures name these classes; no shipped stylesheet defines them yet.
const CENTRING = ".text-center, .gw-text-center { text-align: center; }";

const pagesIn = (corpus) => readdirSync(join(fixtures, corpus)).filter((name) => name.endsWith(".html")).sort();

// The structural rule IDs the static checker reports for each page of a corpus.
function staticRules(corpus) {
  const cli = join(repoRoot, "checker", "check.mjs");
  const args = [cli, "--json", "--manifest", manifestWithClasses(FIXTURE_CLASSES), "."];
  const { stdout } = spawnSync(process.execPath, args, { cwd: join(fixtures, corpus), encoding: "utf8" });
  const byPage = Object.fromEntries(pagesIn(corpus).map((page) => [page, []]));
  for (const finding of JSON.parse(stdout).findings) {
    if (structuralRules.has(finding.rule)) byPage[finding.file].push(finding.rule);
  }
  for (const rules of Object.values(byPage)) rules.sort();
  return byPage;
}

async function renderedFindings(page, path) {
  await page.goto(`${origin}${path}`);
  await page.addStyleTag({ content: CENTRING });
  await page.addScriptTag({ path: bundle });
  return page.evaluate(() => gwCheckDom());
}

let server;
let origin;
let built;

test.beforeAll(async () => {
  built = tempDir();
  await build({
    entryPoints: [join(fixtures, "react", "app.jsx")],
    bundle: true,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    outfile: join(built, "app.js"),
    logLevel: "silent",
  });
  const roots = [dist, fixtures];
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    if (path === "/react/") return response.writeHead(200, { "content-type": "text/html" }).end(REACT_PAGE);
    for (const file of path === "/react/app.js" ? [join(built, "app.js")] : roots.map((root) => join(root, path))) {
      try {
        const body = await readFile(file);
        return response.writeHead(200, { "content-type": TYPES[extname(path)] }).end(body);
      } catch {
        // Try the next place.
      }
    }
    response.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(() => {
  server.close();
  rmSync(built, { recursive: true, force: true });
});

for (const corpus of ["slop", "clean"]) {
  test(`the rendered check reports the same rules as the static check on every page of ${corpus}/`, async ({ page }) => {
    const expected = staticRules(corpus);
    const rendered = {};
    for (const name of pagesIn(corpus)) {
      const findings = await renderedFindings(page, `/${corpus}/${name}`);
      rendered[name] = findings.map((finding) => finding.rule).sort();
    }
    expect(rendered).toEqual(expected);
  });
}

test("a rendered finding carries its rule, message, fix and a snippet of the element", async ({ page }) => {
  const findings = await renderedFindings(page, "/slop/hidden-delete.html");
  expect(findings).toEqual([
    {
      rule: "hidden-critical-action",
      message: expect.stringContaining("collapsed"),
      fix: expect.any(String),
      snippet: '<button type="button" class="gw-button" data-gw-critical="">Delete workspace</button>',
    },
  ]);
});

test("a critical action stops being hidden once its disclosure is opened on the live page", async ({ page }) => {
  await renderedFindings(page, "/slop/hidden-delete.html");
  await page.locator("summary").click();
  expect(await page.evaluate(() => gwCheckDom())).toEqual([]);
});

test("centred long text narrower than the reading column passes on the rendered page", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  expect(await renderedFindings(page, "/slop/centred-copy.html")).toEqual([]);
});

test("two primary buttons composed by a React wrapper component and a mapped list fail in the rendered pass", async ({ page }) => {
  await page.goto(`${origin}/react/`);
  await page.locator(".gw-button--primary").first().waitFor();
  await page.addScriptTag({ path: bundle });
  const findings = await page.evaluate(() => gwCheckDom());
  expect(findings.map((finding) => finding.rule)).toEqual(["one-primary-action", "one-primary-action"]);
  expect(findings.map((finding) => finding.snippet)).toEqual([
    '<button type="button" class="gw-button gw-button--primary">Save</button>',
    '<button type="button" class="gw-button gw-button--primary">Publish</button>',
  ]);
});
