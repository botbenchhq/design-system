export function setProgress(bar, fraction) {
  bar.style.setProperty("--ds-progress", `${fraction * 100}%`);
}
