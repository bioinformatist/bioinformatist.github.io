import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "src/content/platformArticles");
const outputDir = path.join(root, "platform-exports");

const disclaimers = {
  "investment-education":
    "风险提示：本文仅用于投资教育和交易逻辑讨论，不构成任何证券、期权、基金、加密资产或其他金融产品的投资建议、买卖推荐或收益承诺。文中涉及的标的、策略和交易案例仅用于说明风险结构与思考框架，不代表适合任何特定读者。市场有风险，交易可能导致本金损失；请基于自身财务状况、风险承受能力和独立判断作出决策，必要时咨询具备相应资质的专业人士。",
};

const wechatStyles = {
  article: "margin:0 6px;color:#333;font-size:15px;line-height:1.85;letter-spacing:.04em;",
  paragraph: "",
  h1: "display:table;margin:2.2em auto 1.2em;padding:0 .4em .2em;border-bottom:2px solid #f2994a;color:#222;font-size:20px;line-height:1.35;font-weight:700;text-align:center;",
  h2: "display:table;margin:2.4em auto 1.2em;padding:.12em .55em;background:#f2994a;color:#fff;font-size:18px;line-height:1.45;font-weight:700;text-align:center;",
  h3: "margin:2em 0 .9em;padding-left:.65em;border-left:4px solid #f2994a;color:#222;font-size:16px;line-height:1.5;font-weight:700;",
  quote: "margin:.65em 0 1.15em;padding:.75em 0 .75em 1em;border-left:4px solid #ddd;color:#666;background:#fafafa;line-height:1.8;",
  ul: "margin:.35em 0 1.1em;padding-left:1.6em;",
  ol: "margin:.35em 0 1.1em;padding-left:1.6em;",
  li: "margin:.35em 0;",
  hr: "border:none;border-top:1px solid #e5e5e5;margin:1.6em 0;",
  codeBlock:
    "margin:1.1em 0;padding:.85em 1em;border-radius:6px;background:#f7f7f7;color:#333;font-size:14px;line-height:1.65;letter-spacing:0;overflow-x:auto;",
  codeText: "font-family:Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word;",
  inlineCode:
    "font-family:Menlo,Consolas,monospace;color:#d35400;background:#fff4e8;border-radius:4px;padding:.08em .28em;letter-spacing:0;",
  figure: "margin:.85em 0 1.25em;text-align:center;",
  image: "display:block;max-width:100%;height:auto;margin:0 auto;border-radius:4px;",
  caption: "margin:.45em 0 0;color:#888;font-size:13px;line-height:1.55;text-align:center;",
  formula: "margin:1.15em 0;text-align:center;",
  tableWrap: "margin:1.2em 0;overflow-x:auto;",
  table: "border-collapse:collapse;width:100%;font-size:14px;line-height:1.6;letter-spacing:0;",
  th: "background:#fff4e8;font-weight:700;",
  td: "",
  link: "color:#576b95;text-decoration:underline;text-underline-offset:2px;",
  citationSup: "margin-left:.12em;color:#d35400;font-size:.75em;line-height:0;vertical-align:super;",
  citationSection:
    "margin:2em 0 0;padding-top:1em;border-top:1px solid #e5e5e5;color:#666;font-size:13px;line-height:1.65;letter-spacing:0;",
  citationTitle: "margin:0 0 .8em;color:#222;font-size:15px;font-weight:700;",
  citationItem: "margin:.4em 0;word-break:break-all;",
  citationIndex: "color:#d35400;font-weight:700;",
  citationUrl: "font-style:italic;color:#666;",
  strong: "color:#d35400",
  em: "color:#666",
  del: "color:#888",
};

let mathJaxReady = null;

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function styleAttribute(style) {
  return style ? ` style="${style}"` : "";
}

