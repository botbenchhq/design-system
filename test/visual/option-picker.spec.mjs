// The option picker by keyboard and at a phone's width: the native radios, a long path and the field an option reveals.
import { expect, test } from "@playwright/test";
import { openGallery, pressTab, serveDist } from "./serve.mjs";

let server;
test.beforeAll(async () => {
  server = await serveDist();
});
test.afterAll(() => server.close());

const checked = (page, name) => page.locator(`input[name="${name}"]:checked`).getAttribute("value");

test("option-picker: the arrow keys move the choice and skip an unavailable option", async ({ page }) => {
  await openGallery(page, server.origin, "option-picker");
  const name = "option-picker-agent";
  // The reader signs in to Gemini, so the last option becomes available and the middle one stays unavailable.
  await page.locator(`input[name="${name}"][value="gemini-cli-pro"]`).evaluate((input) => (input.disabled = false));
  await page.locator(`input[name="${name}"]:checked`).focus();
  expect(await checked(page, name)).toBe("claude-code-sonnet");
  await page.keyboard.press("ArrowDown");
  expect(await checked(page, name)).toBe("gemini-cli-pro");
  await page.keyboard.press("ArrowUp");
  expect(await checked(page, name)).toBe("claude-code-sonnet");
  await expect(page.locator(`input[name="${name}"][value="claude-code-opus"]`)).toBeDisabled();

  const autonomy = "option-picker-autonomy";
  await page.locator(`input[name="${autonomy}"]:checked`).focus();
  await page.keyboard.press("ArrowDown");
  expect(await checked(page, autonomy)).toBe("full");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect(await checked(page, autonomy)).toBe("manual");
});

test("option-picker: a long path stays on one line at 390px and the page does not scroll sideways", async ({ page }) => {
  await openGallery(page, server.origin, "option-picker", { width: 390 });
  const layout = await page.locator("#option-picker-repository-tracking-description").evaluate((description) => {
    const path = description.querySelector(".ds-option-picker__path");
    const start = description.querySelector(".ds-option-picker__start");
    const end = description.querySelector(".ds-option-picker__end");
    const line = parseFloat(getComputedStyle(path).lineHeight);
    return {
      height: path.getBoundingClientRect().height,
      line,
      cut: start.scrollWidth > start.clientWidth,
      endWhole: end.scrollWidth <= end.clientWidth,
      right: description.closest(".ds-option-picker__option").getBoundingClientRect().right,
      edge: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(layout.height).toBeLessThanOrEqual(layout.line + 1);
  expect(layout.cut).toBe(true);
  expect(layout.endWhole).toBe(true);
  expect(layout.right).toBeLessThanOrEqual(layout.edge);
  expect(layout.scroll).toBe(0);
  // The whole path is still the input's description.
  const described = await page.locator('input[name="option-picker-repository"][value$="shipment-tracking-api"]').evaluate(
    (input) => document.getElementById(input.getAttribute("aria-describedby")).textContent,
  );
  expect(described).toBe("/Users/mira/code/clients/northwind-logistics/platform/services/shipment-tracking-api");
});

test("option-picker: the Enter a path field is reached by keyboard only while its option is chosen", async ({ page }) => {
  await openGallery(page, server.origin, "option-picker");
  const field = page.locator("#option-picker-repository-path");
  const other = page.locator('input[name="option-picker-repository"][value="other"]');

  // Chosen: Tab from the option goes to the field under it.
  await other.focus();
  await pressTab(page);
  await expect(field).toBeFocused();

  // Another repository chosen by arrow key: the field is hidden, and Tab from the group goes past it.
  await other.focus();
  await page.keyboard.press("ArrowUp");
  expect(await checked(page, "option-picker-repository")).toBe("/Users/mira/code/dotfiles");
  await expect(field).toBeHidden();
  await pressTab(page);
  await expect(field).not.toBeFocused();
  expect(await page.evaluate(() => document.activeElement.closest("[data-example]")?.dataset.example)).not.toBe("repository");

  // Chosen again: the field is back in the tab order.
  await pressTab(page, { back: true });
  await page.keyboard.press("ArrowDown");
  expect(await checked(page, "option-picker-repository")).toBe("other");
  await pressTab(page);
  await expect(field).toBeFocused();
});
