// The keyboard of the menu, the context menu, the split button's menu and the listbox, from behaviors/menu.js and
// behaviors/listbox.js, and the command palette's no-match message. Every test drives the gallery page by keyboard.
import { expect, test } from "@playwright/test";
import { openGallery, pressTab, serveDist } from "./serve.mjs";

let server;
test.beforeAll(async () => {
  server = await serveDist();
});
test.afterAll(() => server.close());

// The gallery draws its menus open as manual popovers. Each test puts one back as the markup has it,
// closed and light-dismissed, and opens it from its button with the keyboard, as a reader would.
async function openMenu(page, id) {
  await page.evaluate((menuId) => {
    const menu = document.getElementById(menuId);
    if (menu.matches(":popover-open")) menu.hidePopover();
    menu.popover = "auto";
  }, id);
  await page.locator(`[popovertarget="${id}"]`).focus();
  await page.keyboard.press("Enter");
}

const menuState = (page, id) =>
  page.evaluate((menuId) => {
    const menu = document.getElementById(menuId);
    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    const active = document.activeElement;
    return {
      open: menu.matches(":popover-open"),
      inMenu: menu.contains(active),
      focus: active.getAttribute("aria-label") ?? active.textContent.trim(),
      stops: items.filter((item) => item.getAttribute("tabindex") === "0").map((item) => item.textContent.trim()),
      others: items.filter((item) => item.getAttribute("tabindex") === "-1").length,
    };
  }, id);

// Polls until the menu is in the state given, since a popover's toggle event arrives after the key.
const expectMenu = (page, id, state) => expect.poll(() => menuState(page, id)).toMatchObject(state);

const marks = (page) =>
  page.evaluate(() => ({
    styled: document.querySelectorAll("ds-menu [style], ds-listbox [style]").length,
    classes: [...document.querySelectorAll("ds-menu, ds-menu *, ds-listbox, ds-listbox *")].map((element) => element.className.baseVal ?? element.className).join(" "),
  }));

test("in an open menu Down, Up, Home and End move focus and wrap at the ends, with one item in the tab order", async ({ page }) => {
  await openGallery(page, server.origin, "menu");
  const before = await marks(page);
  await openMenu(page, "menu-default");
  await expectMenu(page, "menu-default", { open: true, focus: "Copy branch name", stops: ["Copy branch name"], others: 3 });
  const steps = [
    ["ArrowDown", "Rebase onto main"],
    ["ArrowDown", "Open a terminal in the worktree"],
    ["End", "Delete task 41"],
    ["ArrowDown", "Copy branch name"],
    ["ArrowUp", "Delete task 41"],
    ["Home", "Copy branch name"],
  ];
  for (const [key, focus] of steps) {
    await page.keyboard.press(key);
    expect(await menuState(page, "menu-default"), key).toMatchObject({ open: true, focus, stops: [focus], others: 3 });
  }
  // It sets attributes and moves focus, and adds no class and no inline style.
  expect(await marks(page)).toEqual(before);
});

test("a letter key moves to the next menu item that starts with it, wrapping round", async ({ page }) => {
  await openGallery(page, server.origin, "menu");
  await openMenu(page, "menu-hover");
  await expectMenu(page, "menu-hover", { focus: "Run again" });
  for (const [key, focus] of [["d", "Delete run 7"], ["C", "Copy transcript"], ["r", "Run again"], ["r", "Run again"], ["x", "Run again"]]) {
    await page.keyboard.press(key);
    expect((await menuState(page, "menu-hover")).focus, key).toBe(focus);
  }
});

test("Tab closes the menu and focus moves on, and Escape closes it and returns focus to its button", async ({ page }) => {
  await openGallery(page, server.origin, "menu");
  await openMenu(page, "menu-default");
  await expectMenu(page, "menu-default", { open: true, inMenu: true });
  await page.keyboard.press("ArrowDown");
  await pressTab(page);
  // The next stop after the menu's button: the button of the next example.
  await expectMenu(page, "menu-default", { open: false, inMenu: false, focus: "More actions for run 7" });

  await openMenu(page, "menu-default");
  await expectMenu(page, "menu-default", { open: true, inMenu: true });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expectMenu(page, "menu-default", { open: false, focus: "Task actions" });
});