function wechatStyle(options, key) {
  return options.style === "wechat" ? styleAttribute(wechatStyles[key]) : "";
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
    .replace(/[*_`>|~]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function appendDisclaimer(markdown, key) {
  const footer = disclaimerMarkdown(key);
  if (!footer) return markdown.trim();
  return `${markdown.trim()}\n\n${footer}`;
}

function disclaimerMarkdown(key) {
  if (!key) return "";
  const disclaimer = disclaimers[key];
  if (!disclaimer) throw new Error(`Unknown disclaimer: ${key}`);
  return `---\n\n*${disclaimer}*`;
}

function assertNoInlineMath(markdown, filePath) {
  const issues = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let inFence = false;
  let fenceMarker = "";
  let inDisplayMath = false;

  lines.forEach((line, index) => {
    const fence = line.match(/^(`{3,}|~{3,})/);
    if (fence && !inFence) {
      inFence = true;
      fenceMarker = fence[1][0];
      return;
    }
    if (inFence) {
      if (new RegExp(`^${fenceMarker}{3,}\\s*$`).test(line)) {
        inFence = false;
        fenceMarker = "";
      }
      return;
    }

    if (line.trim().startsWith("$$") || inDisplayMath) {
      if (!line.trim().match(/^\$\$.*\$\$$/) && line.trim().startsWith("$$")) {
        inDisplayMath = true;
      } else if (inDisplayMath && line.trim().endsWith("$$")) {
        inDisplayMath = false;
      }
      return;
    }

    if (/\$(?!\$|\s)([^$\n]+?)(?<!\s)\$(?!\$)/.test(line)) {
      issues.push(`${filePath}:${index + 1}: inline math is not supported in platform exports`);
    }
  });

  if (issues.length > 0) {
    throw new Error(`${issues.join("\n")}\nUse plain text in prose, or promote important formulas to display math blocks.`);
  }
}

function markdownToWechatHtml(markdown, options = {}) {
  if (options.style === "wechat" && options.citeExternalLinks) {
    options.linkCitations = [];
    options.linkCitationByHref = new Map();
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const counts = { image: 0, formula: 0, table: 0, code: 0 };
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
      counts.code += 1;
      html.push(
        options.renderCodeBlock
          ? options.renderCodeBlock(code.join("\n"), language, counts.code)
          : renderCodeBlock(code.join("\n"), language),
      );
      continue;
    }

    if (line.trim().startsWith("$$")) {
      const { tex, nextIndex } = readDisplayMath(lines, i);
      counts.formula += 1;
      html.push(options.renderDisplayMath ? options.renderDisplayMath(tex, counts.formula) : renderDisplayMath(tex));
      i = nextIndex;
      continue;
    }

    if (isTableStart(lines, i)) {
      const { html: tableHtml, markdown: tableMarkdown, nextIndex, rowCount, columnCount } = renderTable(lines, i, options);
      counts.table += 1;
      html.push(options.renderTable ? options.renderTable(tableMarkdown, counts.table, { rowCount, columnCount }) : tableHtml);
      i = nextIndex;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 3);
      html.push(`<h${level}${wechatStyle(options, `h${level}`)}>${renderInline(heading[2], options)}</h${level}>`);
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
        `<blockquote${wechatStyle(options, "quote")}>${quote.map((item) => renderInline(item, options)).join("<br/>")}</blockquote>`,
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
      html.push(
        `<${tag}${wechatStyle(options, tag)}>${items
          .map((item) => `<li${wechatStyle(options, "li")}>${renderInline(item, options)}</li>`)
          .join("")}</${tag}>`,
      );
      continue;
    }

    if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      html.push(`<hr${wechatStyle(options, "hr")} />`);
      i += 1;
      continue;
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      const [, alt, src, title] = image;
      const caption = title || alt;
      counts.image += 1;
      html.push(
        options.renderImage
          ? options.renderImage({ alt, src, title, caption, index: counts.image })
          : `<figure${wechatStyle(options, "figure")}><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"${wechatStyle(
              options,
              "image",
            )} />${
              caption ? `<figcaption${wechatStyle(options, "caption")}>${renderInline(caption, options)}</figcaption>` : ""
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
    const paragraphHtml = `<p${wechatStyle(options, "paragraph")}>${paragraph.map((item) => renderInline(item, options)).join("<br/>")}</p>`;
    html.push(options.style === "wechat" && !isTightFollowingBlock(lines, i) ? `${paragraphHtml}<br/>` : paragraphHtml);
  }

  const content = [...html, renderLinkCitations(options)].filter(Boolean).join("\n");
  return options.style === "wechat" ? `<section${wechatStyle(options, "article")}>\n${content}\n</section>` : content;
}

function isTightFollowingBlock(lines, index) {
  let i = index;
  while (i < lines.length && !lines[i].trim()) i += 1;
  if (i >= lines.length) return false;
  const line = lines[i].trim();
  return (
    /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.test(line) ||
    /^\s*>\s?/.test(lines[i]) ||
    /^\s*[-*+]\s+/.test(lines[i]) ||
    /^\s*\d+[.)]\s+/.test(lines[i]) ||
    /^(`{3,}|~{3,})\s*([A-Za-z0-9_-]+)?\s*$/.test(lines[i]) ||
    line.startsWith("$$") ||
    isTableStart(lines, i)
  );
}

