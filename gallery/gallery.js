// Applies ?theme=light or ?theme=dark before the page paints, loads a theme from themes/ named by ?brand=,
// and carries both along the gallery's own links.
// Once the page is parsed it also puts examples into states that markup alone cannot hold.
// The instant the examples were written at. A time that counts up shows the length its example was written with.
const WRITTEN_AT = Date.parse("2026-11-22T10:00:00Z");
const params = new URLSearchParams(location.search);
const mode = ["light", "dark"].includes(params.get("theme")) ? params.get("theme") : null;
const brand = /^[a-z][a-z0-9-]*$/.test(params.get("brand") ?? "") && params.get("brand") !== "default" ? params.get("brand") : null;
if (brand) {
  // After design-system.css, as an app loads it. The theme's layer wins over the default values either way.
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `../themes/${brand}.css`;
  document.head.append(link);
}
// With no theme loaded, light needs no attribute. A theme may default to dark, so under one light is set outright.
if (mode === "dark" || (mode === "light" && brand)) document.documentElement.dataset.theme = mode;

document.addEventListener("DOMContentLoaded", () => {
  // The mode a page shows with no ?theme: light, or the default mode of the theme it loaded.
  const brandLinks = [...document.querySelectorAll('[data-gallery="bar"] nav[aria-label="Theme"] a')];
  const current = brand ?? "default";
  const shown = mode ?? brandLinks.find((link) => new URLSearchParams(link.search).get("brand") === current)?.dataset.galleryDefault ?? "light";
  const query = (theme, name) => `?theme=${theme}${name === "default" ? "" : `&brand=${name}`}`;
  for (const link of document.querySelectorAll('[data-gallery="bar"] nav[aria-label="Mode"] a')) {
    const theme = new URLSearchParams(link.search).get("theme");
    if (theme === shown) link.setAttribute("aria-current", "true");
    link.search = query(theme, current);
  }
  for (const link of brandLinks) {
    const name = new URLSearchParams(link.search).get("brand");
    if (name === current) link.setAttribute("aria-current", "true");
    link.search = query(shown, name);
  }
  for (const link of document.querySelectorAll('a[href$=".html"]')) link.search = query(shown, current);

  // A checkbox can only be made indeterminate from script.
  for (const box of document.querySelectorAll('[data-example][data-state="indeterminate"] input[type="checkbox"]')) {
    box.indeterminate = true;
  }

  // An example of a running time gives a start a little before the instant above. Its start is moved by the
  // time that has passed since, so it reads 42 s when the page opens, whenever that is, and counts up from there.
  for (const elapsed of document.querySelectorAll("[data-example] ds-elapsed[datetime]")) {
    const start = Date.parse(elapsed.getAttribute("datetime"));
    if (!Number.isNaN(start)) elapsed.setAttribute("datetime", new Date(start + Date.now() - WRITTEN_AT).toISOString());
  }

  // Opens every popover inside an example marked data-gallery-open, beside the control that opens it,
  // so an example that only makes sense open is drawn open. Each is made a manual popover first,
  // because showing one auto or hint popover closes the others on the page.
  for (const popover of document.querySelectorAll("[data-example][data-gallery-open] [popover]")) {
    const source = document.querySelector(`[popovertarget="${popover.id}"], [interestfor="${popover.id}"]`);
    // The side on which the popover's own margin keeps it off the edge of the screen. The stylesheet
    // widens that margin, so a wide popover also stays inside the frame of its example.
    const { marginInlineStart, marginInlineEnd } = getComputedStyle(popover);
    const edges = [parseFloat(marginInlineStart) > 0 && "start", parseFloat(marginInlineEnd) > 0 && "end"].filter(Boolean);
    if (edges.length > 0) popover.dataset.galleryEdge = edges.join(" ");
    popover.popover = "manual";
    popover.showPopover({ source });
  }
});
