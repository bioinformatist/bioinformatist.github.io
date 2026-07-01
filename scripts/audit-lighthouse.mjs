import { createServer } from "node:http";
import { mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const distDir = path.join(root, "dist");
const reportDir = path.join(root, ".lighthouseci");

const pages = [
  { path: "/", name: "home" },
  { path: "/en/", name: "home-en" },
  { path: "/blog/", name: "blog" },
  { path: "/projects/", name: "projects" },
  { path: "/resume/", name: "resume" },
  { path: "/en/resume/", name: "resume-en" },
];

const thresholds = {
  performance: 0.7,
  accessibility: 0.9,
  "best-practices": 0.9,
  seo: 0.85,
};

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

function serveStatic(request, response) {
  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(distDir, safePath);

  try {
    if (statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    response.writeHead(200, {
      "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(readFileSync(filePath));
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
  }
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function scoreFor(report, category) {
  return report.categories?.[category]?.score ?? 0;
}

const server = createServer(serveStatic);
const port = await listen(server);
const baseUrl = `http://127.0.0.1:${port}`;

try {
  rmSync(reportDir, { recursive: true, force: true });
  mkdirSync(reportDir, { recursive: true });

  await run("zola", ["build", "--output-dir", "dist", "--force", "--base-url", baseUrl]);

  const failures = [];
  for (const page of pages) {
    const url = `${baseUrl}${page.path}`;
    const reportPath = path.join(reportDir, `${page.name}.json`);
    console.log(`Running Lighthouse on ${url}`);

    await run("lighthouse", [
      url,
      "--quiet",
      "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      `--output-path=${reportPath}`,
    ]);

    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    for (const [category, minimum] of Object.entries(thresholds)) {
      const score = scoreFor(report, category);
      if (score < minimum) {
        failures.push(`${page.path} ${category}: ${score.toFixed(2)} < ${minimum}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error("Lighthouse threshold failures:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`Lighthouse checks passed for ${pages.length} pages.`);
  }
} finally {
  await close(server);
}
