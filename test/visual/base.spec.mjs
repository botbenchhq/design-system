import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const dist = fileURLToPath(new URL("../../dist", import.meta.url));

const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".html": "text/html" };

// A bare page: the bundled stylesheet and nothing else.
const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Base</title>
    <link rel="stylesheet" href="/groundwork.css">
  </head>
  <body>
    <main class="gw-container">
      <div class="gw-stack" id="stack">
        <h1>Heading</h1>
        <p>Body text with <code>code</code> in it.</p>
        <div class="gw-cluster gw-gap-xl" id="cluster">
          <button type="button" id="first">First</button>
          <button type="button">Second</button>
        </div>
        <svg id="icon" width="24" height="24" aria-hidden="true"><use href="/icons.svg#gw-icon-check"></use></svg>
      </div>
    </main>
  </body>
</html>`;

let server;
let origin;

// Fonts are served over HTTP because a browser may refuse to load them from file:// URLs.
test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end(PAGE);
    try {
      const body = await readFile(join(dist, path));
      response.writeHead(200, { "content-type": TYPES[extname(path)] }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(() => server.close());

const computed = (page, selector, property) =>
  page.locator(selector).evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

test("a bare page renders IBM Plex Sans and IBM Plex Mono from the shipped files", async ({ page }) => {
  const fonts = [];
  page.on("response", (response) => {
    if (response.url().endsWith(".woff2")) fonts.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);

  expect(await computed(page, "body", "font-family")).toMatch(/^"IBM Plex Sans"/);
  expect(await computed(page, "code", "font-family")).toMatch(/^"IBM Plex Mono"/);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replaceAll('"', "")),
  );
  expect(loaded).toContain("IBM Plex Sans");
  expect(loaded).toContain("IBM Plex Mono");
  expect(await page.evaluate(() => document.fonts.check('14px "IBM Plex Sans"'))).toBe(true);
  expect(fonts).toContain("200 /fonts/ibm-plex-sans-latin-wght-normal.woff2");
  expect(fonts).toContain("200 /fonts/ibm-plex-mono-latin-400-normal.woff2");

  expect(await computed(page, "body", "font-size")).toBe("14px");
  expect(await computed(page, "body", "color")).toBe("rgb(23, 23, 23)");
  expect(await computed(page, "body", "background-color")).toBe("rgb(250, 250, 249)");
  expect(await computed(page, "h1", "font-size")).toBe("24px");
  expect(await computed(page, "h1", "font-weight")).toBe("600");
});

test("a button focused from the keyboard shows the ring from the focus token", async ({ page }) => {
  await page.goto(origin);
  expect(await computed(page, "#first", "outline-style")).toBe("none");
  await page.keyboard.press("Tab");
  await expect(page.locator("#first")).toBeFocused();
  expect(await computed(page, "#first", "outline-style")).toBe("solid");
  expect(await computed(page, "#first", "outline-width")).toBe("2px");
  expect(await computed(page, "#first", "outline-offset")).toBe("2px");
  expect(await computed(page, "#first", "outline-color")).toBe("rgb(31, 92, 153)");
});

test("layout spacing comes from the spacing tokens", async ({ page }) => {
  await page.goto(origin);
  expect(await computed(page, "body", "margin-top")).toBe("0px");
  expect(await computed(page, "#stack", "row-gap")).toBe("12px");
  expect(await computed(page, "#cluster", "column-gap")).toBe("24px");
  expect(await computed(page, ".gw-container", "padding-left")).toBe("16px");
  expect(await computed(page, ".gw-container", "max-width")).toBe("720px");
  // The reset's border defaults: adding a width alone draws a solid line in the border colour.
  expect(await computed(page, "#first", "border-top-width")).toBe("0px");
  expect(await computed(page, "#first", "border-top-style")).toBe("solid");
  expect(await computed(page, "#first", "box-sizing")).toBe("border-box");
  const heading = await page.locator("h1").boundingBox();
  const paragraph = await page.locator("p").boundingBox();
  expect(paragraph.y - (heading.y + heading.height)).toBeCloseTo(12, 1);
});

test("the sprite draws an icon on the page", async ({ page }) => {
  const response = page.waitForResponse((candidate) => candidate.url().endsWith("/icons.svg"));
  await page.goto(origin);
  expect((await response).status()).toBe(200);
  const box = await page.locator("#icon").evaluate((svg) => {
    const { width, height } = svg.getBBox();
    return { width, height };
  });
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
});

test.describe("with reduced motion requested", () => {
  test.use({ reducedMotion: "reduce" });

  test("a transition declared in a later layer or in app CSS runs for zero seconds", async ({ page }) => {
    await page.goto(origin);
    await page.addStyleTag({
      content: `
        @layer gw.components { #first { transition: opacity 240ms; } }
        h1 { transition: color 240ms !important; }
      `,
    });
    expect(await computed(page, "#first", "transition-duration")).toBe("0s");
    expect(await computed(page, "h1", "transition-duration")).toBe("0s");
  });
});

test("without reduced motion a transition keeps its duration", async ({ page }) => {
  await page.goto(origin);
  await page.addStyleTag({ content: "@layer gw.components { #first { transition: opacity 240ms; } }" });
  expect(await computed(page, "#first", "transition-duration")).toBe("0.24s");
});
