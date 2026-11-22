// Applies ?theme=dark before the page paints, and carries the chosen theme along the gallery's own links.
// Once the page is parsed it also puts examples into states that markup alone cannot hold.
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

  // Opens every popover inside an example marked data-gallery-open, beside the control that opens it,
  // so an example that only makes sense open is drawn open. Each is made a manual popover first,
  // because showing one auto or hint popover closes the others on the page.
  for (const popover of document.querySelectorAll("[data-example][data-gallery-open] [popover]")) {
    const source = document.querySelector(`[popovertarget="${popover.id}"], [interestfor="${popover.id}"]`);
    popover.popover = "manual";
    popover.showPopover({ source });
  }
});
