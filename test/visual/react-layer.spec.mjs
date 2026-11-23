// The dialog, sheet, menu hook, approval card and icon-only busy buttons of the React source, rendered by React
// under StrictMode and driven by keyboard, with axe and the structural rules on the rendered page. The menu's keys
// mirror test/visual/menu.spec.mjs, which drives behaviors/menu.js.
import { rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { build } from "esbuild";
import { expect, test } from "@playwright/test";

import { repoRoot, tempDir } from "../helpers.mjs";

const dist = join(repoRoot, "dist");
const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".js": "text/javascript" };
const PAGE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Task 41</title><link rel="stylesheet" href="/design-system.css"></head>
  <body><div id="root"></div><script src="/layer.js"></script></body>
</html>`;

let server;
let origin;
let built;

test.beforeAll(async () => {
  built = tempDir();
  // A development build, so StrictMode runs every effect twice on mount.
  await build({
    entryPoints: [join(repoRoot, "test", "fixtures", "react-source", "layer.tsx")],
    bundle: true,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    outfile: join(built, "layer.js"),
    logLevel: "silent",
  });
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end(PAGE);
    if (path === "/favicon.ico") return response.writeHead(204).end();
    try {
      const body = await readFile(path === "/layer.js" ? join(built, "layer.js") : join(dist, path));
      response.writeHead(200, { "content-type": TYPES[extname(path)] }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(() => {
  server.close();
  rmSync(built, { recursive: true, force: true });
});

async function openScreen(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(origin);
  await page.locator("h1").waitFor();
  return errors;
}

const read = (page, name) => page.evaluate((key) => window[key], name);

const focused = (page) =>
  page.evaluate(() => {
    const active = document.activeElement;
    return active.getAttribute("aria-label") ?? active.textContent.trim();
  });

// What a screen reader is told about the open dialog, and where focus is.
const dialogState = (page) =>
  page.evaluate(() => {
    const open = [...document.querySelectorAll("dialog")].filter((dialog) => dialog.open);
    const dialog = open[0];
    const text = (ids) => (ids ?? "").split(" ").filter(Boolean).map((id) => document.getElementById(id)?.textContent.trim()).join(" ");
    return {
      open: open.length,
      modal: dialog?.matches(":modal") ?? false,
      role: dialog?.getAttribute("role") ?? null,
      name: text(dialog?.getAttribute("aria-labelledby")),
      description: text(dialog?.getAttribute("aria-describedby")).slice(0, 40),
      inside: dialog?.contains(document.activeElement) ?? false,
      focus: (document.activeElement.getAttribute("aria-label") ?? document.activeElement.textContent.trim()) || document.activeElement.id,
    };
  });

const check = async (page) => {
  await page.addScriptTag({ path: join(dist, "check-dom.js") });
  expect(await page.evaluate(() => dsCheckDom())).toEqual([]);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target).join(", ")}`)).toEqual([]);
};

