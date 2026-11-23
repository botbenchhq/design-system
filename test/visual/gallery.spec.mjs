import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const dist = fileURLToPath(new URL("../../dist", import.meta.url));
const screenshots = fileURLToPath(new URL("screenshots", import.meta.url));
// Every folder with a gallery page: the components, then the page patterns.
const index = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
const patterns = index.patterns.map((pattern) => pattern.name);
const components = [...index.components.map((component) => component.name), ...patterns];

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

// The clock of every gallery page stands still, so a time that counts up reads the same in every screenshot.
const NOW = new Date("2026-11-22T12:00:00Z");

async function open(page, name, { width = 1280, theme = "light", brand = null } = {}) {
  await page.clock.setFixedTime(NOW);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${origin}/gallery/${name}.html?theme=${theme}${brand ? `&brand=${brand}` : ""}`);
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
              dsCheckDom(example).map((finding) => ({ example: example.dataset.example, ...finding })),
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

// The pages shown again under the Botbench theme, in both modes at both widths. The rest of the matrix is the default theme's.
const BRAND = "botbench";
const BRANDED = ["agent-run", "app-shell", "approval", "badge", "button", "tool-call", "run-timeline", "data-table", "dialog", "alert", "diff", "review-decision", "log-viewer", "presence"];
const brandSummary = JSON.parse(readFileSync(join(dist, "themes", `${BRAND}.json`), "utf8"));

for (const name of ["index", ...BRANDED]) {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`${name} at ${width}px in ${theme} under the ${BRAND} theme: the page is recorded as a screenshot for review`, async ({ page }) => {
        await open(page, name, { width, theme, brand: BRAND });
        expect(await page.locator("html").getAttribute("data-theme")).toBe(theme);
        const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-color-surface").trim());
        expect(background).toBe(brandSummary.themeColor[theme]);
        await expect(page.locator('[data-gallery="bar"] nav[aria-label="Theme"] a[aria-current="true"]')).toHaveText("Botbench");
        await forceStates(page);
        await page.screenshot({ path: join(screenshots, `${name}-${width}-${theme}-${BRAND}.png`), fullPage: true, animations: "disabled" });
      });

      if (name === "index") continue;

      test(`${name} at ${width}px in ${theme} under the ${BRAND} theme: axe finds no violation in the do examples`, async ({ page }) => {
        await open(page, name, { width, theme, brand: BRAND });
        const { violations } = await new AxeBuilder({ page }).include(DO).analyze();
        expect(violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target.join(" ")) }))).toEqual([]);
      });

      test(`${name} at ${width}px in ${theme} under the ${BRAND} theme: each do example passes the structural rules`, async ({ page }) => {
        await open(page, name, { width, theme, brand: BRAND });
        await page.addScriptTag({ path: join(dist, "check-dom.js") });
        const findings = await page.evaluate(
          (selector) =>
            [...document.querySelectorAll(selector)].flatMap((example) =>
              dsCheckDom(example).map((finding) => ({ example: example.dataset.example, ...finding })),
            ),
          DO,
        );
        expect(findings).toEqual([]);
      });
    }
  }

  if (name === "index") continue;

  test(`${name} at 390px under the ${BRAND} theme: every control in a do example has a pointer target of at least 44px each way`, async ({ page }) => {
    await open(page, name, { width: 390, theme: brandSummary.defaultMode, brand: BRAND });
    const small = await page.evaluate(
      ({ examples, interactive, reach }) => {
        const failures = [];
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

test("the gallery bar carries the mode and the theme along every link, and a theme page with no mode shows the theme's default", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${origin}/gallery/badge.html?brand=${BRAND}`);
  expect(await page.locator("html").getAttribute("data-theme")).toBe(null);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-color-surface").trim())).toBe(brandSummary.themeColor.dark);
  await expect(page.locator('[data-gallery="bar"] nav[aria-label="Mode"] a[aria-current="true"]')).toHaveText("Dark");
  expect(await page.locator('[data-gallery="bar"] nav[aria-label="Mode"] a').evaluateAll((links) => links.map((link) => link.search))).toEqual([
    `?theme=light&brand=${BRAND}`,
    `?theme=dark&brand=${BRAND}`,
  ]);
  expect(await page.locator('[data-gallery="bar"] nav[aria-label="Theme"] a').evaluateAll((links) => links.map((link) => link.search))).toEqual([
    "?theme=dark",
    `?theme=dark&brand=${BRAND}`,
  ]);
  expect(await page.locator('[data-gallery="bar"] > a').evaluate((link) => link.search)).toBe(`?theme=dark&brand=${BRAND}`);
  expect(await page.locator('link[rel="stylesheet"]').evaluateAll((links) => links.map((link) => new URL(link.href).pathname))).toEqual([
    "/design-system.css",
    "/gallery/gallery.css",
    `/themes/${BRAND}.css`,
  ]);
});

test("the small button is drawn 32px tall and still takes a press 20px above its centre", async ({ page }) => {
  await open(page, "button", { width: 390 });
  const button = page.locator('[data-example="sizes"] .ds-button--small').first();
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  expect(box.height).toBe(32);
  await button.evaluate((element) => element.addEventListener("click", () => element.setAttribute("data-pressed", "")));
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2 - 20);
  await expect(button).toHaveAttribute("data-pressed", "");
});

