import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    .replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*\|?[-: ]+\|[-: |]+\|?\s*$/gm, "")
    .replace(/[*_`>|]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownToWechatHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = line.match(/^(`{3,}|~{3,})\s*([A-Za-z0-9_-]+)?\s*$/);
    if (fence) {
      const marker = fence[1][0];
      const language = fence[2] || "";
      const code = [];
      i += 1;
      while (i < lines.length && !new RegExp(`^${marker}{3,}\\s*$`).test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      html.push(renderCodeBlock(code.join("\n"), language));
      continue;
    }

    if (line.trim().startsWith("$$")) {
      const { tex, nextIndex } = readDisplayMath(lines, i);
      html.push(renderDisplayMath(tex));
      i = nextIndex;
      continue;
    }

    if (isTableStart(lines, i)) {
      const { html: tableHtml, nextIndex } = renderTable(lines, i);
      html.push(tableHtml);
      i = nextIndex;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      html.push(
        `<blockquote style="border-left: 4px solid #d9d9d9; margin: 1em 0; padding: 0.5em 0 0.5em 1em; color: #555;">${quote
          .map(renderInline)
          .join("<br />")}</blockquote>`,
      );
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const orderedList = Boolean(ordered);
      const items = [];
      const pattern = orderedList ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      while (i < lines.length) {
        const item = lines[i].match(pattern);
        if (!item) break;
        items.push(item[1]);
        i += 1;
      }
      const tag = orderedList ? "ol" : "ul";
      html.push(`<${tag}>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`);
      continue;
    }

    if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      html.push("<hr />");
      i += 1;
      continue;
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      const [, alt, src, title] = image;
      const caption = title || alt;
      html.push(
        `<figure><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" />${
          caption ? `<figcaption>${renderInline(caption)}</figcaption>` : ""
        }</figure>`,
      );
      i += 1;
      continue;
    }

    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines, i)) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${paragraph.map(renderInline).join("<br />")}</p>`);
  }

  return html.join("\n");
}

function startsBlock(lines, index) {
  const line = lines[index] || "";
  return (
    /^(`{3,}|~{3,})/.test(line) ||
    line.trim().startsWith("$$") ||
    isTableStart(lines, index) ||
    /^#{1,4}\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line) ||
    /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.test(line.trim())
  );
}

function readDisplayMath(lines, index) {
  const first = lines[index].trim();
  const inline = first.match(/^\$\$\s*(.+?)\s*\$\$$/);
  if (inline) return { tex: inline[1], nextIndex: index + 1 };

  const tex = [first.replace(/^\$\$\s?/, "")];
  let i = index + 1;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().endsWith("$$")) {
      tex.push(line.replace(/\s?\$\$\s*$/, ""));
      return { tex: tex.join("\n").trim(), nextIndex: i + 1 };
    }
    tex.push(line);
    i += 1;
  }
  return { tex: tex.join("\n").trim(), nextIndex: i };
}

function renderDisplayMath(tex) {
  return `<div class="math-display" style="font-family: ui-monospace, SFMono-Regular, Consolas, monospace; white-space: pre-wrap; overflow-x: auto; margin: 1em 0; padding: 0.75em 1em; background: #f6f6f6; border-radius: 6px;"><code>${escapeHtml(
    tex,
  )}</code></div>`;
}

function renderCodeBlock(code, language) {
  const languageClass = language ? ` class="language-${escapeAttribute(language)}"` : "";
  return `<pre style="overflow-x: auto; margin: 1em 0; padding: 0.85em 1em; background: #f6f6f6; border-radius: 6px;"><code${languageClass}>${escapeHtml(
    code,
  )}</code></pre>`;
}

function isTableStart(lines, index) {
  if (index + 1 >= lines.length) return false;
  if (!lines[index].includes("|")) return false;
  return isTableSeparator(lines[index + 1]);
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));
}