function markdownInsertItems(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const items = [];
  const counts = { image: 0, formula: 0, table: 0, code: 0 };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
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
      counts.code += 1;
      items.push({ kind: "code", index: counts.code, language, content: code.join("\n") });
      continue;
    }

    if (line.trim().startsWith("$$")) {
      const { tex, nextIndex } = readDisplayMath(lines, i);
      counts.formula += 1;
      items.push({ kind: "formula", index: counts.formula, content: tex });
      i = nextIndex;
      continue;
    }

    if (isTableStart(lines, i)) {
      const { markdown: tableMarkdown, nextIndex, rowCount, columnCount } = renderTable(lines, i);
      counts.table += 1;
      items.push({ kind: "table", index: counts.table, content: tableMarkdown, rowCount, columnCount });
      i = nextIndex;
      continue;
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      counts.image += 1;
      items.push({ kind: "image", index: counts.image, alt: image[1], src: image[2] });
      i += 1;
      continue;
    }

    i += 1;
  }

  return items;
}

function markdownToXArticleBodyHtml(markdown) {
  return markdownToWechatHtml(markdown, {
    renderCodeBlock: (_code, language, index) => {
      const detail = language ? `用 X Article 的 Insert 功能插入 ${language} 代码块` : "用 X Article 的 Insert 功能插入代码块";
      return renderXPlaceholder(`代码块 ${index}`, detail);
    },
    renderImage: ({ alt, index }) => renderXPlaceholder(`图片 ${index}`, alt || "右键复制图片后粘贴到 X"),
    renderDisplayMath: (tex, index) => renderXPlaceholder(`公式 ${index}`, firstLine(tex)),
    renderTable: (_tableMarkdown, index, { rowCount, columnCount }) =>
      renderXPlaceholder(`表格 ${index}`, `${rowCount} 行 x ${columnCount} 列；用 X Article 的 Insert 功能插入 Markdown 表格`),
  });
}

