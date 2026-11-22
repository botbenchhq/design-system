// Applies ?theme=dark before the page paints, and carries the chosen theme along the gallery's own links.
const theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
if (theme === "dark") document.documentElement.dataset.theme = "dark";

document.addEventListener("DOMContentLoaded", () => {
  for (const link of document.querySelectorAll('[data-gallery="bar"] nav a')) {
    if (link.search === `?theme=${theme}`) link.setAttribute("aria-current", "true");
  }
  for (const link of document.querySelectorAll('a[href$=".html"]')) link.search = `?theme=${theme}`;
});
