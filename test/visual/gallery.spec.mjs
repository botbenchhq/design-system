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

test("a pattern's gallery page lays its examples out in one column at 1280px, and a component's in two", async ({ page }) => {
  const columns = () =>
    page.locator('[data-gallery="page"] > section').first().locator("> .gw-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length);
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
  const toggle = page.locator('[data-example="default"] .gw-password-field__toggle');
  await expect(toggle).not.toHaveAttribute("aria-pressed");
  await expect(toggle).toHaveAccessibleName("Show the registry password");
  await expect(toggle.locator(".gw-password-field__hide")).toBeHidden();
  // What an app does on a press: it flips the input's type and nothing else.
  await input.evaluate((element) => (element.type = "text"));
  await expect(toggle).toHaveAccessibleName("Hide the registry password");
  await expect(toggle.locator(".gw-password-field__show")).toBeHidden();
  await input.evaluate((element) => (element.type = "password"));
  await expect(toggle).toHaveAccessibleName("Show the registry password");
  await expect(page.locator('[data-example="shown"] .gw-password-field__toggle')).toHaveAccessibleName("Hide the registry password");
  expect(await page.locator(".gw-password-field__toggle[aria-pressed]").count()).toBe(0);
});

// The default combobox example, read from the attributes the stylesheet styles.
const comboboxState = (page) =>
  page.locator('[data-example="default"] gw-combobox').evaluate((element) => {
    const input = element.querySelector('[role="combobox"]');
    const options = [...element.querySelectorAll('[role="option"]')];
    return {
      value: input.value,
      expanded: input.getAttribute("aria-expanded"),
      active: input.getAttribute("aria-activedescendant"),
      shown: options.filter((option) => !option.hidden).map((option) => option.textContent),
      selected: options.filter((option) => option.getAttribute("aria-selected") === "true").map((option) => option.textContent),
      status: element.querySelector('[role="status"]').textContent,
      panel: getComputedStyle(element.querySelector(".gw-combobox__panel")).display,
      message: element.querySelector(".gw-combobox__message").hidden,
      inlineStyles: [element, ...element.querySelectorAll("*")].filter((node) => node.hasAttribute("style")).length,
    };
  });

test("gw-combobox filters as the reader types and writes the count into the status line", async ({ page }) => {
  await open(page, "combobox");
  expect(await page.evaluate(() => customElements.get("gw-combobox")?.name)).toBe("GwCombobox");
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
  expect(await page.locator('[data-example="open"] .gw-combobox__panel').evaluate((element) => getComputedStyle(element).display)).toBe("block");
});

test("gw-combobox moves aria-activedescendant with Down, Up, Home and End, and Enter selects and closes", async ({ page }) => {
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

test("gw-combobox shows its message when nothing matches, and Escape closes it and keeps the text", async ({ page }) => {
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
  expect(await page.evaluate(() => customElements.get("gw-combobox").name)).toBe("GwCombobox");
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
      shown: options.filter((option) => !option.hidden).map((option) => option.querySelector(".gw-command-palette__name").textContent),
      selected: options.filter((option) => option.getAttribute("aria-selected") === "true").map((option) => option.id),
      groupsShown: [...root.querySelectorAll('[role="group"]')].filter((group) => !group.hidden).length,
      listHidden: root.querySelector('[role="listbox"]').hidden,
      messageHidden: root.querySelector('[role="status"]').hidden,
      inlineStyles: [...root.querySelectorAll("gw-command-palette, gw-command-palette *")].filter((node) => node.hasAttribute("style")).length,
    };
  });

test("gw-command-palette opens on Ctrl+K with focus in the input, filters as the reader types and hides a group with no match", async ({ page }) => {
  await open(page, "command-palette");
  expect(await page.evaluate(() => customElements.get("gw-command-palette")?.name)).toBe("GwCommandPalette");
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

test("gw-command-palette moves the selection with Down and Up, and Escape closes it and returns focus", async ({ page }) => {
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
  expect(await paletteState(page)).toMatchObject({ open: false, focus: "Open the command palette", value: "", messageHidden: true });
  expect((await paletteState(page)).shown).toHaveLength(6);
});

test("gw-command-palette opens on Meta+K, and Enter activates the selected command and closes", async ({ page }) => {
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
  expect(await page.evaluate(() => customElements.get("gw-command-palette").name)).toBe("GwCommandPalette");
  await page.locator(`${PALETTE} > button`).focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.type("copy");
  expect((await paletteState(page)).shown).toEqual(["Copy the transcript of run 4182"]);
});