function renderXArticlePreview({ title, bodyHtml, cover, insertItems }) {
  const insertList = insertItems.length > 0 ? `<ol>${insertItems.map(renderInsertItem).join("")}</ol>` : "<p>没有需要单独插入的内容。</p>";
  const coverHtml = cover
    ? `<section class="cover-box">
    <strong>封面图（5:2）</strong>
    <img src="${escapeAttribute(cover)}" alt="${escapeAttribute(title)} cover" />
  </section>`
    : "";

  return `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} - X Article 预览</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f1ec;
      --paper: #fffdf8;
      --ink: #171717;
      --muted: #666;
      --line: #d8d1c7;
      --accent: #f2994a;
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK SC", "PingFang SC", sans-serif;
      line-height: 1.72;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      padding: 0.8rem max(1rem, calc((100vw - 820px) / 2));
      background: rgba(244, 241, 236, 0.96);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(8px);
    }
    button {
      border: 1px solid #1f1f1f;
      border-radius: 6px;
      background: #1f1f1f;
      color: white;
      cursor: pointer;
      font: inherit;
      padding: 0.45rem 0.8rem;
    }
    button.secondary {
      background: transparent;
      color: var(--ink);
    }
    .status {
      color: var(--muted);
      font-size: 0.92rem;
    }
    .note, .assets, article {
      box-sizing: border-box;
      width: min(820px, calc(100vw - 2rem));
      margin: 1rem auto;
    }
    .note, .assets {
      color: var(--muted);
      font-size: 0.94rem;
    }
    article {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: clamp(1rem, 3vw, 2.5rem);
    }
    .title-box {
      box-sizing: border-box;
      width: min(820px, calc(100vw - 2rem));
      margin: 1rem auto;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 1rem 1.2rem;
    }
    .title-box strong {
      display: block;
      color: var(--muted);
      font-size: 0.9rem;
      margin-bottom: 0.35rem;
    }
    #titleText {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1.35;
    }
    .cover-box {
      box-sizing: border-box;
      width: min(820px, calc(100vw - 2rem));
      margin: 1rem auto;
      color: var(--muted);
      font-size: 0.92rem;
    }
    .cover-box strong {
      display: block;
      margin-bottom: 0.45rem;
    }
    .cover-box img {
      display: block;
      width: 100%;
      aspect-ratio: 5 / 2;
      object-fit: cover;
      border: 1px solid var(--line);
      border-radius: 10px;
      margin: 0;
    }
    h1, h2, h3 {
      line-height: 1.28;
    }
    h1 {
      font-size: 2rem;
      margin-top: 0;
    }
    h2 {
      margin-top: 2.2rem;
      border-left: 5px solid var(--accent);
      padding-left: 0.7rem;
    }
    a {
      color: #1464b4;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 1rem auto;
      border-radius: 8px;
    }
    figcaption {
      color: var(--muted);
      font-size: 0.9rem;
      text-align: center;
    }
    table {
      border-collapse: collapse;
      display: block;
      max-width: 100%;
      overflow-x: auto;
      white-space: nowrap;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 0.45rem 0.6rem;
    }
    th {
      background: #f6f2ea;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    }
    pre, .math-display {
      overflow-x: auto;
      background: #f6f2ea;
      border-radius: 6px;
      padding: 0.8rem 1rem;
    }
    blockquote {
      border-left: 4px solid var(--line);
      color: #444;
      margin-left: 0;
      padding-left: 1rem;
    }
    .placeholder {
      border: 1px dashed var(--accent);
      border-radius: 6px;
      color: #7a4a00;
      background: #fff7e8;
      padding: 0.65rem 0.8rem;
    }
    .insert-list li {
      margin: 1rem 0 1.4rem;
    }
    .insert-list img {
      max-height: 360px;
      border: 1px solid var(--line);
    }
    textarea {
      box-sizing: border-box;
      width: 100%;
      min-height: 7rem;
      margin-top: 0.4rem;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 0.7rem;
      background: #fffdf8;
      color: var(--ink);
      font: 0.92rem/1.55 ui-monospace, SFMono-Regular, Consolas, monospace;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" id="selectTitle">选择标题</button>
    <button type="button" id="selectArticle">选择正文</button>
    <span class="status" id="status">先复制标题，再复制正文，然后按清单补图片、公式和表格。</span>
  </div>
  <p class="note">X Article 的标题和正文是两个输入区。标题单独复制；正文区不包含标题，并把图片、LaTeX 公式和 Markdown 表格替换成占位符；粘贴正文后，按清单逐项在 X 里插入或右键复制图片。</p>
  <section class="title-box">
    <strong>标题</strong>
    <span id="titleText">${escapeHtml(title)}</span>
  </section>
  ${coverHtml}
  <article id="article" contenteditable="true">
${bodyHtml}
  </article>
  <section class="assets insert-list">
    <strong>插入清单：</strong>
    ${insertList}
  </section>
  <script>
    const article = document.getElementById("article");
    const titleText = document.getElementById("titleText");
    const status = document.getElementById("status");

    function selectNodeContents(node, message) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = message;
    }

    function selectTitle() {
      selectNodeContents(titleText, "标题已选中。按 Ctrl/Cmd+C 复制，再粘贴到 X 的标题输入框。");
    }

    function selectArticle() {
      selectNodeContents(article, "正文已选中。按 Ctrl/Cmd+C 复制，再粘贴到 X 的正文编辑器。");
    }

    document.getElementById("selectTitle").addEventListener("click", selectTitle);
    document.getElementById("selectArticle").addEventListener("click", selectArticle);
    document.querySelectorAll("textarea").forEach((textarea) => {
      textarea.addEventListener("focus", () => textarea.select());
      textarea.addEventListener("click", () => textarea.select());
    });
  </script>
</body>
</html>
`;
}

