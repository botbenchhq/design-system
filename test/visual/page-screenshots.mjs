// The screenshot of every gallery page at one width, compared with the committed file in screenshots/.
// screenshots-390.spec.mjs and screenshots-1280.spec.mjs each call this once, because the browser is started
// differently for the two widths and a spec file has one way to start it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { readPng, runHeight } from "./png.mjs";
import { dist, openGallery, serveDist } from "./serve.mjs";

const screenshots = fileURLToPath(new URL("./screenshots", import.meta.url));
const index = JSON.parse(readFileSync(join(dist, "components.json"), "utf8"));
// Every folder with a gallery page: the components, then the page patterns.
const pages = ["index", ...index.components.map((component) => component.name), ...index.patterns.map((pattern) => pattern.name)];
const THEMES = ["light", "dark"];
const DO = "[data-example]:not([data-dont])";
const INTERACTIVE = 'button, a[class], input, select, textarea, summary, [role="button"], [tabindex]';

// The pages shown again under the Botbench theme, in both modes at both widths. The rest of the matrix is the default theme's.
export const BRAND = "botbench";
export const BRANDED = ["agent-run", "app-shell", "approval", "badge", "button", "tool-call", "run-timeline", "data-table", "dialog", "alert", "diff", "review-decision", "log-viewer", "presence"];
const brandSummary = JSON.parse(readFileSync(join(dist, "themes", `${BRAND}.json`), "utf8"));

// A screen 390px wide is a phone, which has a coarse pointer. 1280px has a fine one.
const COARSE = { 390: true, 1280: false };
// The height a control of default size is drawn at, by width: what a screenshot at that width must show.
const CONTROL = { 390: 44, 1280: 40 };

// Playwright's hasTouch makes (pointer: coarse) match, and every other test at 390px uses it. But Chrome takes a
// full-page screenshot with that emulation switched off: the page is laid out again for the capture with a fine
// pointer, so a 390px baseline taken that way shows mouse-sized controls while every measurement around it sees
// touch-sized ones. A pointer type given to the browser itself survives the capture. So for the phone width Chrome
// is started with a coarse primary pointer and no hover, as a phone has, and hasTouch is kept for the touch events.
// Only Chrome takes screenshots, so only Chrome is ever started this way.
const COARSE_CHROME = { args: ["--blink-settings=primaryPointerType=2,availablePointerTypes=2,primaryHoverType=1,availableHoverTypes=1"] };

// A state the page cannot hold by itself is forced on the controls of its example, so the screenshot shows it.
const FORCED = { hover: ["hover"], active: ["hover", "active"], "focus-visible": ["focus-visible"], focus: ["focus", "focus-visible"] };

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

const coarsePointer = (page) => page.evaluate(() => matchMedia("(pointer: coarse)").matches);

// Compares the whole page with its committed screenshot. On the button page it then measures the committed file
// itself: the fill of the first primary button runs as many pixels down as a control is tall at this width, 44 on
// a coarse pointer and 40 on a fine one. A baseline taken at the other pointer's sizes fails here, whatever the
// page measures.
async function expectPageScreenshot(page, file, width) {
  expect(await coarsePointer(page)).toBe(COARSE[width]);
  await expect(page).toHaveScreenshot(file, { fullPage: true });
  if (!/^button-(?:390|1280)-/.test(file)) return;
  const box = await page.locator(`${DO} .ds-button--primary`).first().evaluate((button) => {
    const rect = button.getBoundingClientRect();
    return { x: Math.round(rect.left + scrollX), y: Math.round(rect.top + scrollY), height: rect.height };
  });
  expect(box.height, "the button on the page").toBe(CONTROL[width]);
  const image = readPng(readFileSync(join(screenshots, file)));
  // 12px in from the leading edge: past the rounded corner and before the label.
  expect(runHeight(image, box.x + 12, box.y + Math.round(box.height / 2)), `the primary button in ${file}`).toBe(CONTROL[width]);
}

export function definePageScreenshots(width) {
  test.use({ hasTouch: COARSE[width], ...(COARSE[width] ? { launchOptions: COARSE_CHROME } : {}) });

  let server;
  test.beforeAll(async () => {
    server = await serveDist();
  });
  test.afterAll(() => server.close());

  test(`a full-page screenshot at ${width}px is drawn with a ${COARSE[width] ? "coarse" : "fine"} pointer, as the page is measured`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // Taller than the screen, so the capture is of more than the viewport. The box is 44px and red on a coarse pointer, 40px and black on a fine one.
    await page.setContent("<!doctype html><style>body { margin: 0; } div { width: 100px; height: 40px; background: #000000; } @media (pointer: coarse) { div { height: 44px; background: #FF0000; } } main { height: 3000px; }</style><div></div><main></main>");
    expect(await coarsePointer(page)).toBe(COARSE[width]);
    const image = readPng(await page.screenshot({ fullPage: true }));
    expect(image.height).toBeGreaterThan(3000);
    expect([image.at(50, 20), runHeight(image, 50, 20)]).toEqual(COARSE[width] ? ["#FF0000", 44] : ["#000000", 40]);
  });

  for (const name of pages) {
    for (const theme of THEMES) {
      test(`${name} at ${width}px in ${theme}: the page matches its committed screenshot`, async ({ page }) => {
        await openGallery(page, server.origin, name, { width, theme });
        expect(await page.locator("html").getAttribute("data-theme")).toBe(theme === "dark" ? "dark" : null);
        await forceStates(page);
        await expectPageScreenshot(page, `${name}-${width}-${theme}.png`, width);
      });
    }
  }

  for (const name of ["index", ...BRANDED]) {
    for (const theme of THEMES) {
      test(`${name} at ${width}px in ${theme} under the ${BRAND} theme: the page matches its committed screenshot`, async ({ page }) => {
        await openGallery(page, server.origin, name, { width, theme, brand: BRAND });
        expect(await page.locator("html").getAttribute("data-theme")).toBe(theme);
        const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ds-color-surface").trim());
        expect(background).toBe(brandSummary.themeColor[theme]);
        await expect(page.locator('[data-gallery="bar"] nav[aria-label="Theme"] a[aria-current="true"]')).toHaveText("Botbench");
        await forceStates(page);
        await expectPageScreenshot(page, `${name}-${width}-${theme}-${BRAND}.png`, width);
      });
    }
  }
}