test("a button is reached with Tab and activated with Enter and with Space", async ({ page }) => {
  await open(page, "button");
  const button = page.locator('[data-example="variants"] .ds-button--primary');
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
  const error = page.locator('[data-example="invalid"] .ds-field__error');
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
  page.locator('[data-example="default"] ds-tabs').evaluate((element) => {
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

test("ds-tabs moves selection and focus with the arrow keys, Home and End, and shows only the selected panel", async ({ page }) => {
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

test("ds-tabs selects a tab on a click, and Tab then moves from the selected tab to its panel", async ({ page }) => {
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
  expect(await page.evaluate(() => customElements.get("ds-tabs").name)).toBe("DsTabs");
  // A query makes it a different module to the browser, so its body runs again.
  await page.addScriptTag({ url: `${origin}/behaviors/tabs.js?again`, type: "module" });
  await page.evaluate(() => import("/behaviors/tabs.js?once-more"));
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => customElements.get("ds-tabs").name)).toBe("DsTabs");

  const tabs = page.locator('[data-example="default"] [role="tab"]');
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  expect(await tabsState(page)).toEqual(tabSelected("Diff", "tabs-default-panel-diff"));
});

test("a pattern's gallery page lays its examples out in one column at 1280px, and a component's in two", async ({ page }) => {
  const columns = () =>
    page.locator('[data-gallery="page"] > section').first().locator("> .ds-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
  expect(patterns.length).toBeGreaterThan(0);
  for (const name of patterns) {
    await open(page, name);
    expect(await columns(), name).toBe(1);
  }
  await open(page, "button");
  expect(await columns()).toBe(2);
});

test("the password field's button changes its words with the input's type and carries no aria-pressed", async ({ page }) => {
  await open(page, "password-field");
  const input = page.locator("#password-field-default-input");
  const toggle = page.locator('[data-example="default"] .ds-password-field__toggle');
  await expect(toggle).not.toHaveAttribute("aria-pressed");
  await expect(toggle).toHaveAccessibleName("Show the registry password");
  await expect(toggle.locator(".ds-password-field__hide")).toBeHidden();
  // What an app does on a press: it flips the input's type and nothing else.
  await input.evaluate((element) => (element.type = "text"));
  await expect(toggle).toHaveAccessibleName("Hide the registry password");
  await expect(toggle.locator(".ds-password-field__show")).toBeHidden();
  await input.evaluate((element) => (element.type = "password"));
  await expect(toggle).toHaveAccessibleName("Show the registry password");
  await expect(page.locator('[data-example="shown"] .ds-password-field__toggle')).toHaveAccessibleName("Hide the registry password");
  expect(await page.locator(".ds-password-field__toggle[aria-pressed]").count()).toBe(0);
});

// The default combobox example, read from the attributes the stylesheet styles.
const comboboxState = (page) =>
  page.locator('[data-example="default"] ds-combobox').evaluate((element) => {
    const input = element.querySelector('[role="combobox"]');
    const options = [...element.querySelectorAll('[role="option"]')];
    return {
      value: input.value,
      expanded: input.getAttribute("aria-expanded"),
      active: input.getAttribute("aria-activedescendant"),
      shown: options.filter((option) => !option.hidden).map((option) => option.textContent),
      selected: options.filter((option) => option.getAttribute("aria-selected") === "true").map((option) => option.textContent),
      status: element.querySelector('[role="status"]').textContent,
      panel: getComputedStyle(element.querySelector(".ds-combobox__panel")).display,
      message: element.querySelector(".ds-combobox__message").hidden,
      inlineStyles: [element, ...element.querySelectorAll("*")].filter((node) => node.hasAttribute("style")).length,
    };
  });

test("ds-combobox filters as the reader types and writes the count into the status line", async ({ page }) => {
  await open(page, "combobox");
  expect(await page.evaluate(() => customElements.get("ds-combobox")?.name)).toBe("DsCombobox");
  expect(await comboboxState(page)).toMatchObject({ value: "main", expanded: "false", panel: "none", status: "" });

  const input = page.locator("#combobox-default-input");
  await input.fill("");
  await page.keyboard.type("fix");
  expect(await comboboxState(page)).toMatchObject({
    shown: ["fix/login-timeout", "fix/session-refresh"],
    expanded: "true",
    panel: "block",
    status: "2 of 5 branches",
    active: null,
    selected: [],
  });
  await input.fill("DEV");
  expect(await comboboxState(page)).toMatchObject({ shown: ["develop"], status: "1 of 5 branches" });
  expect((await comboboxState(page)).inlineStyles).toBe(0);
  // An example that is not wrapped in the element keeps the state its markup gives it.
  expect(await page.locator('[data-example="open"] .ds-combobox__panel').evaluate((element) => getComputedStyle(element).display)).toBe("block");
});

test("ds-combobox moves aria-activedescendant with Down, Up, Home and End, and Enter selects and closes", async ({ page }) => {
  await open(page, "combobox");
  const input = page.locator("#combobox-default-input");
  await input.fill("");
  await page.keyboard.type("fix");
  const steps = [
    ["ArrowDown", "combobox-default-option-3"],
    ["ArrowDown", "combobox-default-option-4"],
    ["ArrowDown", "combobox-default-option-3"],
    ["ArrowUp", "combobox-default-option-4"],
    ["Home", "combobox-default-option-3"],
    ["End", "combobox-default-option-4"],
  ];
  for (const [key, active] of steps) {
    await page.keyboard.press(key);
    expect((await comboboxState(page)).active, key).toBe(active);
  }
  expect((await comboboxState(page)).selected).toEqual(["fix/session-refresh"]);
  await expect(input).toBeFocused();

  await input.evaluate((element) => element.addEventListener("change", () => element.setAttribute("data-changed", element.value)));
  await page.keyboard.press("Enter");
  expect(await comboboxState(page)).toMatchObject({ value: "fix/session-refresh", expanded: "false", active: null, panel: "none" });
  await expect(input).toHaveAttribute("data-changed", "fix/session-refresh");

  // Down on a closed list opens every option, and a press on one chooses it without taking focus from the input.
  await page.keyboard.press("ArrowDown");
  expect(await comboboxState(page)).toMatchObject({ expanded: "true", active: "combobox-default-option-1" });
  expect((await comboboxState(page)).shown).toHaveLength(5);
  await page.locator("#combobox-default-option-5").click();
  expect(await comboboxState(page)).toMatchObject({ value: "release/2026-11", expanded: "false" });
  await expect(input).toBeFocused();
});

test("ds-combobox shows its message when nothing matches, and Escape closes it and keeps the text", async ({ page }) => {
  await open(page, "combobox");
  const input = page.locator("#combobox-default-input");
  await input.fill("relase");
  expect(await comboboxState(page)).toMatchObject({
    expanded: "false",
    shown: [],
    message: false,
    panel: "block",
    status: "No branch matches. Check the spelling, or clear the field to see all 5 branches.",
  });
  await page.keyboard.press("Escape");
  expect(await comboboxState(page)).toMatchObject({ message: true, panel: "none", value: "relase" });

  await input.fill("dev");
  expect((await comboboxState(page)).expanded).toBe("true");
  await page.keyboard.press("Escape");
  expect(await comboboxState(page)).toMatchObject({ expanded: "false", value: "dev", panel: "none" });

  await input.click();
  expect((await comboboxState(page)).expanded).toBe("true");
  await page.keyboard.press("Tab");
  expect((await comboboxState(page)).expanded).toBe("false");
});

test("loading the combobox module a second time is harmless", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "combobox");
  await page.addScriptTag({ url: `${origin}/behaviors/combobox.js?again`, type: "module" });
  await page.evaluate(() => import("/behaviors/combobox.js?once-more"));
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => customElements.get("ds-combobox").name)).toBe("DsCombobox");
  await page.locator("#combobox-default-input").fill("main");
  expect(await comboboxState(page)).toMatchObject({ shown: ["main"], status: "1 of 5 branches" });
});

// The closed command palette example, which the shortcut and its button open.
const PALETTE = '[data-example="closed"]';
const paletteState = (page) =>
  page.locator(PALETTE).evaluate((root) => {
    const input = root.querySelector('[role="combobox"]');
    const options = [...root.querySelectorAll('[role="option"]')];
    return {
      open: root.querySelector("dialog").open,
      modal: root.querySelector("dialog").matches(":modal"),
      focus: document.activeElement.id || document.activeElement.textContent.trim(),
      value: input.value,
      expanded: input.getAttribute("aria-expanded"),
      active: input.getAttribute("aria-activedescendant"),
      shown: options.filter((option) => !option.hidden).map((option) => option.querySelector(".ds-command-palette__name").textContent),
      selected: options.filter((option) => option.getAttribute("aria-selected") === "true").map((option) => option.id),
      groupsShown: [...root.querySelectorAll('[role="group"]')].filter((group) => !group.hidden).length,
      listHidden: root.querySelector('[role="listbox"]').hidden,
      messageHidden: root.querySelector('[role="status"]').hidden,
      message: root.querySelector('[role="status"]').textContent,
      inlineStyles: [...root.querySelectorAll("ds-command-palette, ds-command-palette *")].filter((node) => node.hasAttribute("style")).length,
    };
  });

test("ds-command-palette opens on Ctrl+K with focus in the input, filters as the reader types and hides a group with no match", async ({ page }) => {
  await open(page, "command-palette");
  expect(await page.evaluate(() => customElements.get("ds-command-palette")?.name)).toBe("DsCommandPalette");
  expect((await paletteState(page)).open).toBe(false);
  await page.locator(`${PALETTE} > button`).focus();

  // A plain k, and the shortcut with Shift, do nothing.
  await page.keyboard.press("Control+Shift+k");
  await page.keyboard.press("k");
  expect((await paletteState(page)).open).toBe(false);

  await page.keyboard.press("Control+k");
  expect(await paletteState(page)).toMatchObject({
    open: true,
    modal: true,
    focus: "command-palette-closed-input",
    active: "command-palette-closed-new-task",
    selected: ["command-palette-closed-new-task"],
  });
  expect((await paletteState(page)).shown).toHaveLength(6);

  await page.keyboard.type("open");
  expect(await paletteState(page)).toMatchObject({
    shown: ["Open a terminal in the worktree", "Open the pull request on GitHub"],
    groupsShown: 1,
    expanded: "true",
    active: "command-palette-closed-terminal",
  });

  // A shortcut hint is not matched, so nothing is left: the list goes and the message shows.
  await page.locator("#command-palette-closed-input").fill("ctrl");
  expect(await paletteState(page)).toMatchObject({ shown: [], listHidden: true, messageHidden: false, expanded: "false", active: null });
  await expect(page.locator(`${PALETTE} [role="status"]`)).toBeVisible();
  expect((await paletteState(page)).inlineStyles).toBe(0);
});

test("ds-command-palette moves the selection with Down and Up, and Escape closes it and returns focus", async ({ page }) => {
  await open(page, "command-palette");
  await page.locator(`${PALETTE} > button`).focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.type("open");
  const steps = [
    ["ArrowDown", "command-palette-closed-pr"],
    ["ArrowDown", "command-palette-closed-terminal"],
    ["ArrowUp", "command-palette-closed-pr"],
  ];
  for (const [key, active] of steps) {
    await page.keyboard.press(key);
    expect(await paletteState(page), key).toMatchObject({ active, selected: [active], focus: "command-palette-closed-input" });
  }

  await page.keyboard.press("Escape");
  await expect(page.locator(`${PALETTE} dialog`)).not.toHaveAttribute("open");
  // The dialog's close event arrives after the key, and empties the input.
  await expect(page.locator("#command-palette-closed-input")).toHaveValue("");
  expect(await paletteState(page)).toMatchObject({ open: false, focus: "Open the command palette", value: "", messageHidden: false, message: "" });
  expect((await paletteState(page)).shown).toHaveLength(6);
});

test("ds-command-palette opens on Meta+K, and Enter activates the selected command and closes", async ({ page }) => {
  await open(page, "command-palette");
  await page.locator(`${PALETTE} > button`).focus();
  // The app's own listener on the command runs while the dialog is still open.
  await page.evaluate(() =>
    document.getElementById("command-palette-closed-rebase").addEventListener("click", (event) => {
      document.body.dataset.ran = `${event.currentTarget.id} open=${event.currentTarget.closest("dialog").open}`;
    }),
  );
  await page.keyboard.press("Meta+k");
  expect((await paletteState(page)).open).toBe(true);
  await page.keyboard.type("rebase main");
  expect((await paletteState(page)).shown).toEqual(["Rebase onto main"]);
  await page.keyboard.press("Enter");
  await expect(page.locator(`${PALETTE} dialog`)).not.toHaveAttribute("open");
  expect(await page.evaluate(() => document.body.dataset.ran)).toBe("command-palette-closed-rebase open=true");
  expect((await paletteState(page)).focus).toBe("Open the command palette");

  // The button opens it too, and a press on a command closes it.
  await page.locator(`${PALETTE} > button`).click();
  expect((await paletteState(page)).open).toBe(true);
  await page.locator("#command-palette-closed-terminal").click();
  expect((await paletteState(page)).open).toBe(false);

  // A command that is not available is never pressed.
  await page.evaluate(() => {
    const option = document.getElementById("command-palette-closed-new-task");
    option.setAttribute("aria-disabled", "true");
    option.addEventListener("click", () => (document.body.dataset.disabledRan = "yes"));
  });
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Enter");
  expect((await paletteState(page)).open).toBe(true);
  expect(await page.evaluate(() => document.body.dataset.disabledRan ?? "no")).toBe("no");
});

test("loading the command palette module a second time is harmless", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "command-palette");
  await page.addScriptTag({ url: `${origin}/behaviors/command-palette.js?again`, type: "module" });
  await page.evaluate(() => import("/behaviors/command-palette.js?once-more"));
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => customElements.get("ds-command-palette").name)).toBe("DsCommandPalette");
  await page.locator(`${PALETTE} > button`).focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.type("copy");
  expect((await paletteState(page)).shown).toEqual(["Copy the transcript of run 4182"]);
});