function renderXPlaceholder(label, detail) {
  return `<p class="placeholder">【${escapeHtml(label)}${detail ? `：${escapeHtml(detail)}` : ""}】</p>`;
}

function renderInsertItem(item) {
  if (item.kind === "image") {
    return `<li><strong>图片 ${item.index}</strong>${item.alt ? `：${escapeHtml(item.alt)}` : ""}<br /><code>${escapeHtml(
      item.src,
    )}</code><img src="${escapeAttribute(item.src)}" alt="${escapeAttribute(item.alt)}" /></li>`;
  }
  if (item.kind === "formula") {
    return `<li><strong>公式 ${item.index}</strong><textarea readonly spellcheck="false">${escapeHtml(item.content)}</textarea></li>`;
  }
  if (item.kind === "table") {
    return `<li><strong>表格 ${item.index}（${item.rowCount} 行 x ${item.columnCount} 列）</strong><textarea readonly spellcheck="false">${escapeHtml(
      item.content,
    )}</textarea></li>`;
  }
  if (item.kind === "code") {
    const language = item.language ? `（${escapeHtml(item.language)}）` : "";
    return `<li><strong>代码块 ${item.index}${language}</strong><textarea readonly spellcheck="false">${escapeHtml(item.content)}</textarea></li>`;
  }
  return "";
}

