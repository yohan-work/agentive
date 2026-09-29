// Serves the static export in out/ the way GitHub Pages does: under NEXT_PUBLIC_BASE_PATH,
// with directory index.html files and 404.html for missing paths. Run `npm run build` first.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const port = Number(process.env.PORT ?? 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};

if (!existsSync(root)) {
  console.error("out/ not found. Run `npm run build` first.");
  process.exit(1);
}

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const relative = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  let file = normalize(join(root, relative));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, "index.html");
  }
  if (!existsSync(file)) {
    res.writeHead(404, { "content-type": types[".html"] }).end(readFileSync(join(root, "404.html")));
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
}).listen(port, () => console.log(`Previewing out/ at http://localhost:${port}${basePath}/`));