test("at 390px every popover drawn open in the gallery ends inside its example, 16px or more from the screen edge", async ({ page }) => {
  await open(page, "popover", { width: 390 });
  const boxes = await page.locator("[data-example] [popover]").evaluateAll((popovers) =>
    popovers.map((popover) => {
      const example = popover.closest("[data-example]");
      const inner = example.getBoundingClientRect().right - parseFloat(getComputedStyle(example).paddingRight);
      return { id: popover.id, open: popover.matches(":popover-open"), right: popover.getBoundingClientRect().right, inner, screen: document.documentElement.clientWidth };
    }),
  );
  expect(boxes.map((box) => box.id)).toEqual(expect.arrayContaining(["popover-text", "popover-error", "popover-only-way"]));
  for (const box of boxes) {
    expect(box.open, box.id).toBe(true);
    expect(box.right, box.id).toBeLessThanOrEqual(box.inner + 0.5);
    expect(box.right, box.id).toBeLessThanOrEqual(box.screen - 16);
  }
});

test("on a page of its own at 390px a wide popover keeps a 16px margin from the trailing edge", async ({ page }) => {
  const popover = index.components.find((component) => component.name === "popover").examples.find((example) => example.id === "text");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${origin}/gallery/popover.html`);
  // The gallery's own rules for an example do not reach this markup: it replaces the page.
  await page.evaluate((markup) => {
    document.body.innerHTML = `<main class="ds-container">${markup}</main>`;
  }, popover.markup);
  await page.locator("button[popovertarget]").click();
  const box = await page.locator("[popover]").boundingBox();
  expect(await page.locator("[popover]").evaluate((element) => element.matches(":popover-open"))).toBe(true);
  expect(box.x).toBeGreaterThanOrEqual(16);
  expect(box.x + box.width).toBeLessThanOrEqual(390 - 16);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});

test("the closed dialog example opens as a modal from its command button, and Cancel closes it", async ({ page }) => {
  await open(page, "dialog");
  const example = page.locator('[data-example="closed"]');
  const dialog = example.locator("dialog");
  await expect(dialog).not.toHaveAttribute("open");
  await expect(dialog).toBeHidden();
  const opener = example.locator("> button");
  await expect(opener).toHaveAttribute("command", "show-modal");
  expect(await opener.getAttribute("commandfor")).toBe(await dialog.getAttribute("id"));
  await opener.click();
  expect(await dialog.evaluate((element) => element.open && element.matches(":modal"))).toBe(true);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("the app shell shows the sidebar nav at 1280px and the tab bar at 390px, with one h1 and no sideways scroll", async ({ page }) => {
  for (const [width, shown, hidden] of [[1280, ".ds-sidebar-nav", ".ds-tab-bar"], [390, ".ds-tab-bar", ".ds-sidebar-nav"]]) {
    await open(page, "app-shell", { width });
    for (const id of ["list", "empty"]) {
      const example = page.locator(`[data-example="${id}"]`);
      await expect(example.locator(shown), `${id} at ${width}`).toBeVisible();
      await expect(example.locator(hidden), `${id} at ${width}`).toBeHidden();
      await expect(example.locator("h1")).toHaveCount(1);
      await expect(example.locator(".ds-app-header__tray .ds-pending-tray")).toBeVisible();
      // The tab bar is the last thing in the shell, at its bottom edge.
      const edges = await example.locator(".ds-app-shell").evaluate((shell) => [shell.getBoundingClientRect().bottom, shell.lastElementChild.getBoundingClientRect().bottom, shell.scrollWidth - shell.clientWidth]);
      if (width === 390) expect(Math.abs(edges[0] - edges[1])).toBeLessThan(1);
      expect(edges[2]).toBe(0);
    }
  }
});

const TOOL_CALL_STATES = {
  requested: ["Preparing", "circle-dashed"],
  "awaiting-approval": ["Awaiting approval", "circle-pause"],
  running: ["Running", "loader"],
  succeeded: ["Succeeded", "circle-check"],
  failed: ["Failed", "circle-alert"],
  declined: ["Declined", "ban"],
  "timed-out": ["Timed out", "clock"],
  cancelled: ["Cancelled", "circle-slash"],
};

// The status of the tool call in the example named after each state: its word, the icon drawn before it and whether that icon moves.
const toolCallStatuses = (page) =>
  page.evaluate((states) => {
    const read = {};
    for (const state of states) {
      const status = document.querySelector(`[data-example="${state}"] .ds-tool-call[data-state="${state}"] .ds-tool-call__status`);
      const icon = getComputedStyle(status, "::before");
      read[state] = { word: status.textContent, mask: icon.maskImage, width: icon.width, animation: icon.animationName };
    }
    return read;
  }, Object.keys(TOOL_CALL_STATES));

test("a tool call in each data-state shows its status word and its own icon, and only running moves, until motion is reduced", async ({ page }) => {
  await open(page, "tool-call");
  const meta = index.components.find((component) => component.name === "tool-call");
  expect(meta.states).toEqual(expect.arrayContaining(Object.keys(TOOL_CALL_STATES)));

  const statuses = await toolCallStatuses(page);
  const icons = new Set();
  for (const [state, [word, icon]] of Object.entries(TOOL_CALL_STATES)) {
    expect(statuses[state].word, state).toBe(word);
    expect(statuses[state].mask, state).toContain(`icons/${icon}.svg`);
    expect(statuses[state].width, state).toBe("16px");
    expect(statuses[state].animation, state).toBe(state === "running" ? "ds-tool-call-turn" : "none");
    icons.add(icon);
  }
  // No two states share an icon, so the shape alone tells them apart as well.
  expect(icons.size).toBe(Object.keys(TOOL_CALL_STATES).length);

  await page.emulateMedia({ reducedMotion: "reduce" });
  const still = await toolCallStatuses(page);
  for (const state of Object.keys(TOOL_CALL_STATES)) expect(still[state].animation, state).toBe("none");
  expect(still.running.word).toBe("Running");
  expect(still.running.mask).toContain("icons/loader.svg");
});

test("a tool call that awaits approval shows Allow and Decline while its details are closed, at secondary emphasis", async ({ page }) => {
  await open(page, "tool-call", { width: 390 });
  await page.addScriptTag({ path: join(dist, "check-dom.js") });
  for (const id of ["approval-closed", "awaiting-approval"]) {
    const example = page.locator(`[data-example="${id}"]`);
    const details = example.locator("details.ds-tool-call__details");
    // The reader closes the row that the app showed open.
    if (await details.evaluate((element) => element.open)) await example.locator("summary").click();
    await expect(details).not.toHaveAttribute("open");
    await expect(example.locator(".ds-tool-call__body")).toBeHidden();
    for (const name of ["Allow", "Decline"]) {
      const button = example.getByRole("button", { name, exact: true });
      await expect(button, `${id} ${name}`).toBeVisible();
      await expect(button).toHaveAttribute("data-ds-critical", "");
      await expect(button).toHaveClass("ds-button ds-button--small");
      expect(await button.evaluate((element) => Boolean(element.closest("details")))).toBe(false);
    }
    expect(await example.evaluate((element) => dsCheckDom(element).map((finding) => finding.rule)), id).toEqual([]);
  }
  // The same two buttons inside the closed details are what the checker reports.
  const hidden = page.locator('[data-example="approval-in-details"]');
  expect(await hidden.evaluate((element) => [...new Set(dsCheckDom(element).map((finding) => finding.rule))])).toEqual(["hidden-critical-action"]);
});

test("each do example of the agent run has one primary action, secondary approval controls and at most two levels of disclosure", async ({ page }) => {
  await open(page, "agent-run");
  await page.addScriptTag({ path: join(dist, "check-dom.js") });
  const examples = await page.evaluate((selector) =>
    [...document.querySelectorAll(selector)].map((example) => {
      const depth = (node) => {
        let levels = 0;
        for (let parent = node.parentElement; parent; parent = parent.parentElement) if (parent.tagName === "DETAILS") levels += 1;
        return levels;
      };
      const messages = [...example.querySelectorAll('.ds-message:not([class*="ds-message--"])')];
      return {
        id: example.dataset.example,
        primaries: example.querySelectorAll(".ds-button--primary").length,
        approvals: [...example.querySelectorAll(".ds-tool-call__actions button")].map((button) => `${button.textContent} ${button.className} ${button.hasAttribute("data-ds-critical")}`),
        deepest: Math.max(0, ...[...example.querySelectorAll("details")].map((details) => depth(details) + 1)),
        headings: example.querySelectorAll("h1").length,
        log: [...example.querySelectorAll('[role="log"]')].map((log) => `${log.getAttribute("aria-live")} ${Boolean(log.getAttribute("aria-label"))}`),
        announcers: example.querySelectorAll('.ds-activity-announcer[role="status"]').length,
        liveText: example.querySelectorAll('.ds-message [aria-live]:not([aria-live="off"])').length,
        answersInAFold: messages.filter((message) => message.closest("details")).length,
        lastMessage: messages.at(-1)?.dataset.state ?? null,
        openGroups: [...example.querySelectorAll("details.ds-step-group")].map((group) => group.open),
        findings: dsCheckDom(example).map((finding) => finding.rule),
      };
    }), DO);
  const byId = Object.fromEntries(examples.map((example) => [example.id, example]));
  expect(Object.keys(byId)).toEqual(["running", "loading", "empty", "finished"]);
  for (const example of examples) {
    expect(example.primaries, example.id).toBe(1);
    expect(example.deepest, example.id).toBeLessThanOrEqual(2);
    expect(example.headings, example.id).toBe(1);
    expect(example.announcers, example.id).toBe(1);
    expect(example.liveText, example.id).toBe(0);
    expect(example.answersInAFold, example.id).toBe(0);
    expect(example.findings, example.id).toEqual([]);
  }
  expect(byId.running.approvals).toEqual(["Allow ds-button ds-button--small true", "Decline ds-button ds-button--small true"]);
  expect(byId.running.deepest).toBe(2);
  expect(byId.running.log).toEqual(["off true"]);
  expect(byId.running.lastMessage).toBe("streaming");
  // One finished group is closed, and the group with a running step and the one that awaits approval are open.
  expect(byId.running.openGroups).toEqual([false, true, true]);
  expect(byId.finished.openGroups).toEqual([false, false, false]);
  expect(byId.finished.lastMessage).toBe("done");
  await expect(page.locator('[data-example="running"] .ds-now-doing')).toHaveAttribute("data-state", "waiting");
  await expect(page.locator('[data-example="running"] .ds-now-doing')).not.toHaveAttribute("role");
  await expect(page.locator('[data-example="running"] .ds-jump-to-latest__button')).toHaveText("3 new steps Jump to latest");
  await expect(page.locator('[data-example="finished"] .ds-agent-run__dock')).toHaveCount(0);
});

test("the run timeline runs across the page at 1280px and down it at 390px, with one current station said in words", async ({ page }) => {
  for (const [width, direction] of [[1280, "row"], [390, "column"]]) {
    await open(page, "run-timeline", { width });
    const timeline = page.locator('[data-example="running"] .ds-run-timeline');
    expect(await timeline.evaluate((element) => getComputedStyle(element).flexDirection)).toBe(direction);
    await expect(timeline.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(timeline.locator('[aria-current="step"] .ds-run-timeline__status')).toHaveText(/^Running · 4 min 12 s$/);
    await expect(timeline.locator(".ds-run-timeline__status")).toHaveText([/^Done/, /^Running/, "Not started", "Not started", "Not started"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  }
  await expect(page.locator('[data-example="not-started"] [aria-current]')).toHaveCount(0);
});

test("the activity announcer is in the page and not drawn, and the transcript beside it is a named log that does not speak", async ({ page }) => {
  await open(page, "activity-announcer");
  for (const example of await page.locator(DO).all()) {
    const region = example.locator(".ds-activity-announcer");
    await expect(region).toHaveCount(1);
    await expect(region).toHaveAttribute("role", "status");
    expect(await region.evaluate((element) => element.checkVisibility() && !element.hidden)).toBe(true);
    const box = await region.boundingBox();
    expect([box.width, box.height]).toEqual([1, 1]);
    const log = example.locator('[role="log"]');
    await expect(log).toHaveAttribute("aria-live", "off");
    expect(await log.getAttribute("aria-label")).toMatch(/^Transcript of run \d+$/);
    expect(await example.locator("[aria-live]:not([role='log'])").count()).toBe(0);
  }
  await expect(page.locator('[data-example="rest"] .ds-activity-announcer')).toHaveText("");
  await expect(page.locator('[data-example="needs-approval"] .ds-activity-announcer')).toHaveText(/^Approval needed: /);
});

test("a streaming message draws its caret hidden from assistive technology, and the row is not a live region", async ({ page }) => {
  await open(page, "message");
  const row = page.locator('[data-example="streaming"] .ds-message');
  const caret = row.locator(".ds-message__caret");
  await expect(caret).toHaveAttribute("aria-hidden", "true");
  await expect(caret).toBeVisible();
  expect(await row.evaluate((element) => [element, ...element.querySelectorAll("*")].filter((node) => node.hasAttribute("aria-live") || node.hasAttribute("role")).length)).toBe(0);
  const words = { stopped: /^Stopped\./, interrupted: /^Interrupted\./, reconnecting: /^Reconnecting/ };
  for (const [state, start] of Object.entries(words)) {
    const ended = page.locator(`[data-example="${state}"] .ds-message[data-state="${state}"]`);
    await expect(ended.locator(".ds-message__state")).toHaveText(start);
    await expect(ended.locator(".ds-message__body")).toHaveText(/I will start it whenever a valid$/);
    expect(await ended.locator(".ds-message__state").evaluate((element) => getComputedStyle(element, "::before").maskImage)).toContain("icons/");
  }
  await expect(page.locator('[data-example="interrupted"]').getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.locator('[data-example="done"] .ds-message > *')).toHaveCount(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await caret.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});

const TRANSCRIPT_PAGE = `
<ds-transcript>
  <div data-ds-scroller>
    <div role="log" aria-live="off" aria-label="Transcript of run 4182"><ol></ol></div>
  </div>
  <div class="ds-jump-to-latest" data-ds-jump hidden>
    <button type="button" class="ds-jump-to-latest__button"><span class="ds-jump-to-latest__count" data-ds-count="{count} new steps" data-ds-count-one="1 new step"></span> Jump to latest</button>
  </div>
  <textarea aria-label="Message Claude Code"></textarea>
</ds-transcript>`;

// A page of its own with a transcript 300px tall. The height is the test's: a real screen takes it from its layout.
async function openTranscript(page) {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${origin}/gallery/jump-to-latest.html`);
  await page.evaluate((markup) => {
    document.body.innerHTML = markup;
    const scroller = document.querySelector("[data-ds-scroller]");
    scroller.style.height = "300px";
    scroller.style.overflow = "auto";
    window.addRows = (count) => {
      const list = document.querySelector('[role="log"] ol');
      for (let added = 0; added < count; added++) {
        const row = document.createElement("li");
        row.className = "ds-message";
        row.textContent = `Row ${list.children.length + 1}. `.repeat(6);
        list.append(row);
      }
    };
    window.addRows(30);
  }, TRANSCRIPT_PAGE);
  await page.locator("textarea").focus();
}