test("an aria-disabled menu item takes focus in its turn and ignores Enter and Space", async ({ page }) => {
  await openGallery(page, server.origin, "menu");
  await page.evaluate(() => {
    const item = document.querySelector('#menu-disabled [aria-disabled="true"]');
    item.addEventListener("click", () => (document.body.dataset.pressed = "yes"));
  });
  await openMenu(page, "menu-disabled");
  await expectMenu(page, "menu-disabled", { focus: "Copy branch name" });
  await page.keyboard.press("ArrowDown");
  expect(await menuState(page, "menu-disabled")).toMatchObject({ focus: "Open pull request (push the branch first)", stops: ["Open pull request (push the branch first)"] });
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => document.body.dataset.pressed ?? "no")).toBe("no");
  expect(await menuState(page, "menu-disabled")).toMatchObject({ open: true, focus: "Open pull request (push the branch first)" });
  await page.keyboard.press("ArrowDown");
  expect((await menuState(page, "menu-disabled")).focus).toBe("Rebase onto main");
});

test("a split button's menu and a context menu take the same keys as the menu", async ({ page }) => {
  await openGallery(page, server.origin, "split-button");
  await openMenu(page, "split-button-open-menu");
  await expectMenu(page, "split-button-open-menu", { open: true, focus: "Run again from the failed step", stops: ["Run again from the failed step"] });
  await page.keyboard.press("ArrowUp");
  expect((await menuState(page, "split-button-open-menu")).focus).toBe("Run again on main");
  await page.keyboard.press("Home");
  await page.keyboard.press("w");
  expect((await menuState(page, "split-button-open-menu")).focus).toBe("Run again from the failed step");
  await pressTab(page);
  await expectMenu(page, "split-button-open-menu", { open: false, inMenu: false });
  expect((await menuState(page, "split-button-open-menu")).focus).not.toBe("More ways to run again");

  await openGallery(page, server.origin, "context-menu");
  await openMenu(page, "context-menu-default-4182");
  await expectMenu(page, "context-menu-default-4182", { open: true, focus: "Run again from the same prompt" });
  await page.keyboard.press("End");
  expect((await menuState(page, "context-menu-default-4182")).focus).toBe("Delete run 4182");
  await page.keyboard.press("ArrowDown");
  expect((await menuState(page, "context-menu-default-4182")).focus).toBe("Run again from the same prompt");
  await page.keyboard.press("Escape");
  await expectMenu(page, "context-menu-default-4182", { open: false, focus: "More actions for run 4182" });
});

const listboxState = (page, label) =>
  page.evaluate((name) => {
    const listbox = [...document.querySelectorAll('[role="listbox"]')].find(
      (element) => (element.getAttribute("aria-label") ?? document.getElementById(element.getAttribute("aria-labelledby"))?.textContent) === name,
    );
    const options = [...listbox.querySelectorAll('[role="option"]')];
    const text = (option) => option.firstChild.textContent.trim();
    return {
      focus: listbox.contains(document.activeElement) ? text(document.activeElement) : null,
      selected: options.filter((option) => option.getAttribute("aria-selected") === "true").map(text),
      stops: options.filter((option) => option.getAttribute("tabindex") === "0").map(text),
    };
  }, label);

