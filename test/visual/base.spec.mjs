import { readFileSync } from "node:fs";
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
    <link rel="stylesheet" href="/design-system.css">
  </head>
  <body>
    <main class="ds-container">
      <div class="ds-stack" id="stack">
        <h1>Heading</h1>
        <p>Body text with <code>code</code> in it.</p>
        <div class="ds-cluster ds-gap-xl" id="cluster">
          <button type="button" id="first">First</button>
          <button type="button">Second</button>
        </div>
        <svg id="icon" width="24" height="24" aria-hidden="true"><use href="/icons.svg#ds-icon-check"></use></svg>
      </div>
    </main>
  </body>
</html>`;

// A path with no place to break, as a server puts one in a message.
const LONG_WORD = `/Users/${"a".repeat(90 - "/Users/".length)}`;

// Where a message from outside the app lands: [component, example, the elements that take the text].
const LONG_TEXT_PLACES = [
  ["field", "invalid", ".ds-field__description, .ds-field__error"],
  ["alert", "with-action", ".ds-alert__title, .ds-alert__body"],
  ["page-header", "default", ".ds-page-header__description"],
  ["empty-state", "default", ".ds-empty-state__title"],
  ["diff", "truncated", ".ds-diff__note"],
  ["banner", "info", ".ds-banner__text"],
  ["toast", "tones", ".ds-toast__message"],
  ["list", "navigating", ".ds-list__primary, .ds-list__secondary"],
  ["key-value", "default", ".ds-key-value__value"],
];

// A bare page holding one example of each of those components, as an app would compose them.
function longTextPage() {
  const { components } = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
  const sections = LONG_TEXT_PLACES.map(([name, id]) => {
    const example = components.find((component) => component.name === name).examples.find((candidate) => candidate.id === id);
    if (!example) throw new Error(`${name} has no example named ${id}`);
    return `<section data-place="${name}">${example.markup}</section>`;
  });
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Long words</title>
    <link rel="stylesheet" href="/design-system.css">
  </head>
  <body>
    <main class="ds-container ds-stack">
      <h1 id="plain-h1">Long words</h1>
      <h2 id="plain-h2">A section</h2>
      <h3 id="plain-h3">A part of it</h3>
      <p id="plain"></p>
      ${sections.join("\n")}
    </main>
  </body>
</html>`;
}

let server;
let origin;

// Fonts are served over HTTP because a browser may refuse to load them from file:// URLs.
test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end(PAGE);
    if (path === "/long-words") return response.writeHead(200, { "content-type": "text/html" }).end(longTextPage());
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
  expect(await computed(page, "h1", "font-size")).toBe("26px");
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
  expect(await computed(page, ".ds-container", "padding-left")).toBe("16px");
  expect(await computed(page, ".ds-container", "max-width")).toBe("720px");
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
        @layer ds.components { #first { transition: opacity 240ms; } }
        h1 { transition: color 240ms !important; }
      `,
    });
    expect(await computed(page, "#first", "transition-duration")).toBe("0s");
    expect(await computed(page, "h1", "transition-duration")).toBe("0s");
  });
});

test("without reduced motion a transition keeps its duration", async ({ page }) => {
  await page.goto(origin);
  await page.addStyleTag({ content: "@layer ds.components { #first { transition: opacity 240ms; } }" });
  expect(await computed(page, "#first", "transition-duration")).toBe("0.24s");
});

test("a 90-character unbroken path breaks inside its element at 390px, and the page does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${origin}/long-words`);
  await page.evaluate(() => document.fonts.ready);
  expect(LONG_WORD).toHaveLength(90);
  expect(await computed(page, "body", "overflow-wrap")).toBe("break-word");

  const targets = ["#plain", ...LONG_TEXT_PLACES.map(([name, , selector]) => selector.split(", ").map((part) => `[data-place="${name}"] ${part}`).join(", "))];
  const found = await page.evaluate(
    ({ selectors, word }) => {
      const filled = selectors.map((selector) => {
        const elements = [...document.querySelectorAll(selector)];
        for (const element of elements) element.textContent = `Could not read ${word}`;
        return elements.length;
      });
      const root = document.documentElement;
      const past = selectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)]
          .filter((element) => element.getBoundingClientRect().right > root.clientWidth + 0.5 || element.scrollWidth > element.clientWidth + 1)
          .map((element) => `${selector}: right edge ${Math.round(element.getBoundingClientRect().right)}, content ${element.scrollWidth} in ${element.clientWidth}`),
      );
      return { filled, past, scroll: root.scrollWidth - root.clientWidth };
    },
    { selectors: targets, word: LONG_WORD },
  );
  expect(found.filled.every((amount) => amount > 0), JSON.stringify(found.filled)).toBe(true);
  expect(found.past).toEqual([]);
  expect(found.scroll).toBe(0);
});

for (const width of [390, 1280]) {
  test(`at ${width}px h1, h2 and h3 step down in size, and the page header's title is never as small as an h2`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/long-words`);
    const size = async (selector) => parseFloat(await computed(page, selector, "font-size"));
    const [h1, h2, h3, body] = [await size("#plain-h1"), await size("#plain-h2"), await size("#plain-h3"), await size("body")];
    expect([h1, h2, h3]).toEqual([26, 20, 16]);
    expect(h3).toBeGreaterThan(body);
    expect(await size(".ds-page-header__title")).toBeGreaterThan(h2);
    expect(await size(".ds-page-header__title")).toBe(h1);
  });
}
