import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("..", import.meta.url));

// Every folder made here is removed when the test process exits, pass or fail, so runs do not fill the disk.
const made = new Set();
process.once("exit", () => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

export function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "design-system-"));
  made.add(dir);
  return dir;
}

// A private copy of the build sources, so a test can edit them.
export function copySources() {
  const root = tempDir();
  for (const dir of ["tokens", "themes", "base", "components", "patterns", "gallery", "behaviors", "react", "checker", "rules", "hooks", "scripts"]) cpSync(join(repoRoot, dir), join(root, dir), { recursive: true });
  for (const file of ["package.json", "LICENSE", "NOTICE"]) cpSync(join(repoRoot, file), join(root, file));
  return root;
}

// The shipped manifest plus a class list, as it will look once components exist.
export function manifestWithClasses(classes) {
  const dir = tempDir();
  const dist = join(repoRoot, "dist");
  const manifest = { ...JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8")), classes };
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
  cpSync(join(dist, "tokens.css"), join(dir, "tokens.css"));
  return join(dir, "manifest.json");
}

// The system classes the structural-rule fixtures use.
export const FIXTURE_CLASSES = [
  "ds-container", "ds-stack", "ds-cluster", "ds-split", "ds-grid", "ds-grid-3", "ds-gap-lg",
  "ds-button", "ds-button--primary", "ds-card", "ds-badge", "ds-text-center",
];