const transcriptState = (page) =>
  page.evaluate(() => {
    const scroller = document.querySelector("[data-ds-scroller]");
    const jump = document.querySelector("[data-ds-jump]");
    return {
      fromBottom: Math.round(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight),
      jumpHidden: jump.hidden,
      count: jump.querySelector("[data-ds-count]").textContent,
      focus: document.activeElement.tagName,
    };
  });

const scrollTranscript = (page, to) =>
  page.evaluate((position) => {
    const scroller = document.querySelector("[data-ds-scroller]");
    scroller.scrollTop = position === "bottom" ? scroller.scrollHeight : position;
  }, to);

test("ds-transcript follows the bottom as rows are added, and never moves focus", async ({ page }) => {
  await openTranscript(page);
  expect(await page.evaluate(() => customElements.get("ds-transcript")?.name)).toBe("DsTranscript");
  // It starts empty, which is at the bottom, so the first rows are followed as they arrive.
  await expect.poll(() => transcriptState(page)).toEqual({ fromBottom: 0, jumpHidden: true, count: "", focus: "TEXTAREA" });
  expect(await page.evaluate(() => document.querySelector("[data-ds-scroller]").scrollTop)).toBeGreaterThan(300);
  for (const count of [1, 3, 10]) {
    await page.evaluate((rows) => window.addRows(rows), count);
    await expect.poll(async () => (await transcriptState(page)).fromBottom, `after ${count} more`).toBe(0);
    expect(await transcriptState(page)).toMatchObject({ jumpHidden: true, focus: "TEXTAREA" });
  }
  // A row that grows, as a streamed reply does, is followed too.
  await page.evaluate(() => document.querySelector('[role="log"] li:last-child').append("More text. ".repeat(40)));
  await expect.poll(async () => (await transcriptState(page)).fromBottom).toBe(0);
  // Within 60px of the bottom still counts as at the bottom.
  await page.evaluate(() => { const scroller = document.querySelector("[data-ds-scroller]"); scroller.scrollTop -= 40; });
  await page.evaluate(() => window.addRows(2));
  await expect.poll(async () => (await transcriptState(page)).fromBottom).toBe(0);
  expect((await transcriptState(page)).jumpHidden).toBe(true);
  expect(await page.evaluate(() => [...document.querySelectorAll("ds-transcript, ds-transcript *")].filter((node) => node.hasAttribute("style") && !node.matches("[data-ds-scroller]")).length)).toBe(0);
});

