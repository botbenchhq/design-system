// Reflow at 320px, the width of a phone at 400% zoom: no gallery page scrolls sideways.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { dist, openGallery, serveDist } from "./serve.mjs";

const index = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
const pages = [...index.components, ...index.patterns].map((folder) => folder.name);
const NARROW = 320;
const TOUCH = 44;

let server;
test.beforeAll(async () => {
  server = await serveDist();
});
test.afterAll(() => server.close());

// What sticks out past the right edge of the screen and is not clipped by a box that scrolls or clips it,
// deepest first, so a failure names the element at fault.
const overflow = (page) =>
  page.evaluate(() => {
    const root = document.documentElement;
    const edge = root.clientWidth;
    const clipped = (element) => {
      for (let box = element.parentElement; box && box !== document.body; box = box.parentElement) {
        if (getComputedStyle(box).overflowX !== "visible") return true;
      }
      return false;
    };
    const past = [...document.querySelectorAll("body *")]
      .filter((element) => element.getBoundingClientRect().right > edge + 0.5 && element.checkVisibility() && !clipped(element))
      .filter((element, _, all) => !all.some((other) => other !== element && element.contains(other)))
      .slice(0, 5)
      .map((element) => `${element.closest("[data-example]")?.dataset.example ?? "page"}: ${element.outerHTML.slice(0, 100)}`);
    return { scroll: root.scrollWidth - root.clientWidth, past };
  });

// A screen this narrow is a desktop window zoomed in, with a fine pointer, or a phone zoomed in, with a coarse one,
// where every control is the touch size. Playwright's hasTouch makes (pointer: coarse) match in each engine.
for (const pointer of ["fine", "coarse"]) {
  test.describe(() => {
    test.use({ hasTouch: pointer === "coarse" });

    for (const name of pages) {
      test(`${name} at ${NARROW}px with a ${pointer} pointer: the page has no horizontal scroll`, async ({ page }) => {
        await openGallery(page, server.origin, name, { width: NARROW });
        expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(pointer === "coarse");
        const { scroll, past } = await overflow(page);
        expect(scroll, past.join("\n")).toBe(0);
      });
    }
  });
}

test.describe(() => {
  test.use({ hasTouch: true });

  test(`the calendar at ${NARROW}px with a coarse pointer shows all seven columns and both month buttons, with days still 44px tall`, async ({ page }) => {
    await openGallery(page, server.origin, "calendar", { width: NARROW });
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);
    const calendar = page.locator('[data-example="default"] .ds-calendar');
    const layout = await calendar.evaluate((element) => {
      const edge = document.documentElement.clientWidth;
      const headers = [...element.querySelectorAll("thead th")].map((th) => th.getBoundingClientRect());
      const buttons = [...element.querySelectorAll(".ds-calendar__header button")].map((button) => button.getBoundingClientRect());
      const days = [...element.querySelectorAll(".ds-calendar__day")].map((day) => day.getBoundingClientRect().height);
      return { edge, columns: headers.length, lastColumn: headers.at(-1).right, buttons: buttons.map((box) => [box.left, box.right]), shortest: Math.min(...days) };
    });
    expect(layout.columns).toBe(7);
    expect(layout.lastColumn).toBeLessThanOrEqual(layout.edge);
    expect(layout.buttons).toHaveLength(2);
    for (const [left, right] of layout.buttons) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(layout.edge);
    }
    expect(layout.shortest).toBeGreaterThanOrEqual(TOUCH);
  });
});

test(`an open split-button menu stays inside a ${NARROW}px screen, drawn open in the gallery and opened on a page of its own`, async ({ page }) => {
  await openGallery(page, server.origin, "split-button", { width: NARROW });
  const drawn = await page.locator("#split-button-open-menu").evaluate((menu) => ({ open: menu.matches(":popover-open"), ...menu.getBoundingClientRect().toJSON() }));
  expect(drawn.open).toBe(true);
  expect(drawn.left).toBeGreaterThanOrEqual(0);
  expect(drawn.right).toBeLessThanOrEqual(NARROW);

  // The markup an app copies, on a page with nothing of the gallery's around it.
  const example = index.components.find((component) => component.name === "split-button").examples.find((item) => item.id === "with-icon");
  await page.evaluate((markup) => {
    document.body.innerHTML = `<main class="ds-container">${markup}</main>`;
  }, example.markup);
  await page.locator(".ds-split-button__toggle").click();
  const menu = page.locator('[role="menu"]');
  expect(await menu.evaluate((element) => element.matches(":popover-open"))).toBe(true);
  const box = await menu.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(NARROW);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
