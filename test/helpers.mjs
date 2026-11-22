import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export function tempDir() {
  return mkdtempSync(join(tmpdir(), "groundwork-"));
}

// A private copy of the token sources, so a test can edit them.
export function copySources() {
  const root = tempDir();
  cpSync(join(repoRoot, "tokens"), join(root, "tokens"), { recursive: true });
  return root;
}
