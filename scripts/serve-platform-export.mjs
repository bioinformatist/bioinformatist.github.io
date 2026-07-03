import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFile } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";

const root = process.cwd();
const outputRoot = path.join(root, "platform-exports");
const port = process.env.PORT || "8765";

const exportResult = spawnSync(process.execPath, [path.join("scripts", "export-platform-articles.mjs")], {
  cwd: root,
  stdio: "inherit",
});

if (exportResult.status !== 0) {
  process.exit(exportResult.status ?? 1);
}

function firstLanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "127.0.0.1";
}

function articleSlugs() {
  if (!existsSync(outputRoot)) return [];
  return readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function selectedSlug() {
  const explicit = process.argv[2];
  if (explicit) return explicit;

  const slugs = articleSlugs();
  if (slugs.length === 1) return slugs[0];
  if (slugs.length === 0) {
    console.error("No platform article exports found.");
    process.exit(1);
  }

  console.error(`Multiple platform article exports found. Pass one slug: ${slugs.join(", ")}`);
  process.exit(1);
}

const slug = selectedSlug();
const articleDir = path.join(outputRoot, slug);
if (!existsSync(articleDir)) {
  console.error(`Platform export not found: ${path.relative(root, articleDir)}`);
  process.exit(1);
}

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webp", "image/webp"],
]);

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url, "http://localhost");
  const relativePath = decodeURIComponent(requestUrl.pathname === "/" ? "/x-article.html" : requestUrl.pathname);
  const filePath = path.resolve(articleDir, `.${relativePath}`);

  if (!filePath.startsWith(`${articleDir}${path.sep}`) && filePath !== articleDir) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const contentType = contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(data);
  });
});

const lanUrl = `http://${firstLanAddress()}:${port}/`;
server.listen(Number(port), "0.0.0.0", () => {
  console.log(`Serving ${path.relative(root, articleDir)} at ${lanUrl}`);
});
