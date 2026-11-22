// Dense views at desktop width: a table of eight agents, the wide container, and long text in a table.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { dist, openGallery, serveDist } from "./serve.mjs";

const index = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
const markupOf = (name, id) => index.components.find((component) => component.name === name).examples.find((example) => example.id === id).markup;
const AGENTS = markupOf("data-table", "agents");
// A path with no place to break, as a tool puts one in a cell.
const UNBROKEN = `/srv/${"a".repeat(80 - "/srv/".length)}`;

let server;
test.beforeAll(async () => {
  server = await serveDist();
});
test.afterAll(() => server.close());

// A page holding only the markup an app copies, in the container given. The gallery's rules do not reach it.
async function openBare(page, { width, container = "ds-container", markup = AGENTS }) {
  await openGallery(page, server.origin, "data-table", { width });
  await page.evaluate(({ className, html }) => {
    document.body.innerHTML = `<main class="${className}">${html}</main>`;
  }, { className: container, html: markup });
}

// Every word in the elements that is drawn on more than one line, and every element drawn on more than one line.
const breaks = (page, selector) =>
  page.evaluate((cells) => {
    const lines = (range) => new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size;
    const split = [];
    const wrapped = [];
    for (const element of document.querySelectorAll(cells)) {
      const whole = document.createRange();
      whole.selectNodeContents(element);
      if (lines(whole) > 1) wrapped.push(element.textContent.trim());
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const match of node.textContent.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          if (lines(range) > 1) split.push(match[0]);
        }
      }
    }
    return { split, wrapped, count: document.querySelectorAll(cells).length };
  }, selector);

const pageScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("eight agents with names up to 30 characters at 1280px: no name breaks inside a word, and the table takes the wide container's width", async ({ page }) => {
  await openBare(page, { width: 1280, container: "ds-container ds-container--wide" });
  const names = await breaks(page, ".ds-avatar__name");
  expect(names.count).toBe(8);
  expect(Math.max(...(await page.locator(".ds-avatar__name").allTextContents()).map((name) => name.length))).toBe(30);
  expect(names.split).toEqual([]);
  expect(names.wrapped).toEqual([]);
  expect((await breaks(page, ".ds-data-table td")).split).toEqual([]);
  const widths = await page.evaluate(() => {
    const main = document.querySelector("main");
    const style = getComputedStyle(main);
    return { table: document.querySelector("table").getBoundingClientRect().width, content: main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) };
  });
  expect(widths.content).toBeGreaterThan(1000);
  expect(Math.abs(widths.table - widths.content)).toBeLessThan(1);
  expect(await pageScroll(page)).toBe(0);
});

test("the eight-agent table at 390px is a stack of blocks, each value with its column label beside it", async ({ page }) => {
  await openBare(page, { width: 390 });
  const layout = await page.evaluate(() => {
    const cells = [...document.querySelectorAll("tbody td[data-label]")];
    return {
      header: getComputedStyle(document.querySelector("thead")).display,
      cells: cells.length,
      beside: cells.filter((cell) => {
        const style = getComputedStyle(cell);
        const label = getComputedStyle(cell, "::before").content;
        const value = cell.lastElementChild ?? cell;
        return style.display === "grid" && label === `"${cell.dataset.label}"` && style.gridTemplateColumns.split(" ").length === 2 && (value === cell || value.getBoundingClientRect().left > cell.getBoundingClientRect().left + 40);
      }).length,
    };
  });
  expect(layout).toEqual({ header: "none", cells: 40, beside: 40 });
  expect((await breaks(page, ".ds-avatar__name")).split).toEqual([]);
  expect(await pageScroll(page)).toBe(0);
});

test("an unbreakable 80-character string scrolls the table inside its wrapper, and the page does not scroll", async ({ page }) => {
  for (const width of [800, 1280]) {
    await openBare(page, { width });
    await page.evaluate((text) => {
      document.querySelector('tbody td[data-label="Working on"]').textContent = text;
    }, UNBROKEN);
    const state = await page.evaluate(() => {
      const wrapper = document.querySelector(".ds-data-table__scroll");
      return { inside: wrapper.scrollWidth - wrapper.clientWidth, overflow: getComputedStyle(wrapper).overflowX };
    });
    expect(state.overflow, `${width}`).toBe("auto");
    expect(state.inside, `${width}`).toBeGreaterThan(0);
    expect((await breaks(page, 'tbody td[data-label="Working on"]')).split, `${width}`).toEqual([]);
    expect(await pageScroll(page), `${width}`).toBe(0);
  }

  // On a phone the row is a block, and the string breaks inside its cell.
  await openBare(page, { width: 390 });
  await page.evaluate((text) => {
    document.querySelector('tbody td[data-label="Working on"]').textContent = text;
  }, UNBROKEN);
  expect(await pageScroll(page)).toBe(0);
});

test("the wide container is as wide as its token at 1280px, and as wide as the standard container at 390px", async ({ page }) => {
  const measure = () =>
    page.evaluate(() => {
      document.body.innerHTML = '<main class="ds-container" id="standard"></main><main class="ds-container ds-container--wide" id="wide"></main>';
      const token = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ds-size-wide"));
      const width = (id) => document.getElementById(id).getBoundingClientRect().width;
      return { token, standard: width("standard"), wide: width("wide") };
    });
  await openGallery(page, server.origin, "data-table", { width: 1280 });
  const desktop = await measure();
  expect(desktop.token).toBe(1200);
  expect(desktop.wide).toBe(desktop.token);
  expect(desktop.standard).toBe(720);
  await openGallery(page, server.origin, "data-table", { width: 390 });
  const phone = await measure();
  expect(phone.wide).toBe(phone.standard);
  expect(phone.wide).toBe(390);
});

test("the app shell's table view at 1280px gives the main column the wide container, and no agent's name breaks inside a word", async ({ page }) => {
  await openGallery(page, server.origin, "app-shell", { width: 1280 });
  const example = page.locator('[data-example="table"]');
  const main = example.locator(".ds-app-shell__main");
  await expect(main).toHaveClass(/\bds-container--wide\b/);
  expect((await main.boundingBox()).width).toBeGreaterThan(720);
  // Beside the sidebar a long name may take two lines, broken between its words.
  expect(await breaks(page, '[data-example="table"] .ds-avatar__name')).toMatchObject({ split: [], count: 8 });
  expect(await pageScroll(page)).toBe(0);
});