function firstLine(value) {
  return value.split("\n").find((line) => line.trim())?.trim() || "";
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

function renderWechatFormulaImage(tex, index, fileName) {
  if (!fileName) return renderDisplayMath(tex);
  return `<section${styleAttribute(wechatStyles.formula)}><img src="${escapeAttribute(fileName)}" alt="公式 ${index}"${styleAttribute(
    wechatStyles.image,
  )} /></section>`;
}

async function ensureMathJax() {
  if (!mathJaxReady) {
    mathJaxReady = (async () => {
      global.MathJax = {
        loader: {
          paths: { mathjax: "@mathjax/src/bundle" },
          load: ["adaptors/liteDOM"],
          require: (file) => import(file),
        },
        output: { font: "mathjax-newcm" },
      };
      await import("@mathjax/src/bundle/tex-svg.js");
      await MathJax.startup.promise;
      return MathJax;
    })();
  }
  return mathJaxReady;
}

async function texToSvg(tex) {
  const mathJax = await ensureMathJax();
  const node = await mathJax.tex2svgPromise(tex, {
    display: true,
    em: 16,
    ex: 8,
    containerWidth: 960,
  });
  const adaptor = mathJax.startup.adaptor;
  return adaptor.serializeXML(adaptor.tags(node, "svg")[0]);
}

function runMagick(args, label) {
  const result = spawnSync("magick", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${label} failed.${detail ? `\n${detail}` : ""}`);
  }
}

async function renderWechatFormulaAssets(formulaItems, outputArticleDir) {
  const byIndex = new Map();
  const files = [];
  for (const item of formulaItems) {
    const baseName = `wechat-formula-${item.index}`;
    const svgFile = `${baseName}.svg`;
    const pngFile = `${baseName}.png`;
    const svgPath = path.join(outputArticleDir, svgFile);
    const pngPath = path.join(outputArticleDir, pngFile);
    writeFileSync(svgPath, await texToSvg(item.content));
    runMagick(["-background", "none", "-density", "220", svgPath, "-trim", "-bordercolor", "none", "-border", "24x12", pngPath], `render ${pngFile}`);
    rmSync(svgPath, { force: true });
    byIndex.set(item.index, pngFile);
    files.push(pngFile);
  }
  return { byIndex, files };
}

async function shutdownMathJax() {
  if (!mathJaxReady) return;
  const mathJax = await mathJaxReady;
  if (typeof mathJax.done === "function") mathJax.done();
}

function renderCodeBlock(code, language) {
  const languageClass = language ? ` class="language-${escapeAttribute(language)}"` : "";
  const escapedCode = escapeHtml(code).replaceAll("\n", "<br/>");
  return `<section${styleAttribute(wechatStyles.codeBlock)}><code${languageClass}${styleAttribute(wechatStyles.codeText)}>${escapedCode}</code></section>`;
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

function renderTable(lines, index, options = {}) {
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
  const markdown = lines.slice(index, i).join("\n");

  const tableStyle = options.style === "wechat" ? wechatStyles.table : "border-collapse: collapse; width: 100%; margin: 1em 0;";
  const thStyle = options.style === "wechat" ? wechatStyles.th : "border: 1px solid #d9d9d9; padding: 0.45em 0.6em; background: #f6f6f6;";
  const tdStyle = options.style === "wechat" ? wechatStyles.td : "border: 1px solid #d9d9d9; padding: 0.45em 0.6em;";
  const head = `<thead><tr>${header
    .map(
      (cell, cellIndex) =>
        `<th${cellAttributes(thStyle, alignments[cellIndex] || "left")}>${renderInline(cell, options)}</th>`,
    )
    .join("")}</tr></thead>`;
  const body = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${header
          .map(
            (_, cellIndex) =>
              `<td${cellAttributes(tdStyle, alignments[cellIndex] || "left")}>${renderInline(row[cellIndex] || "", options)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</tbody>`;
  const tableAttrs =
    options.style === "wechat"
      ? ` border="1" cellpadding="6" cellspacing="0" style="${tableStyle}"`
      : ` style="${tableStyle}"`;
  return {
    html:
      options.style === "wechat"
        ? `<section${styleAttribute(wechatStyles.tableWrap)}><table${tableAttrs}>${head}${body}</table></section>`
        : `<table${tableAttrs}>${head}${body}</table>`,
    markdown,
    nextIndex: i,
    rowCount: rows.length + 1,
    columnCount: header.length,
  };
}

function cellAttributes(style, alignment) {
  const attributes = [];
  if (style) attributes.push(`style="${style}"`);
  if (alignment && alignment !== "left") attributes.push(`align="${alignment}"`);
  return attributes.length > 0 ? ` ${attributes.join(" ")}` : "";
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

function isMpWeixinLink(href) {
  return /^https?:\/\/mp\.weixin\.qq\.com\//i.test(href);
}

function shouldCiteExternalLink(href, options = {}) {
  return options.style === "wechat" && options.citeExternalLinks && /^https?:\/\//i.test(href) && !isMpWeixinLink(href);
}

function inlineText(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addLinkCitation(href, label, options = {}) {
  if (!options.linkCitations) options.linkCitations = [];
  if (!options.linkCitationByHref) options.linkCitationByHref = new Map();

  const existing = options.linkCitationByHref.get(href);
  if (existing) return existing;

  const index = options.linkCitations.length + 1;
  options.linkCitations.push({ index, href, label: inlineText(label) || href });
  options.linkCitationByHref.set(href, index);
  return index;
}

function renderLinkCitations(options = {}) {
  const citations = options.linkCitations || [];
  if (options.style !== "wechat" || citations.length === 0) return "";

  const items = citations
    .map(
      ({ index, href, label }) =>
        `<p${styleAttribute(wechatStyles.citationItem)}><span${styleAttribute(wechatStyles.citationIndex)}>[${index}]</span> ${escapeHtml(
          label,
        )}: <span${styleAttribute(wechatStyles.citationUrl)}>${escapeHtml(href)}</span></p>`,
    )
    .join("");
  return `<section${styleAttribute(wechatStyles.citationSection)}><p${styleAttribute(wechatStyles.citationTitle)}>引用链接</p>${items}</section>`;
}

function renderInline(value, options = {}) {
  const tokens = [];
  let source = value;
  const stash = (html) => {
    const token = `@@HTML_TOKEN_${tokens.length}@@`;
    tokens.push([token, html]);
    return token;
  };

  source = source.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code${wechatStyle(options, "inlineCode")}>${escapeHtml(code)}</code>`));
  source = source.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src) =>
      stash(`<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"${wechatStyle(options, "image")} />`),
  );
  source = source.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href) => {
      const renderedLabel = renderInline(label, options);
      if (shouldCiteExternalLink(href, options)) {
        const index = addLinkCitation(href, label, options);
        return stash(
          `<span${wechatStyle(options, "link")}>${renderedLabel}<sup${styleAttribute(wechatStyles.citationSup)}>[${index}]</sup></span>`,
        );
      }
      return stash(`<a href="${escapeAttribute(href)}"${wechatStyle(options, "link")}>${renderedLabel}</a>`);
    },
  );

  let html = escapeHtml(source)
    .replace(/\*\*([^*]+)\*\*/g, `<strong${wechatStyle(options, "strong")}>$1</strong>`)
    .replace(/\*([^*\n]+)\*/g, `<em${wechatStyle(options, "em")}>$1</em>`)
    .replace(/~~([^~]+)~~/g, `<del${wechatStyle(options, "del")}>$1</del>`);

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

