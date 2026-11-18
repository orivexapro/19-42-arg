import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const root = new URL(".", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const relative = normalize(urlPath === "/" ? "index.html" : urlPath.slice(1));
    const file = join(root, relative);
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error("Not found");
    res.writeHead(200, { "Content-Type": `${types[extname(file)] || "application/octet-stream"}; charset=utf-8` });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Introuvable");
  }
}).listen(port, () => console.log(`19:42 — http://localhost:${port}`));

