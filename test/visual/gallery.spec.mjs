import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const dist = fileURLToPath(new URL("../../dist", import.meta.url));
const screenshots = fileURLToPath(new URL("screenshots", import.meta.url));
const components = JSON.parse(readFileSync(join(dist, "components.json"), "utf8")).components.map((component) => component.name);

const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript" };
const WIDTHS = [390, 1280];
const THEMES = ["light", "dark"];
const DO = "[data-example]:not([data-dont])";
// A link with no class is a link inside running text, which the target size rule exempts.
const INTERACTIVE = 'button, a[class], input, select, textarea, summary, [role="button"], [tabindex]';
const TOUCH = 44;

// A state the page cannot hold by itself is forced on the controls of its example, so the screenshot shows it.
const FORCED = { hover: ["hover"], active: ["hover", "active"], "focus-visible": ["focus-visible"], focus: ["focus", "focus-visible"] };

let server;
let origin;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
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

async function open(page, name, { width = 1280, theme = "light" } = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${origin}/gallery/${name}.html?theme=${theme}`);
  await page.evaluate(() => document.fonts.ready);
}

async function forceStates(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  const { root } = await session.send("DOM.getDocument");
  for (const [state, forcedPseudoClasses] of Object.entries(FORCED)) {
    const selector = `[data-example][data-state="${state}"] :is(${INTERACTIVE})`;
    const { nodeIds } = await session.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    for (const nodeId of nodeIds) await session.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses });
  }
}

for (const name of ["index", ...components]) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`${name} at ${width}px in ${theme}: the page is recorded as a screenshot for review`, async ({ page }) => {
        await open(page, name, { width, theme });
        expect(await page.locator("html").getAttribute("data-theme")).toBe(theme === "dark" ? "dark" : null);
        await forceStates(page);
        await page.screenshot({ path: join(screenshots, `${name}-${width}-${theme}.png`), fullPage: true, animations: "disabled" });
      });
    }
  }
}

for (const name of components) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`${name} at ${width}px in ${theme}: axe finds no violation in the do examples`, async ({ page }) => {
        await open(page, name, { width, theme });
        const { violations } = await new AxeBuilder({ page }).include(DO).analyze();
        expect(violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target.join(" ")) }))).toEqual([]);
      });

      test(`${name} at ${width}px in ${theme}: each do example passes the structural rules`, async ({ page }) => {
        await open(page, name, { width, theme });
        await page.addScriptTag({ path: join(dist, "check-dom.js") });
        const findings = await page.evaluate(
          (selector) =>
            [...document.querySelectorAll(selector)].flatMap((example) =>
              gwCheckDom(example).map((finding) => ({ example: example.dataset.example, ...finding })),
            ),
          DO,
        );
        expect(findings).toEqual([]);
      });
    }
  }

  // The target is what the pointer hits, which a padded hit area makes larger than the control is drawn.
  // So the four edges of a 44px square centred on each control are probed for the control itself.
  test(`${name} at 390px: every control in a do example has a pointer target of at least 44px each way`, async ({ page }) => {
    await open(page, name, { width: 390 });
    const small = await page.evaluate(
      ({ examples, interactive, reach }) => {
        const failures = [];
        const controls = [...document.querySelectorAll(examples)].flatMap((example) => [...example.querySelectorAll(interactive)]);
        for (const control of controls) {
          control.scrollIntoView({ block: "center" });
          const box = control.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const hit = [[x - reach, y], [x + reach, y], [x, y - reach], [x, y + reach]].every(([left, top]) =>
            control.contains(document.elementFromPoint(left, top)),
          );
          if (!hit) failures.push(control.outerHTML.slice(0, 120));
        }
        return { checked: controls.length, failures };
      },
      { examples: DO, interactive: INTERACTIVE, reach: TOUCH / 2 - 1 },
    );
    expect(small.checked).toBeGreaterThan(0);
    expect(small.failures).toEqual([]);
  });
}

test("the small button is drawn 32px tall and still takes a press 20px above its centre", async ({ page }) => {
  await open(page, "button", { width: 390 });
  const button = page.locator('[data-example="sizes"] .gw-button--small').first();
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  expect(box.height).toBe(32);
  await button.evaluate((element) => element.addEventListener("click", () => element.setAttribute("data-pressed", "")));
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 - 20);
  await expect(button).toHaveAttribute("data-pressed", "");
});

test("a button is reached with Tab and activated with Enter and with Space", async ({ page }) => {
  await open(page, "button");
  const button = page.locator('[data-example="variants"] .gw-button--primary');
  await button.evaluate((element) =>
    element.addEventListener("click", () => element.setAttribute("data-presses", String(Number(element.dataset.presses ?? 0) + 1))),
  );
  for (let presses = 0; presses < 50 && !(await button.evaluate((element) => element === document.activeElement)); presses++) {
    await page.keyboard.press("Tab");
  }
  await expect(button).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("data-presses", "1");
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("data-presses", "2");
});

test("a disabled button is skipped by Tab", async ({ page }) => {
  await open(page, "button");
  const stops = await page.locator("a, button").count();
  const visited = new Set();
  for (let presses = 0; presses < stops; presses++) {
    await page.keyboard.press("Tab");
    visited.add(await page.evaluate(() => document.activeElement.closest("[data-example]")?.dataset.example));
  }
  expect(await page.locator('[data-example="disabled"] button:disabled').count()).toBeGreaterThan(0);
  expect(visited).toContain("active");
  expect(visited).toContain("busy");
  expect(visited).not.toContain("disabled");
});

test("a field's error is linked by aria-describedby, announced as its description, and marked by an icon as well as colour", async ({ page }) => {
  const loaded = [];
  page.on("response", (response) => loaded.push(`${response.status()} ${new URL(response.url()).pathname}`));
  await open(page, "field");
  const input = page.locator('[data-example="invalid"] input');
  const error = page.locator('[data-example="invalid"] .gw-field__error');
  await expect(input).toHaveAttribute("aria-invalid", "true");
  expect((await input.getAttribute("aria-describedby")).split(" ")).toContain(await error.getAttribute("id"));
  await expect(input).toHaveAccessibleDescription(/Put a slash between the owner and the name\.$/);
  expect(await error.evaluate((element) => getComputedStyle(element, "::before").maskImage)).toContain("icons/circle-alert.svg");
  expect(loaded).toContain("200 /icons/circle-alert.svg");
});

test("a required field says so in its label text", async ({ page }) => {
  await open(page, "field");
  const input = page.locator('[data-example="default"] input');
  await expect(input).toHaveAttribute("required", "");
  await expect(input).toHaveAccessibleName("Repository required");
});