test.describe("react-layer", () => {
  // The close event arrives a task after the dialog closes, so the test waits for what the app was told.
  const closedWith = (page, closes) => expect.poll(() => read(page, "closes")).toEqual(closes);

  test("the dialog opens from its prop, is named by its title, closes on Escape and on a footer button, and gives focus back", async ({ page }) => {
    const errors = await openScreen(page);
    await page.getByRole("button", { name: "Rename branch" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => dialogState(page)).toMatchObject({ open: 1, modal: true, role: null, name: "Rename the branch", inside: true, focus: "branch-name" });
    await check(page);
    await page.keyboard.press("Escape");
    await closedWith(page, ["rename:"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Rename branch" });

    // Enter in the field takes the primary action, and the dialog closes with its value.
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).focus).toBe("branch-name");
    await page.keyboard.press("Enter");
    await closedWith(page, ["rename:", "rename:rename"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Rename branch" });

    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).inside).toBe(true);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    expect(await focused(page)).toBe("Cancel");
    await page.keyboard.press("Enter");
    await closedWith(page, ["rename:", "rename:rename", "rename:cancel"]);
    // Escape after a button closed it last time reads as Escape, not as that button again.
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).inside).toBe(true);
    await page.keyboard.press("Escape");
    await closedWith(page, ["rename:", "rename:rename", "rename:cancel", "rename:"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Rename branch" });
    expect(errors).toEqual([]);
  });

  test("a dialog the app closes, or takes out of the page while open, calls nothing and gives focus back", async ({ page }) => {
    const errors = await openScreen(page);
    await page.getByRole("button", { name: "Rename branch" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).inside).toBe(true);
    await page.evaluate(() => window.setOpen(null));
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Rename branch" });

    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).inside).toBe(true);
    await page.evaluate(() => window.setShown(false));
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Rename branch" });
    // The page behind is no longer inert: the keyboard reaches the next button.
    await page.keyboard.press("Tab");
    expect(await focused(page)).toBe("Delete workspace");
    // Put back while the app still holds it open, it opens again.
    await page.evaluate(() => window.setShown(true));
    await expect.poll(async () => (await dialogState(page)).name).toBe("Rename the branch");
    await page.evaluate(() => window.setOpen(null));
    await page.waitForTimeout(100);
    expect(await read(page, "closes")).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("the confirm dialog is an alert dialog described by its body, with focus on Cancel first", async ({ page }) => {
    const errors = await openScreen(page);
    await page.getByRole("button", { name: "Delete workspace" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => dialogState(page)).toMatchObject({
      open: 1,
      role: "alertdialog",
      name: "Delete the workspace api-refactor?",
      description: "This removes the workspace from this mac",
      focus: "Cancel",
    });
    await check(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await closedWith(page, ["delete:delete"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Delete workspace" });
    expect(errors).toEqual([]);
  });

  test("the sheet closes from its Close button, its footer and Escape, with the value of each", async ({ page }) => {
    const errors = await openScreen(page);
    await page.getByRole("button", { name: "Filter runs" }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => dialogState(page)).toMatchObject({ open: 1, modal: true, name: "Filter runs", inside: true, focus: "Close filters" });
    await check(page);
    await page.keyboard.press("Enter");
    await closedWith(page, ["filters:close"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Filter runs" });
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).inside).toBe(true);
    await page.getByRole("button", { name: "Apply filters" }).focus();
    await page.keyboard.press("Enter");
    await closedWith(page, ["filters:close", "filters:apply"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Filter runs" });
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await dialogState(page)).inside).toBe(true);
    await page.keyboard.press("Escape");
    await closedWith(page, ["filters:close", "filters:apply", "filters:"]);
    expect(await dialogState(page)).toMatchObject({ open: 0, focus: "Filter runs" });
    expect(errors).toEqual([]);
  });

  const menuState = (page) =>
    page.evaluate(() => {
      const menu = document.querySelector('[role="menu"]');
      const items = [...menu.querySelectorAll('[role="menuitem"]')];
      const active = document.activeElement;
      return {
        open: menu.matches(":popover-open"),
        inMenu: menu.contains(active),
        focus: active.getAttribute("aria-label") ?? active.textContent.trim(),
        stops: items.filter((item) => item.getAttribute("tabindex") === "0").map((item) => item.textContent.trim()),
        others: items.filter((item) => item.getAttribute("tabindex") === "-1").length,
      };
    });
  const openMenu = async (page) => {
    await page.getByRole("button", { name: "Task actions" }).focus();
    await page.keyboard.press("Enter");
  };

  test("in the menu Down, Up, Home and End move focus and wrap, with one item in the tab order, and a letter finds an item", async ({ page }) => {
    const errors = await openScreen(page);
    await openMenu(page);
    await expect.poll(() => menuState(page)).toMatchObject({ open: true, focus: "Copy branch name", stops: ["Copy branch name"], others: 4 });
    await check(page);
    const steps = [
      ["ArrowDown", "Open pull request (push the branch first)"],
      ["ArrowDown", "Rebase onto main"],
      ["End", "Delete task 41"],
      ["ArrowDown", "Copy branch name"],
      ["ArrowUp", "Delete task 41"],
      ["Home", "Copy branch name"],
      ["d", "Delete task 41"],
      ["o", "Open pull request (push the branch first)"],
      ["o", "Open a terminal in the worktree"],
      ["x", "Open a terminal in the worktree"],
    ];
    for (const [key, focus] of steps) {
      await page.keyboard.press(key);
      expect(await menuState(page), key).toMatchObject({ open: true, focus, stops: [focus], others: 4 });
    }
    // An item's action runs, and closing the menu gives focus back to its button.
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await expect.poll(() => menuState(page)).toMatchObject({ open: false, focus: "Task actions" });
    expect(await read(page, "chosen")).toEqual(["copy"]);
    expect(errors).toEqual([]);
  });

  test("Tab closes the menu and focus moves on, Escape gives focus back, and an aria-disabled item ignores Enter and Space", async ({ page }) => {
    const errors = await openScreen(page);
    await openMenu(page);
    await expect.poll(() => menuState(page)).toMatchObject({ open: true, inMenu: true });
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.keyboard.press(" ");
    expect(await menuState(page)).toMatchObject({ open: true, focus: "Open pull request (push the branch first)" });
    expect(await read(page, "chosen")).toEqual([]);
    await page.keyboard.press("Tab");
    await expect.poll(() => menuState(page)).toMatchObject({ open: false, inMenu: false, focus: "After the menu" });

    await openMenu(page);
    await expect.poll(() => menuState(page)).toMatchObject({ open: true, inMenu: true });
    await page.keyboard.press("Escape");
    await expect.poll(() => menuState(page)).toMatchObject({ open: false, focus: "Task actions" });

    // Opened from the app's own code, as from a right-click, it moves focus to the first item the same way.
    await page.getByRole("button", { name: "After the menu" }).click({ button: "right" });
    await expect.poll(() => menuState(page)).toMatchObject({ open: true, focus: "Copy branch name" });
    expect(errors).toEqual([]);
  });

  test("the approval card sends the answer with a busy button that keeps focus, disables the other, and Decline sends the note", async ({ page }) => {
    const errors = await openScreen(page);
    const card = page.locator(".ds-approval");
    await expect(card).toHaveClass("ds-approval ds-approval--elevated");
    await expect(page.getByRole("article", { name: "Claude Code asks to run a command" })).toBeVisible();
    // A character that cannot be seen is written out.
    await expect(card.locator(".ds-approval__command")).toHaveText("rm -rf ../shared-config/.cache\\u{200b}");
    const allow = card.getByRole("button", { name: "Allow" });
    const decline = card.getByRole("button", { name: "Decline" });
    await expect(allow).toHaveClass("ds-button ds-button--primary");
    await expect(allow).toHaveAttribute("data-ds-critical", "");
    await allow.focus();
    await page.keyboard.press("Enter");
    expect(await read(page, "answers")).toEqual(["allow"]);

    await page.evaluate(() => window.setSending("allow"));
    await expect(card.locator(".ds-approval__actions .ds-button").first()).toHaveText("Allowing");
    await expect(card.getByRole("button", { name: "Allowing" })).toHaveAttribute("aria-busy", "true");
    await expect(card.getByRole("button", { name: "Decline" })).toBeDisabled();
    expect(await focused(page)).toBe("Allowing");
    await page.keyboard.press("Enter");
    await page.keyboard.press(" ");
    expect(await read(page, "answers")).toEqual(["allow"]);

    await page.evaluate(() => {
      window.setSending(null);
      window.setError("Your answer was not sent: the server could not be reached. Nothing was allowed.");
    });
    await expect(card.getByRole("alert")).toHaveText(/Nothing was allowed/);
    await card.locator(".ds-approval__summary").click();
    await card.getByLabel("Note to the agent").fill("Clear web/.cache only.");
    await decline.focus();
    await page.keyboard.press("Enter");
    expect(await read(page, "answers")).toEqual(["allow", "decline:Clear web/.cache only."]);
    await check(page);
    expect(errors).toEqual([]);
  });

  test("an icon-only toggle keeps its name while busy, and an icon-only action takes busyLabel as its name with no words shown", async ({ page }) => {
    const errors = await openScreen(page);
    const dictate = page.getByRole("button", { name: "Dictate" });
    await expect(dictate).toHaveClass("ds-button ds-button--quiet ds-icon-button");
    await expect(dictate).toHaveAttribute("aria-pressed", "false");
    await dictate.focus();
    await page.keyboard.press("Enter");
    await expect(dictate).toHaveAttribute("aria-pressed", "true");

    await page.evaluate(() => window.setTranscribing(true));
    await expect(dictate).toHaveAttribute("aria-busy", "true");
    await expect(dictate).toHaveAttribute("aria-label", "Dictate");
    await expect(dictate).toHaveText("");
    await page.keyboard.press("Enter");
    await page.keyboard.press(" ");
    expect(await read(page, "dictated")).toBe(1);
    expect(await focused(page)).toBe("Dictate");

    const copying = page.getByRole("button", { name: "Copying branch name" });
    await expect(copying).toHaveAttribute("aria-busy", "true");
    await expect(copying).toHaveText("");
    await copying.click();
    expect(await read(page, "copied")).toBe(0);
    await check(page);

    await page.evaluate(() => window.setTranscribing(false));
    await expect(dictate).not.toHaveAttribute("aria-busy");
    await expect(page.getByRole("button", { name: "Copy branch name" })).not.toHaveAttribute("aria-busy");
    await dictate.focus();
    await page.keyboard.press("Enter");
    expect(await read(page, "dictated")).toBe(2);
    expect(errors).toEqual([]);
  });

  test("axe and the structural rules find nothing on the screen with everything closed", async ({ page }) => {
    await openScreen(page);
    await check(page);
  });
});