test("ds-transcript stops following when the reader scrolls up, counts the rows added since, and jumping resumes it", async ({ page }) => {
  await openTranscript(page);
  await scrollTranscript(page, "bottom");
  await expect.poll(async () => (await transcriptState(page)).fromBottom).toBe(0);

  await scrollTranscript(page, 200);
  await page.waitForFunction(() => document.querySelector("[data-ds-scroller]").scrollTop === 200);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => window.addRows(3));
  await expect.poll(() => transcriptState(page)).toMatchObject({ jumpHidden: false, count: "3 new steps", focus: "TEXTAREA" });
  // The reader stays where they scrolled to.
  expect(await page.evaluate(() => document.querySelector("[data-ds-scroller]").scrollTop)).toBe(200);
  await page.evaluate(() => window.addRows(2));
  await expect.poll(async () => (await transcriptState(page)).count).toBe("5 new steps");
  expect(await page.evaluate(() => document.querySelector("[data-ds-scroller]").scrollTop)).toBe(200);
  await expect(page.getByRole("button", { name: "5 new steps Jump to latest" })).toBeVisible();

  // A press with the pointer jumps, hides the control and leaves focus in the composer.
  await page.locator("[data-ds-jump] button").click();
  await expect.poll(() => transcriptState(page)).toMatchObject({ fromBottom: 0, jumpHidden: true, focus: "TEXTAREA" });
  await page.evaluate(() => window.addRows(4));
  await expect.poll(async () => (await transcriptState(page)).fromBottom).toBe(0);
  expect((await transcriptState(page)).jumpHidden).toBe(true);

  // Scrolling back to the bottom by hand resumes it as well, and the count starts again.
  await scrollTranscript(page, 0);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => window.addRows(1));
  await expect.poll(() => transcriptState(page)).toMatchObject({ jumpHidden: false, count: "1 new step" });
  await scrollTranscript(page, "bottom");
  await expect.poll(async () => (await transcriptState(page)).jumpHidden).toBe(true);

  // From the keyboard the button holds focus, so it stays until focus leaves it.
  await scrollTranscript(page, 0);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => window.addRows(2));
  await expect.poll(async () => (await transcriptState(page)).count).toBe("2 new steps");
  await page.locator("[data-ds-jump] button").focus();
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await transcriptState(page)).fromBottom).toBe(0);
  expect(await transcriptState(page)).toMatchObject({ jumpHidden: false, focus: "BUTTON" });
  await page.locator("textarea").focus();
  await expect.poll(async () => (await transcriptState(page)).jumpHidden).toBe(true);
});

