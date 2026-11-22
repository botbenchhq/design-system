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
        // A control that is not rendered has no target: a sidebar hidden at this width, a hidden tab panel.
        const controls = [...document.querySelectorAll(examples)]
          .flatMap((example) => [...example.querySelectorAll(interactive)])
          .filter((control) => control.checkVisibility());
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

// The selected tab, the tab stop and the shown panel of the default tabs example, read from the attributes the stylesheet styles.
const tabsState = (page) =>
  page.locator('[data-example="default"] gw-tabs').evaluate((element) => {
    const tabs = [...element.querySelectorAll('[role="tab"]')];
    const panels = [...element.querySelectorAll('[role="tabpanel"]')];
    return {
      selected: tabs.filter((tab) => tab.getAttribute("aria-selected") === "true").map((tab) => tab.textContent),
      stops: tabs.filter((tab) => tab.getAttribute("tabindex") === "0").map((tab) => tab.textContent),
      unselected: tabs.filter((tab) => tab.getAttribute("aria-selected") === "false" && tab.getAttribute("tabindex") === "-1").length,
      shown: panels.filter((panel) => !panel.hidden).map((panel) => panel.id),
      focused: document.activeElement.textContent,
    };
  });

const tabSelected = (name, panel) => ({ selected: [name], stops: [name], unselected: 2, shown: [panel], focused: name });

test("gw-tabs moves selection and focus with the arrow keys, Home and End, and shows only the selected panel", async ({ page }) => {
  await open(page, "tabs");
  const tabs = page.locator('[data-example="default"] [role="tab"]');
  await expect(tabs).toHaveText(["Summary", "Diff", "Log"]);
  await tabs.first().focus();
  expect(await tabsState(page)).toEqual(tabSelected("Summary", "tabs-default-panel-summary"));

  const steps = [
    ["ArrowRight", "Diff", "tabs-default-panel-diff"],
    ["ArrowRight", "Log", "tabs-default-panel-log"],
    ["ArrowRight", "Summary", "tabs-default-panel-summary"],
    ["ArrowLeft", "Log", "tabs-default-panel-log"],
    ["ArrowLeft", "Diff", "tabs-default-panel-diff"],
    ["End", "Log", "tabs-default-panel-log"],
    ["Home", "Summary", "tabs-default-panel-summary"],
  ];
  for (const [key, name, panel] of steps) {
    await page.keyboard.press(key);
    expect(await tabsState(page), key).toEqual(tabSelected(name, panel));
  }
  await expect(page.locator("#tabs-default-panel-summary")).toBeVisible();
  await expect(page.locator("#tabs-default-panel-diff")).toBeHidden();
  await expect(page.locator("#tabs-default-panel-log")).toBeHidden();
});

test("gw-tabs selects a tab on a click, and Tab then moves from the selected tab to its panel", async ({ page }) => {
  await open(page, "tabs");
  await page.locator('[data-example="default"] [role="tab"]', { hasText: "Diff" }).click();
  expect(await tabsState(page)).toEqual(tabSelected("Diff", "tabs-default-panel-diff"));
  await page.keyboard.press("Tab");
  await expect(page.locator("#tabs-default-panel-diff")).toBeFocused();
});

test("loading the behaviours module a second time is harmless", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "tabs");
  expect(await page.evaluate(() => customElements.get("gw-tabs").name)).toBe("GwTabs");
  // A query makes it a different module to the browser, so its body runs again.
  await page.addScriptTag({ url: `${origin}/behaviors/groundwork.js?again`, type: "module" });
  await page.evaluate(() => import("/behaviors/groundwork.js?once-more"));
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => customElements.get("gw-tabs").name)).toBe("GwTabs");

  const tabs = page.locator('[data-example="default"] [role="tab"]');
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  expect(await tabsState(page)).toEqual(tabSelected("Diff", "tabs-default-panel-diff"));
});
