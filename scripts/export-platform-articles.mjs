import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "src/content/platformArticles");
const outputDir = path.join(root, "platform-exports");

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function splitFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { raw: "", body: normalized };
  const close = normalized.indexOf("\n---\n", 4);
  if (close === -1) return { raw: "", body: normalized };
  return {
    raw: normalized.slice(4, close),
    body: normalized.slice(close + 5).trim(),
  };
}

function parseYaml(raw) {
  const data = {};
  let currentArray = null;

  for (const line of raw.split("\n")) {
    if (/^\s+-\s+/.test(line) && currentArray) {
      data[currentArray].push(line.replace(/^\s+-\s+/, "").replace(/^["']|["']$/g, ""));
      continue;
    }
    currentArray = null;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (!value) {
      data[key] = [];
      currentArray = key;
    } else if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  return data;
}

function markdownToPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownToWechatHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inParagraph = false;

  function closeParagraph() {
    if (inParagraph) {
      html.push("</p>");
      inParagraph = false;
    }
  }

  for (const line of lines) {
    if (!line.trim()) {
      closeParagraph();
      continue;
    }
    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }
    if (!inParagraph) {
      html.push("<p>");
      inParagraph = true;
    } else {
      html.push("<br />");
    }
    html.push(escapeHtml(line));
  }
  closeParagraph();
  return html.join("\n");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function articleFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => !file.startsWith("_") && (file.endsWith(".md") || file.endsWith(".mdx")))
    .map((file) => path.join(dir, file));
}

rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);

const manifest = [];
for (const filePath of articleFiles(sourceDir)) {
  const slug = path.basename(filePath).replace(/\.(md|mdx)$/i, "");
  const { raw, body } = splitFrontmatter(readFileSync(filePath, "utf8"));
  const data = parseYaml(raw);
  const articleDir = path.join(outputDir, slug);
  ensureDir(articleDir);

  const title = data.title || slug;
  const plain = markdownToPlainText(body);
  const xArticle = `# ${title}\n\n${body}\n`;
  const xTeaser = `${title}\n\n${plain.split(/\n\s*\n/)[0] ?? ""}`;
  const wechatHtml = [
    `<!-- title: ${escapeHtml(title)} -->`,
    `<!-- series: ${escapeHtml(data.series || "")} -->`,
    markdownToWechatHtml(body),
    "",
  ].join("\n");

  writeFileSync(path.join(articleDir, "x-article.md"), xArticle);
  writeFileSync(path.join(articleDir, "x-teaser.txt"), xTeaser.trim() + "\n");
  writeFileSync(path.join(articleDir, "wechat.html"), wechatHtml);
  writeFileSync(
    path.join(articleDir, "manifest.json"),
    JSON.stringify(
      {
        slug,
        title,
        date: data.date,
        series: data.series,
        channels: data.channels || [],
        status: data.status || "draft",
        words: plain.split(/\s+/).filter(Boolean).length,
        files: ["x-article.md", "x-teaser.txt", "wechat.html"],
      },
      null,
      2,
    ) + "\n",
  );
  manifest.push({ slug, title, status: data.status || "draft" });
}

writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Exported ${manifest.length} platform article(s) to ${path.relative(root, outputDir)}.`);