test("loading the transcript and elapsed modules a second time is harmless", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openTranscript(page);
  for (const name of ["transcript", "elapsed"]) {
    await page.addScriptTag({ url: `${origin}/behaviors/${name}.js?again`, type: "module" });
    await page.evaluate((module) => import(`/behaviors/${module}.js?once-more`), name);
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => [customElements.get("ds-transcript").name, customElements.get("ds-elapsed").name])).toEqual(["DsTranscript", "DsElapsed"]);
  await scrollTranscript(page, "bottom");
  await page.evaluate(() => window.addRows(3));
  await expect.poll(async () => (await transcriptState(page)).fromBottom).toBe(0);
});

test("ds-elapsed counts up once a second, stops on a final state, and is never announced", async ({ page }) => {
  const start = new Date("2026-11-22T10:00:00Z");
  await page.clock.install({ time: start });
  await page.goto(`${origin}/gallery/now-doing.html`);
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
  await page.evaluate(() => {
    document.body.innerHTML = `
      <p><ds-elapsed id="counting" datetime="2026-11-22T10:00:18Z">a moment</ds-elapsed></p>
      <p><ds-elapsed id="fixed" datetime="2026-11-22T10:00:18Z" duration="PT2.4S">a moment</ds-elapsed></p>
      <p><ds-elapsed id="long" duration="PT1H4M">a moment</ds-elapsed> <ds-elapsed id="short" duration="PT0.38S">a moment</ds-elapsed> <ds-elapsed id="whole" duration="PT4M12S">a moment</ds-elapsed></p>`;
  });
  const counting = page.locator("#counting");
  await expect(counting).toHaveText("42 s");
  await expect(counting).toHaveAttribute("aria-live", "off");
  await expect(counting).toHaveAttribute("role", "timer");
  await page.clock.runFor(1000);
  await expect(counting).toHaveText("43 s");
  await page.clock.runFor(2000);
  await expect(counting).toHaveText("45 s");
  await page.clock.runFor(20_000);
  await expect(counting).toHaveText("1 min 5 s");

  // A final state keeps the time it showed and stops the count.
  await counting.evaluate((element) => element.setAttribute("data-state", "succeeded"));
  await page.clock.runFor(30_000);
  await expect(counting).toHaveText("1 min 5 s");
  await expect(counting).toHaveAttribute("aria-live", "off");
  await expect(counting).not.toHaveAttribute("role");
  // Running again, it counts from its start, not from where it stopped.
  await counting.evaluate((element) => element.setAttribute("data-state", "running"));
  await expect(counting).toHaveText("1 min 35 s");
  await page.clock.runFor(1000);
  await expect(counting).toHaveText("1 min 36 s");
  // A duration fixes it for good.
  await counting.evaluate((element) => element.setAttribute("duration", "PT1M37.2S"));
  await page.clock.runFor(10_000);
  await expect(counting).toHaveText("1 min 37 s");

  await expect(page.locator("#fixed")).toHaveText("2.4 s");
  await expect(page.locator("#fixed")).toHaveAttribute("aria-live", "off");
  await expect(page.locator("#fixed")).not.toHaveAttribute("role");
  await expect(page.locator("#long")).toHaveText("1 h 4 min");
  await expect(page.locator("#short")).toHaveText("380 ms");
  await expect(page.locator("#whole")).toHaveText("4 min 12 s");
  expect(await page.evaluate(() => [...document.querySelectorAll("ds-elapsed")].filter((element) => element.hasAttribute("style") || element.hasAttribute("class") || element.shadowRoot).length)).toBe(0);
});

