import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export function tempDir() {
  return mkdtempSync(join(tmpdir(), "groundwork-"));
}

// A private copy of the build sources, so a test can edit them.
export function copySources() {
  const root = tempDir();
  for (const dir of ["tokens", "base", "components", "gallery", "checker", "rules", "hooks"]) cpSync(join(repoRoot, dir), join(root, dir), { recursive: true });
  cpSync(join(repoRoot, "package.json"), join(root, "package.json"));
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
  "gw-container", "gw-stack", "gw-cluster", "gw-split", "gw-grid", "gw-grid-3", "gw-gap-lg",
  "gw-button", "gw-button--primary", "gw-card", "gw-badge", "gw-text-center",
];