test("a listbox moves focus and selects by keyboard, with one option or several", async ({ page }) => {
  await openGallery(page, server.origin, "listbox");
  const single = "Model for this task";
  // Tab enters the listbox at its selected option.
  await page.locator("#listbox-selected-unit").focus();
  await pressTab(page);
  expect(await listboxState(page, single)).toEqual({ focus: "claude-sonnet-4", selected: ["claude-sonnet-4"], stops: ["claude-sonnet-4"] });
  const singleSteps = [
    ["ArrowUp", "claude-opus-4", ["claude-sonnet-4"]],
    ["ArrowUp", "claude-opus-4", ["claude-sonnet-4"]],
    ["Space", "claude-opus-4", ["claude-opus-4"]],
    ["End", "claude-haiku-4", ["claude-opus-4"]],
    ["ArrowDown", "claude-haiku-4", ["claude-opus-4"]],
    ["Enter", "claude-haiku-4", ["claude-haiku-4"]],
    ["Home", "claude-opus-4", ["claude-haiku-4"]],
  ];
  for (const [key, focus, selected] of singleSteps) {
    await page.keyboard.press(key);
    expect(await listboxState(page, single), key).toEqual({ focus, selected, stops: [focus] });
  }

  // A letter goes to the next option that starts with it.
  await page.locator("#listbox-default-main").focus();
  for (const [key, focus] of [["f", "fix/login-timeout"], ["f", "feat/webhook-rate-limit"], ["c", "chore/pg-8-13"], ["m", "main"]]) {
    await page.keyboard.press(key);
    expect((await listboxState(page, "Base branch")).focus, key).toBe(focus);
  }

  // An option with aria-disabled takes focus and is never selected.
  await page.locator("#listbox-disabled-main").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  expect(await listboxState(page, "Branch to merge into")).toEqual({ focus: "release/2026.03", selected: ["main"], stops: ["release/2026.03"] });

  // Several: Space switches one, Shift with an arrow switches the one moved to, Ctrl+A selects all,
  // and the app's own listeners still run and can take a key for themselves.
  const multiple = "Checks that must pass before a merge";
  await page.evaluate(() => {
    const listbox = document.querySelector('[aria-labelledby="listbox-selected-label"]');
    listbox.addEventListener("change", () => (document.body.dataset.changes = String(Number(document.body.dataset.changes ?? 0) + 1)));
    document.getElementById("listbox-selected-lint").addEventListener("click", () => (document.body.dataset.clicked = "lint"));
    document.getElementById("listbox-selected-e2e").addEventListener("keydown", (event) => {
      if (event.key === " ") event.preventDefault();
    });
  });
  await page.locator("#listbox-selected-unit").focus();
  const multipleSteps = [
    ["ArrowDown", "Integration tests", ["Unit tests", "Integration tests", "Type check"]],
    ["Space", "Integration tests", ["Unit tests", "Type check"]],
    ["Shift+ArrowDown", "Lint", ["Unit tests", "Lint", "Type check"]],
    ["Shift+ArrowUp", "Integration tests", ["Unit tests", "Integration tests", "Lint", "Type check"]],
    ["End", "End-to-end tests", ["Unit tests", "Integration tests", "Lint", "Type check"]],
    ["Space", "End-to-end tests", ["Unit tests", "Integration tests", "Lint", "Type check"]],
    ["ControlOrMeta+a", "End-to-end tests", ["Unit tests", "Integration tests", "Lint", "Type check", "End-to-end tests"]],
  ];
  for (const [key, focus, selected] of multipleSteps) {
    await page.keyboard.press(key);
    expect(await listboxState(page, multiple), key).toEqual({ focus, selected, stops: [focus] });
  }
  expect(await page.evaluate(() => document.body.dataset.changes)).toBe("4");
  await page.locator("#listbox-selected-lint").click();
  expect(await listboxState(page, multiple)).toMatchObject({ focus: "Lint", selected: ["Unit tests", "Integration tests", "Type check", "End-to-end tests"], stops: ["Lint"] });
  expect(await page.evaluate(() => document.body.dataset.clicked)).toBe("lint");
});

test("the command palette writes its no-match sentence into a status element that was in the page and shown before", async ({ page }) => {
  await openGallery(page, server.origin, "command-palette");
  const status = '[data-example="closed"] [role="status"]';
  const before = await page.locator(status).evaluate((element) => {
    element.dataset.testMark = "first";
    return { hidden: element.hidden, text: element.textContent, sentence: element.dataset.dsEmpty };
  });
  expect(before).toEqual({ hidden: false, text: "", sentence: "No command matches. Try a verb, such as open, copy or rebase." });
  await page.locator('[data-example="closed"] > button').focus();
  await page.keyboard.press("Control+k");
  await page.keyboard.type("squosh");
  const after = await page.locator(status).evaluate((element) => ({ mark: element.dataset.testMark, hidden: element.hidden, text: element.textContent, count: element.closest("ds-command-palette").querySelectorAll('[role="status"]').length }));
  expect(after).toEqual({ mark: "first", hidden: false, text: before.sentence, count: 1 });
  await expect(page.locator(status)).toBeVisible();
  await page.keyboard.press("Backspace");
  await page.locator('[data-example="closed"] [role="combobox"]').fill("rebase");
  expect(await page.locator(status).evaluate((element) => ({ hidden: element.hidden, text: element.textContent }))).toEqual({ hidden: false, text: "" });
});

test("loading the menu and listbox modules a second time is harmless", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openGallery(page, server.origin, "menu");
  for (const name of ["menu", "listbox"]) {
    await page.addScriptTag({ url: `${server.origin}/behaviors/${name}.js?again`, type: "module" });
    await page.evaluate((module) => import(`/behaviors/${module}.js?once-more`), name);
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => [customElements.get("ds-menu")?.name, customElements.get("ds-listbox")?.name])).toEqual(["DsMenu", "DsListbox"]);
  await openMenu(page, "menu-plain");
  await expectMenu(page, "menu-plain", { focus: "Run again" });
  await page.keyboard.press("ArrowDown");
  expect((await menuState(page, "menu-plain")).focus).toBe("Copy transcript");
});