function renderTable(lines, index) {
  const header = splitTableRow(lines[index]);
  const separator = splitTableRow(lines[index + 1]);
  const alignments = separator.map((cell) => {
    const value = cell.replace(/\s+/g, "");
    if (value.startsWith(":") && value.endsWith(":")) return "center";
    if (value.endsWith(":")) return "right";
    return "left";
  });
  const rows = [];
  let i = index + 2;
  while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
    rows.push(splitTableRow(lines[i]));
    i += 1;
  }

  const tableStyle = "border-collapse: collapse; width: 100%; margin: 1em 0;";
  const thStyle = "border: 1px solid #d9d9d9; padding: 0.45em 0.6em; background: #f6f6f6;";
  const tdStyle = "border: 1px solid #d9d9d9; padding: 0.45em 0.6em;";
  const head = `<thead><tr>${header
    .map((cell, cellIndex) => `<th style="${thStyle} text-align: ${alignments[cellIndex] || "left"};">${renderInline(cell)}</th>`)
    .join("")}</tr></thead>`;
  const body = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${header
          .map(
            (_, cellIndex) =>
              `<td style="${tdStyle} text-align: ${alignments[cellIndex] || "left"};">${renderInline(row[cellIndex] || "")}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</tbody>`;
  return { html: `<table style="${tableStyle}">${head}${body}</table>`, nextIndex: i };
}

function splitTableRow(line) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);

  const cells = [];
  let current = "";
  let escaped = false;
  for (const char of row) {
    if (char === "|" && !escaped) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
    escaped = char === "\\" && !escaped;
    if (char !== "\\") escaped = false;
  }
  cells.push(current.trim());
  return cells;
}

function renderInline(value) {
  const tokens = [];
  let source = value;
  const stash = (html) => {
    const token = `@@HTML_TOKEN_${tokens.length}@@`;
    tokens.push([token, html]);
    return token;
  };

  source = source.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`));
  source = source.replace(
    /\$(?!\s)([^$\n]+?)(?<!\s)\$/g,
    (_, tex) => stash(`<span class="math-inline" style="font-family: ui-monospace, SFMono-Regular, Consolas, monospace;">${escapeHtml(tex)}</span>`),
  );
  source = source.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src) => stash(`<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" />`),
  );
  source = source.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href) => stash(`<a href="${escapeAttribute(href)}">${renderInline(label)}</a>`),
  );

  let html = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  for (const [token, tokenHtml] of tokens) {
    html = html.replaceAll(token, tokenHtml);
  }
  return html;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function countWords(plain) {
  const cjk = plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || [];
  const latin = plain
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g);
  return cjk.length + (latin ? latin.length : 0);
}

function articleEntries(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("_"))
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
        return [
          {
            filePath: entryPath,
            slug: entry.name.replace(/\.(md|mdx)$/i, ""),
            assetDir: null,
          },
        ];
      }
      if (!entry.isDirectory()) return [];

      for (const indexName of ["index.md", "index.mdx"]) {
        const indexPath = path.join(entryPath, indexName);
        if (existsSync(indexPath)) {
          return [
            {
              filePath: indexPath,
              slug: entry.name,
              assetDir: entryPath,
            },
          ];
        }
      }
      return [];
    })
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

function copyArticleAssets(articleDir, outputArticleDir) {
  if (!articleDir) return [];

  const copied = [];
  const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);

  function copyImages(sourceDir, relativeDir = "") {
    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const sourcePath = path.join(sourceDir, entry.name);
      const relativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        copyImages(sourcePath, relativePath);
        continue;
      }
      if (!entry.isFile() || !imageExtensions.has(path.extname(entry.name).toLowerCase())) continue;

      const outputPath = path.join(outputArticleDir, relativePath);
      ensureDir(path.dirname(outputPath));
      copyFileSync(sourcePath, outputPath);
      copied.push(relativePath);
    }
  }

  copyImages(articleDir);
  return copied.sort();
}

rmSync(outputDir, { recursive: true, force: true });
ensureDir(outputDir);

const manifest = [];
for (const { filePath, slug, assetDir } of articleEntries(sourceDir)) {
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
  const assetFiles = copyArticleAssets(assetDir, articleDir);
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
        words: countWords(plain),
        files: ["x-article.md", "x-teaser.txt", "wechat.html", ...assetFiles],
      },
      null,
      2,
    ) + "\n",
  );
  manifest.push({ slug, title, status: data.status || "draft" });
}

writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Exported ${manifest.length} platform article(s) to ${path.relative(root, outputDir)}.`);