async function main() {
  rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);

  const manifest = [];
  for (const { filePath, slug, assetDir } of articleEntries(sourceDir)) {
    const { raw, body } = splitFrontmatter(readFileSync(filePath, "utf8"));
    const data = parseYaml(raw);
    assertNoInlineMath(body, path.relative(root, filePath));
    const articleDir = path.join(outputDir, slug);
    ensureDir(articleDir);

    const title = data.title || slug;
    const cover = data.cover || null;
    const publishedBody = appendDisclaimer(body, data.disclaimer);
    const plain = markdownToPlainText(publishedBody);
    const sourcePlain = markdownToPlainText(body);
    const insertItems = markdownInsertItems(publishedBody);
    const formulaAssets = await renderWechatFormulaAssets(
      insertItems.filter((item) => item.kind === "formula"),
      articleDir,
    );
    const xArticle = `# ${title}\n\n${publishedBody}\n`;
    const xTeaser = `${title}\n\n${sourcePlain.split(/\n\s*\n/)[0] ?? ""}`;
    const articleHtml = [
      markdownToWechatHtml(body, {
        style: "wechat",
        citeExternalLinks: true,
        renderDisplayMath: (tex, index) => renderWechatFormulaImage(tex, index, formulaAssets.byIndex.get(index)),
      }),
      data.disclaimer ? markdownToWechatHtml(disclaimerMarkdown(data.disclaimer), { style: "wechat" }) : "",
    ]
      .filter(Boolean)
      .join("\n");
    const xArticleBodyHtml = markdownToXArticleBodyHtml(publishedBody);
    const xArticleHtml = renderXArticlePreview({
      title,
      bodyHtml: xArticleBodyHtml,
      cover,
      insertItems,
    });
    const wechatHtml = [
      `<!-- title: ${escapeHtml(title)} -->`,
      `<!-- series: ${escapeHtml(data.series || "")} -->`,
      articleHtml,
      "",
    ].join("\n");

    writeFileSync(path.join(articleDir, "x-article.md"), xArticle);
    writeFileSync(path.join(articleDir, "x-article.html"), xArticleHtml);
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
          cover,
          disclaimer: data.disclaimer || null,
          status: data.status || "draft",
          words: countWords(plain),
          files: ["x-article.md", "x-article.html", "x-teaser.txt", "wechat.html", ...formulaAssets.files, ...assetFiles],
        },
        null,
        2,
      ) + "\n",
    );
    manifest.push({ slug, title, status: data.status || "draft" });
  }

  writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Exported ${manifest.length} platform article(s) to ${path.relative(root, outputDir)}.`);
}

main()
  .finally(shutdownMathJax)
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
