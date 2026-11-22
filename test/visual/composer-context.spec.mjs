// The composer as one block: its row at phone widths, the missing required value, the Add context sheet and dictation.
import { expect, test } from "@playwright/test";
import { openGallery, serveDist } from "./serve.mjs";

let server;
test.beforeAll(async () => {
  server = await serveDist();
});
test.afterAll(() => server.close());

const example = (page, id) => page.locator(`[data-example="${id}"]`);

// The boxes of the row's direct controls, and whether a 44px square centred on each lands on it.
const row = (page, id) =>
  example(page, id).evaluate((element) => {
    const bar = element.querySelector(".ds-composer__bar");
    bar.scrollIntoView({ block: "center" });
    const edge = bar.getBoundingClientRect();
    const controls = [...bar.querySelectorAll("button")].filter((control) => control.checkVisibility());
    return {
      bar: { left: edge.left, right: edge.right },
      controls: controls.map((control) => {
        const box = control.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const hit = [[x - 21, y], [x + 21, y], [x, y - 21], [x, y + 21]].every(([left, top]) => control.contains(document.elementFromPoint(left, top)));
        return { name: control.getAttribute("aria-label") ?? control.textContent.replace(/\s+/g, " ").trim(), top: box.top, bottom: box.bottom, left: box.left, right: box.right, hit };
      }),
    };
  });

function expectOneLine({ bar, controls }) {
  const [first, ...rest] = controls;
  const send = controls.at(-1);
  for (const control of controls) {
    expect(control.hit, control.name).toBe(true);
    expect(control.left, control.name).toBeGreaterThanOrEqual(bar.left - 1);
    expect(control.right, control.name).toBeLessThanOrEqual(bar.right + 1);
  }
  // Add context and Send share a line: their vertical spans overlap.
  for (const control of [send, ...rest.filter((each) => each.name === "Dictate")]) {
    expect(control.top, control.name).toBeLessThan(first.bottom);
    expect(control.bottom, control.name).toBeGreaterThan(first.top);
  }
  expect(Math.abs(send.right - bar.right)).toBeLessThanOrEqual(1);
}

test("at 320px and 390px Add context, the model chip, dictation and Send keep one line with 44px targets", async ({ page }) => {
  for (const width of [320, 390]) {
    await openGallery(page, server.origin, "composer", { width });
    const empty = await row(page, "context-empty");
    expect(empty.controls.map((control) => control.name)).toEqual(["Add context", "Model: Sonnet, Medium effort", "Dictate", "Send"]);
    expectOneLine(empty);
    // The chips line up with Add context too, when there is room for them beside it.
    expect(empty.controls[1].top).toBeLessThan(empty.controls[0].bottom);
    expectOneLine(await row(page, "required"));
  }
});

test("with the required prompt in the row, Send is unavailable and the reason is linked to it and to the prompt", async ({ page }) => {
  await openGallery(page, server.origin, "composer", { width: 390 });
  const required = example(page, "required");
  const send = required.getByRole("button", { name: "Send" });
  await expect(send).toBeDisabled();
  await expect(send).toHaveAccessibleDescription("Choose a repository to send. The task runs in a worktree of it.");
  await expect(required.getByRole("button", { name: "Choose a repository" })).toHaveAccessibleDescription(/Choose a repository to send/);
  // The prompt takes the model chip's place, and is drawn with a border where the model chip has none.
  await expect(required.locator(".ds-composer__chip")).toHaveCount(1);
  const border = (id) => example(page, id).locator(".ds-composer__chip").evaluate((chip) => getComputedStyle(chip).borderTopColor);
  expect(await border("required")).not.toBe(await border("context-empty"));
});

test("the sheet's rows are named by the setting and its value, and a long value stays on one line", async ({ page }) => {
  await openGallery(page, server.origin, "composer", { width: 390 });
  const rows = example(page, "sheet").locator(".ds-context-list__button");
  for (const name of ["Repository api", "Model Sonnet, medium effort", "Mode Manual", "Review Codex"]) {
    await expect(example(page, "sheet").getByRole("button", { name, exact: true })).toBeVisible();
  }
  expect(await rows.count()).toBe(4);

  await openGallery(page, server.origin, "context-list", { width: 320 });
  const long = example(page, "long-value").getByRole("button", { name: "Repository northwind-logistics-shipment-tracking-api", exact: true });
  await expect(long).toBeVisible();
  const value = long.locator(".ds-context-list__value");
  const [height, line] = await value.evaluate((element) => [element.getBoundingClientRect().height, parseFloat(getComputedStyle(element).lineHeight)]);
  expect(height).toBeLessThanOrEqual(line + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("a setting's view has a Back control that Tab reaches and that names where it goes", async ({ page }) => {
  await openGallery(page, server.origin, "composer", { width: 390 });
  const view = example(page, "sheet-repository");
  await view.locator(".ds-composer").getByRole("button", { name: "Send" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAccessibleName("Back to Add context");
  await expect(view.getByRole("heading", { name: "Repository" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAccessibleName("Close Add context");
});

test("dictation says its state in attributes and words, and the row holds at 320px with and without it", async ({ page }) => {
  await openGallery(page, server.origin, "composer", { width: 320 });
  const states = [
    ["context-empty", { pressed: "false", busy: null, said: null }],
    ["listening", { pressed: "true", busy: null, said: "Listening" }],
    ["transcribing", { pressed: "false", busy: "true", said: "Transcribing" }],
    ["dictation-blocked", { pressed: "false", busy: null, said: "Microphone access was blocked. Allow it in your browser's settings." }],
  ];
  for (const [id, { pressed, busy, said }] of states) {
    const mic = example(page, id).getByRole("button", { name: "Dictate", exact: true });
    await expect(mic, id).toHaveAttribute("aria-pressed", pressed);
    expect(await mic.getAttribute("aria-busy"), id).toBe(busy);
    if (said) {
      await expect(mic, id).toHaveAccessibleDescription(said);
      await expect(example(page, id).getByRole(id === "dictation-blocked" ? "alert" : "status"), id).toHaveText(said);
    }
  }
  // Listening is drawn with more than colour: the pressed bar under the icon.
  const bar = await example(page, "listening").locator('[aria-pressed="true"]').evaluate((mic) => getComputedStyle(mic, "::after").height);
  expect(parseFloat(bar)).toBeGreaterThan(0);

  expectOneLine(await row(page, "context-empty"));
  await example(page, "context-empty").locator('[aria-label="Dictate"]').evaluate((mic) => mic.remove());
  const without = await row(page, "context-empty");
  expect(without.controls.map((control) => control.name)).toEqual(["Add context", "Model: Sonnet, Medium effort", "Send"]);
  expectOneLine(without);
});
