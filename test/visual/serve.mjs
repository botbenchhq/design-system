// A static server for dist/, shared by the browser tests that open gallery pages.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

export const dist = fileURLToPath(new URL("../../dist", import.meta.url));

const TYPES = { ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript" };

// Starts the server and returns its origin and a function that stops it.
export async function serveDist() {
  const server = createServer(async (request, response) => {
    const path = normalize(new URL(request.url, "http://localhost").pathname);
    try {
      const body = await readFile(join(dist, path));
      response.writeHead(200, { "content-type": TYPES[extname(path)] }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

// The clock of every gallery page stands still, as in the gallery's own tests.
const NOW = new Date("2026-11-22T12:00:00Z");

export async function openGallery(page, origin, name, { width = 1280, height = 900, theme = "light", brand = null } = {}) {
  await page.clock.setFixedTime(NOW);
  await page.setViewportSize({ width, height });
  await page.goto(`${origin}/gallery/${name}.html?theme=${theme}${brand ? `&brand=${brand}` : ""}`);
  await page.evaluate(() => document.fonts.ready);
}