test("in the gallery a time that counts up reads as its example was written, and carries aria-live off", async ({ page }) => {
  await open(page, "now-doing");
  const elapsed = page.locator('[data-example="running"] ds-elapsed');
  await expect(elapsed).toHaveText("42 s");
  await expect(elapsed).toHaveAttribute("aria-live", "off");
  await expect(elapsed).toHaveAttribute("role", "timer");
  await expect(page.locator('[data-example="running"] .ds-now-doing')).not.toHaveAttribute("aria-live");
  await expect(page.locator('[data-example="running"]').getByRole("button", { name: "Stop" })).toHaveAttribute("data-ds-critical", "");
  await expect(page.locator('[data-example="waiting"] .ds-now-doing__link')).toHaveAttribute("href", "#now-doing-waiting-request");
});

test("diff line numbers: the old column shows only at 768px and wider, every number is hidden from a screen reader, and a copy leaves them out", async ({ page }) => {
  for (const [width, oldShown] of [[390, false], [1280, true]]) {
    await open(page, "diff", { width });
    const example = page.locator('[data-example="line-numbers"]');
    const shown = await example.locator(".ds-diff__number--old").evaluateAll((cells) => cells.map((cell) => getComputedStyle(cell).display !== "none"));
    expect(new Set(shown)).toEqual(new Set([oldShown]));
    expect(await example.locator(".ds-diff__number--new").first().evaluate((cell) => getComputedStyle(cell).display)).toBe("table-cell");
  }
  const example = page.locator('[data-example="line-numbers"]');
  expect(await example.locator('.ds-diff__number:not([aria-hidden="true"])').count()).toBe(0);
  const copied = await example.locator(".ds-diff__lines").evaluate((lines) => {
    const range = document.createRange();
    range.selectNodeContents(lines);
    getSelection().removeAllRanges();
    getSelection().addRange(range);
    return getSelection().toString();
  });
  expect(copied).toContain("const SESSION_TTL_SECONDS = 1800;");
  expect(copied.split("\n").filter((line) => /^\s*\d/.test(line))).toEqual([]);
});

