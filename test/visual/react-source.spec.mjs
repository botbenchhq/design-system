import { rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { build } from "esbuild";
import { expect, test } from "@playwright/test";

import { repoRoot, tempDir } from "../helpers.mjs";

const dist = join(repoRoot, "dist");
const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".js": "text/javascript" };

// The transcript is 300px tall. The height is the test's: a real screen takes it from its layout.
const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"><title>Run 4182</title>
    <link rel="stylesheet" href="/design-system.css">
    <style>#scroller { height: 300px; overflow: auto; }</style>
  </head>
  <body><div id="root"></div><script src="/app.js"></script></body>
</html>`;

let server;
let origin;
let built;

test.beforeAll(async () => {
  built = tempDir();
  // A development build, so StrictMode runs every effect twice on mount.
  await build({
    entryPoints: [join(repoRoot, "test", "fixtures", "react-source", "app.tsx")],
    bundle: true,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    outfile: join(built, "app.js"),
    logLevel: "silent",
  });
  server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    if (path === "/") return response.writeHead(200, { "content-type": "text/html" }).end(PAGE);
    if (path === "/favicon.ico") return response.writeHead(204).end();
    try {
      const body = await readFile(path === "/app.js" ? join(built, "app.js") : join(dist, path));
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

async function openApp(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(origin);
  await page.locator("#scroller").waitFor();
  await page.evaluate(() => window.addRows(30));
  await page.locator("textarea").focus();
  return errors;
}

const state = (page) =>
  page.evaluate(() => {
    const scroller = document.querySelector("#scroller");
    const jump = document.querySelector(".ds-jump-to-latest");
    return {
      fromBottom: Math.round(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight),
      jumpHidden: jump.hidden,
      count: jump.querySelector(".ds-jump-to-latest__count").textContent,
      focus: document.activeElement.tagName,
    };
  });

const scrollTo = (page, to) =>
  page.evaluate((position) => {
    const scroller = document.querySelector("#scroller");
    scroller.scrollTop = position === "bottom" ? scroller.scrollHeight : position;
  }, to);

const frames = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

test.describe("react-source", () => {
  test("the busy button ignores click and Enter while busy, says what is happening, and returns after", async ({ page }) => {
    const errors = await openApp(page);
    const button = page.locator("form .ds-button");
    await expect(button).toHaveText("Send prompt");
    await expect(button).toHaveAttribute("type", "submit");
    await expect(button).not.toHaveAttribute("aria-busy");
    await button.click();
    expect(await page.evaluate(() => window.sent)).toBe(1);

    await page.evaluate(() => window.setBusy(true));
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toHaveText("Sending prompt");
    await expect(page.getByRole("button", { name: "Sending prompt" })).toBeVisible();
    // It stays enabled and focusable, so focus is not dropped while the action runs.
    await expect(button).toBeEnabled();
    await button.click();
    await button.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(await page.evaluate(() => window.sent)).toBe(1);

    await page.evaluate(() => window.setBusy(false));
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(button).toHaveText("Send prompt");
    await button.focus();
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => window.sent)).toBe(2);
    expect(errors).toEqual([]);
  });

  test("the transcript hook follows the bottom as rows are added through React state, and never moves focus", async ({ page }) => {
    const errors = await openApp(page);
    await expect.poll(() => state(page)).toEqual({ fromBottom: 0, jumpHidden: true, count: "", focus: "TEXTAREA" });
    expect(await page.evaluate(() => document.querySelector("#scroller").scrollTop)).toBeGreaterThan(300);
    for (const count of [1, 3, 10]) {
      await page.evaluate((rows) => window.addRows(rows), count);
      await expect.poll(async () => (await state(page)).fromBottom, `after ${count} more`).toBe(0);
      expect(await state(page)).toMatchObject({ jumpHidden: true, focus: "TEXTAREA" });
    }
    // A row that grows in place, as a streamed reply does, is followed too.
    await page.evaluate(() => document.querySelector('[role="log"] li:last-child').append("More text. ".repeat(40)));
    await expect.poll(async () => (await state(page)).fromBottom).toBe(0);
    // Within 60px of the bottom still counts as at the bottom.
    await page.evaluate(() => { document.querySelector("#scroller").scrollTop -= 40; });
    await page.evaluate(() => window.addRows(2));
    await expect.poll(async () => (await state(page)).fromBottom).toBe(0);
    expect((await state(page)).jumpHidden).toBe(true);

    // A scroll event does not render: the decision is made outside React state until it changes.
    await frames(page);
    const renders = await page.evaluate(() => window.renders);
    for (let step = 0; step < 10; step++) {
      await page.evaluate(() => { document.querySelector("#scroller").scrollTop -= 3; });
      await frames(page);
    }
    expect(await page.evaluate(() => window.renders)).toBe(renders);
    expect(errors).toEqual([]);
  });

  test("the transcript hook stops following when the reader scrolls up, counts the rows added since, and jumping resumes it", async ({ page }) => {
    const errors = await openApp(page);
    await expect.poll(async () => (await state(page)).fromBottom).toBe(0);

    await scrollTo(page, 200);
    await page.waitForFunction(() => document.querySelector("#scroller").scrollTop === 200);
    await frames(page);
    await page.evaluate(() => window.addRows(3));
    await expect.poll(() => state(page)).toMatchObject({ jumpHidden: false, count: "3 new steps", focus: "TEXTAREA" });
    expect(await page.evaluate(() => document.querySelector("#scroller").scrollTop)).toBe(200);
    await page.evaluate(() => window.addRows(2));
    await expect.poll(async () => (await state(page)).count).toBe("5 new steps");
    expect(await page.evaluate(() => document.querySelector("#scroller").scrollTop)).toBe(200);
    await expect(page.getByRole("button", { name: "5 new steps Jump to latest" })).toBeVisible();

    // A press with the pointer jumps, hides the control and leaves focus in the composer.
    await page.locator(".ds-jump-to-latest__button").click();
    await expect.poll(() => state(page)).toMatchObject({ fromBottom: 0, jumpHidden: true, focus: "TEXTAREA" });
    await page.evaluate(() => window.addRows(4));
    await expect.poll(async () => (await state(page)).fromBottom).toBe(0);
    expect((await state(page)).jumpHidden).toBe(true);

    // Scrolling back to the bottom by hand resumes it as well, and the count starts again.
    await scrollTo(page, 0);
    await frames(page);
    await page.evaluate(() => window.addRows(1));
    await expect.poll(() => state(page)).toMatchObject({ jumpHidden: false, count: "1 new step" });
    await scrollTo(page, "bottom");
    await expect.poll(async () => (await state(page)).jumpHidden).toBe(true);

    // Rows that arrive before the scroll event of the reader leaving: scrollTop decides, not a stored flag.
    await page.evaluate(() => {
      document.querySelector("#scroller").scrollTop = 100;
      window.addRows(2);
    });
    await expect.poll(() => state(page)).toMatchObject({ jumpHidden: false, count: "2 new steps" });
    expect(await page.evaluate(() => document.querySelector("#scroller").scrollTop)).toBe(100);

    // From the keyboard the button holds focus, so it stays until focus leaves it.
    await page.locator(".ds-jump-to-latest__button").focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await state(page)).fromBottom).toBe(0);
    expect(await state(page)).toMatchObject({ jumpHidden: false, focus: "BUTTON" });
    await page.locator("textarea").focus();
    await expect.poll(async () => (await state(page)).jumpHidden).toBe(true);
    expect(errors).toEqual([]);
  });

  test("the rendered check finds nothing on the screen built from the React source", async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => window.setBusy(true));
    await page.addScriptTag({ path: join(dist, "check-dom.js") });
    expect(await page.evaluate(() => dsCheckDom())).toEqual([]);
  });
});
