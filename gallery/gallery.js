// Applies ?theme=dark before the page paints, and carries the chosen theme along the gallery's own links.
// Once the page is parsed it also puts examples into states that markup alone cannot hold.
// The instant the examples were written at. A time that counts up shows the length its example was written with.
const WRITTEN_AT = Date.parse("2026-11-22T10:00:00Z");
const theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
if (theme === "dark") document.documentElement.dataset.theme = "dark";

document.addEventListener("DOMContentLoaded", () => {
  for (const link of document.querySelectorAll('[data-gallery="bar"] nav a')) {
    if (link.search === `?theme=${theme}`) link.setAttribute("aria-current", "true");
  }
  for (const link of document.querySelectorAll('a[href$=".html"]')) link.search = `?theme=${theme}`;

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