test("log-viewer: 500 lines stay within its cap at 390px, scrolls by itself, and Show all lifts the cap", async ({ page }) => {
  await open(page, "log-viewer", { width: 390 });
  const body = page.locator('[data-example="default"] .ds-log-viewer__body');
  await body.evaluate((element) => {
    const list = element.querySelector("ol");
    for (let line = 0; line < 500; line++) {
      const row = document.createElement("li");
      row.className = "ds-log-viewer__line";
      row.textContent = `  at Object.<anonymous> (/srv/workspaces/acme-api/node_modules/vitest/dist/chunks/runtime.${line}.js:${line}:17)`;
      list.append(row);
    }
  });
  const capped = await body.evaluate((element) => ({ height: element.getBoundingClientRect().height, scrollHeight: element.scrollHeight }));
  expect(capped.height).toBeLessThanOrEqual(450);
  expect(capped.scrollHeight).toBeGreaterThan(capped.height * 10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  // An error line says so in words and an icon, not only in its tint.
  const error = page.locator('[data-example="default"] .ds-log-viewer__line--error').first();
  await expect(error.locator(".ds-visually-hidden")).toHaveText("Error: ");
  expect(await error.evaluate((element) => getComputedStyle(element, "::before").maskImage)).toContain("icons/circle-alert.svg");

  await page.locator('[data-example="default"] .ds-log-viewer__toggle').evaluate((button) => button.setAttribute("aria-expanded", "true"));
  const open_ = await body.evaluate((element) => ({ height: element.getBoundingClientRect().height, scrollHeight: element.scrollHeight }));
  expect(Math.ceil(open_.height)).toBeGreaterThanOrEqual(open_.scrollHeight);
});

test("log-viewer: while running it follows new lines only while the reader is at its end", async ({ page }) => {
  await open(page, "log-viewer", { width: 390 });
  const example = page.locator('[data-example="running"]');
  const addLines = (count) =>
    example.locator("ol").evaluate((list, total) => {
      for (let line = 0; line < total; line++) {
        const row = document.createElement("li");
        row.className = "ds-log-viewer__line";
        row.textContent = `Step ${list.children.length + 1}: npm notice copying files into the image layer`;
        list.append(row);
      }
    }, count);
  const state = () =>
    example.evaluate((element) => {
      const body = element.querySelector(".ds-log-viewer__body");
      return { fromBottom: Math.round(body.scrollHeight - body.scrollTop - body.clientHeight), jumpHidden: element.querySelector("[data-ds-jump]").hidden, count: element.querySelector("[data-ds-count]").textContent };
    });
  await addLines(500);
  await example.locator(".ds-log-viewer__body").evaluate((body) => { body.scrollTop = body.scrollHeight; });
  await expect.poll(async () => (await state()).fromBottom).toBe(0);
  await addLines(20);
  await expect.poll(async () => (await state()).fromBottom).toBe(0);
  expect((await state()).jumpHidden).toBe(true);

  await example.locator(".ds-log-viewer__body").evaluate((body) => { body.scrollTop = 100; });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await addLines(3);
  await expect.poll(() => state()).toMatchObject({ jumpHidden: false, count: "3 new lines" });
  expect(await example.locator(".ds-log-viewer__body").evaluate((body) => body.scrollTop)).toBe(100);
});

test("review-decision: each do example has at most one primary action, and the review carries no badge", async ({ page }) => {
  await open(page, "review-decision", { width: 390 });
  for (const example of await page.locator(DO).all()) {
    expect(await example.locator(".ds-button--primary").count()).toBeLessThanOrEqual(1);
    const review = example.locator(".ds-review-decision__line").filter({ hasText: "Review" }).locator(".ds-review-decision__finding");
    expect(await review.locator(".ds-badge").count()).toBe(0);
  }
});
