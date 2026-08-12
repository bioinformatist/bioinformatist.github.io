import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { renderWechatEditorHandoff } from "./wechat-editor-handoff-page.mjs";

const root = process.cwd();
const sourceDir = path.join(root, "src/content/platformArticles");
const outputDir = path.join(root, "platform-exports");
const wechatContentCharLimit = 20000;
const wechatContentByteLimit = 1024 * 1024;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const editorHandoff = args.includes("--editor-handoff") || args.includes("--handoff");
const serveHandoff = args.includes("--serve");
const updateMediaId = optionValue("--update-media-id", "--update");
const slug = args.find((arg, index) => !arg.startsWith("--") && !["--update-media-id", "--update"].includes(args[index - 1]));

loadEnvLocal(path.join(root, ".env.local"));

function optionValue(...names) {
  for (const name of names) {
    const index = args.indexOf(name);
    if (index !== -1) return args[index + 1] || "";
  }
  return "";
}

function loadEnvLocal(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = unquoteEnvValue(rawValue.trim());
  }
}

function unquoteEnvValue(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function envValue(...keys) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return "";
}

function requireEnv(...keys) {
  const value = envValue(...keys);
  if (!value) {
    throw new Error(`Missing environment variable. Set one of: ${keys.join(", ")}`);
  }
  return value;
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

function runPlatformExport() {
  const result = spawnSync(process.execPath, [path.join("scripts", "export-platform-articles.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("Platform export failed.");
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function selectArticleSlug(manifest) {
  if (slug) {
    if (!manifest.some((entry) => entry.slug === slug)) {
      throw new Error(`Unknown platform article slug: ${slug}`);
    }
    return slug;
  }
  if (manifest.length === 1) return manifest[0].slug;
  throw new Error("Multiple platform articles found. Pass a slug, for example: npm run wechat:draft -- grid-strategy-expected-value");
}

function prepareWechatApiHtml(html) {
  return html
    .replace(/^<!--[\s\S]*?-->\n?/gm, "")
    .replace(/<figure\b[^>]*>\s*(<img\b[^>]*>)\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g, (_, img, caption) =>
      `<section style="margin:1.4em 0;text-align:center;">${img}${
        caption
          ? `<p style="margin:.45em 0 0;color:#888;font-size:13px;line-height:1.55;text-align:center;"><em>${caption}</em></p>`
          : ""
      }</section>`,
    )
    .replace(/\s(?:class|target|rel)="[^"]*"/g, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/<br\s*\/?>/g, "<br/>")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectLocalImageSources(html) {
  const sources = new Set();
  const imagePattern = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g;
  let match;
  while ((match = imagePattern.exec(html)) !== null) {
    const src = match[1];
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) continue;
    sources.add(src);
  }
  return [...sources];
}

function resolveInside(baseDir, relativePath) {
  const resolved = path.resolve(baseDir, relativePath);
  const base = path.resolve(baseDir);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Path escapes article export directory: ${relativePath}`);
  }
  return resolved;
}

function replaceAllLiteral(text, from, to) {
  return text.split(from).join(to);
}

function dryRunUploadedImageUrl(index) {
  return `https://mmbiz.qpic.cn/mmbiz_png/${"x".repeat(120)}/${index}.png`;
}

function mimeTypeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function assertUploadImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) {
    throw new Error(`WeChat content images must be jpg or png: ${path.relative(root, filePath)}`);
  }
  const size = statSync(filePath).size;
  if (size >= 1024 * 1024) {
    throw new Error(`WeChat content images must be below 1MB: ${path.relative(root, filePath)} (${formatBytes(size)})`);
  }
}

function assertPermanentImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".bmp", ".gif", ".jpeg", ".jpg", ".png"].includes(ext)) {
    throw new Error(`WeChat cover image must be bmp/gif/jpeg/jpg/png: ${path.relative(root, filePath)}`);
  }
  const size = statSync(filePath).size;
  if (size > 10 * 1024 * 1024) {
    throw new Error(`WeChat cover image must be 10MB or smaller: ${path.relative(root, filePath)} (${formatBytes(size)})`);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function assertFieldLength(label, value, limit) {
  if (!value) return;
  const length = Array.from(value).length;
  if (length > limit) {
    throw new Error(`${label} is too long for WeChat draft API: ${length}/${limit}`);
  }
}

function assertContentLength(content) {
  const chars = Array.from(content).length;
  const bytes = Buffer.byteLength(content, "utf8");
  if (chars >= wechatContentCharLimit) {
    throw new Error(
      [
        `WeChat /draft/add route blocked: content must be below ${wechatContentCharLimit.toLocaleString("en-US")} characters after HTML compaction and image URL replacement; got ${chars}.`,
        "Do not keep stripping article structure just to force it through the official API.",
        "Run `npm run wechat:handoff -- <slug>` to upload the assets and hand the rendered article to the WeChat editor through COSE.",
      ].join("\n"),
    );
  }
  if (bytes >= wechatContentByteLimit) {
    throw new Error(
      [
        `WeChat /draft/add route blocked: content must be below 1MB after HTML compaction and image URL replacement; got ${formatBytes(bytes)}.`,
        "Run `npm run wechat:handoff -- <slug>` to use the browser-editor route.",
      ].join("\n"),
    );
  }
}

async function postJson(url, payload, label) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseWechatResponse(response, label);
}

async function postForm(url, filePath, label) {
  const form = new FormData();
  const data = readFileSync(filePath);
  form.append("media", new Blob([data], { type: mimeTypeFor(filePath) }), path.basename(filePath));
  const response = await fetch(url, { method: "POST", body: form });
  return parseWechatResponse(response, label);
}

async function parseWechatResponse(response, label) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned non-JSON response (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok || (data.errcode && data.errcode !== 0)) {
    if (data.errcode === 40164) {
      throw new Error(
        `${label} failed: ${JSON.stringify(data)}\nAdd this machine's public outbound IP to the WeChat API IP whitelist, then retry.`,
      );
    }
    throw new Error(`${label} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function getAccessToken() {
  const existing = envValue("WECHAT_ACCESS_TOKEN", "WX_ACCESS_TOKEN");
  if (existing) return existing;

  const appid = requireEnv("WECHAT_APP_ID", "WECHAT_APPID", "WX_APP_ID", "WX_APPID");
  const secret = requireEnv("WECHAT_APP_SECRET", "WECHAT_APPSECRET", "WX_APP_SECRET", "WX_APPSECRET");
  const result = await postJson(
    "https://api.weixin.qq.com/cgi-bin/stable_token",
    {
      grant_type: "client_credential",
      appid,
      secret,
      force_refresh: false,
    },
    "get stable access_token",
  );
  if (!result.access_token) throw new Error(`get stable access_token returned no access_token: ${JSON.stringify(result)}`);
  return result.access_token;
}

async function uploadContentImage(accessToken, filePath) {
  assertUploadImageFile(filePath);
  const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${encodeURIComponent(accessToken)}`;
  const result = await postForm(url, filePath, `upload content image ${path.basename(filePath)}`);
  if (!result.url) throw new Error(`upload content image returned no url: ${JSON.stringify(result)}`);
  return result.url.replace(/^http:\/\/mmbiz\.qpic\.cn\//, "https://mmbiz.qpic.cn/");
}

async function uploadCoverImage(accessToken, filePath) {
  assertPermanentImageFile(filePath);
  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(accessToken)}&type=image`;
  const result = await postForm(url, filePath, `upload cover image ${path.basename(filePath)}`);
  if (!result.media_id) throw new Error(`upload cover image returned no media_id: ${JSON.stringify(result)}`);
  return result.media_id;
}

function integerFlag(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  return Number.parseInt(String(value), 10) ? 1 : 0;
}

function articleMetadata(frontmatter, manifest) {
  return {
    title: frontmatter.title || manifest.title || manifest.slug,
    author: frontmatter.author || envValue("WECHAT_AUTHOR", "WX_AUTHOR"),
    digest: frontmatter.digest || frontmatter.description || "",
  };
}

function buildArticlePayload({ frontmatter, manifest, content, thumbMediaId }) {
  const { title, author, digest } = articleMetadata(frontmatter, manifest);
  const article = {
    article_type: "news",
    title,
    content,
    thumb_media_id: thumbMediaId,
    need_open_comment: integerFlag(frontmatter.need_open_comment ?? envValue("WECHAT_NEED_OPEN_COMMENT"), 0),
    only_fans_can_comment: integerFlag(frontmatter.only_fans_can_comment ?? envValue("WECHAT_ONLY_FANS_CAN_COMMENT"), 0),
  };

  if (author) article.author = author;
  if (digest) article.digest = digest;
  if (frontmatter.content_source_url) article.content_source_url = frontmatter.content_source_url;
  if (frontmatter.pic_crop_235_1) article.pic_crop_235_1 = frontmatter.pic_crop_235_1;
  if (frontmatter.pic_crop_1_1) article.pic_crop_1_1 = frontmatter.pic_crop_1_1;

  assertFieldLength("title", article.title, 32);
  assertFieldLength("author", article.author, 16);
  assertFieldLength("digest", article.digest, 128);
  assertContentLength(article.content);
  return { articles: [article] };
}

async function addDraft(accessToken, payload) {
  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(accessToken)}`;
  const result = await postJson(url, payload, "add WeChat draft");
  if (!result.media_id) throw new Error(`add WeChat draft returned no media_id: ${JSON.stringify(result)}`);
  return result.media_id;
}

async function updateDraft(accessToken, mediaId, payload) {
  const url = `https://api.weixin.qq.com/cgi-bin/draft/update?access_token=${encodeURIComponent(accessToken)}`;
  await postJson(
    url,
    {
      media_id: mediaId,
      index: 0,
      articles: payload.articles[0],
    },
    "update WeChat draft",
  );
  return mediaId;
}

async function uploadAndReplaceContentImages(accessToken, articleOutputDir, content, imageSources) {
  const replacements = new Map();
  let uploadedContent = content;

  for (const imageSource of imageSources) {
    const imagePath = resolveInside(articleOutputDir, imageSource);
    const uploadedUrl = await uploadContentImage(accessToken, imagePath);
    replacements.set(imageSource, uploadedUrl);
    uploadedContent = replaceAllLiteral(uploadedContent, `src="${imageSource}"`, `src="${uploadedUrl}"`);
  }

  return { content: uploadedContent, replacements };
}

function writeEditorHandoff({
  selectedSlug,
  articleOutputDir,
  articleManifest,
  frontmatter,
  content,
  previewContent,
  imageSources,
  cover,
  coverMediaId,
  replacements,
}) {
  const { title, digest } = articleMetadata(frontmatter, articleManifest);
  const handoffPath = path.join(articleOutputDir, "wechat-handoff.html");
  const resultPath = path.join(articleOutputDir, "wechat-handoff-result.json");

  writeFileSync(
    handoffPath,
    renderWechatEditorHandoff({
      title,
      digest,
      content,
      previewContent,
      cover,
      contentImageCount: imageSources.length,
      coverMediaId,
      dryRun,
    }),
  );
  writeFileSync(
    resultPath,
    JSON.stringify(
      {
        slug: selectedSlug,
        title,
        mode: "editor-handoff",
        dry_run: dryRun,
        content_images: Object.fromEntries(replacements),
        cover,
        cover_media_id: coverMediaId || null,
        created_at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );

  console.log(`${dryRun ? "Prepared dry-run" : "Prepared"} WeChat editor handoff for ${selectedSlug}.`);
  console.log(`Wrote ${path.relative(root, handoffPath)}.`);
  console.log(`Wrote ${path.relative(root, resultPath)}.`);

  if (serveHandoff) {
    const result = spawnSync(
      process.execPath,
      [path.join("scripts", "serve-platform-export.mjs"), selectedSlug, "--no-export", "--open=wechat-handoff.html"],
      {
        cwd: root,
        stdio: "inherit",
      },
    );
    if (result.signal === "SIGINT" || result.signal === "SIGTERM") return;
    if (result.status !== 0) {
      throw new Error("WeChat handoff preview server failed.");
    }
  }
}

async function main() {
  runPlatformExport();

  const rootManifest = readJson(path.join(outputDir, "manifest.json"));
  const selectedSlug = selectArticleSlug(rootManifest);
  const articleOutputDir = path.join(outputDir, selectedSlug);
  const articleManifest = readJson(path.join(articleOutputDir, "manifest.json"));
  const sourcePath = path.join(sourceDir, selectedSlug, "index.md");
  const { raw } = splitFrontmatter(readFileSync(sourcePath, "utf8"));
  const frontmatter = parseYaml(raw);

  let content = prepareWechatApiHtml(readFileSync(path.join(articleOutputDir, "wechat.html"), "utf8"));
  const imageSources = collectLocalImageSources(content);
  const cover = articleManifest.cover || frontmatter.cover;
  if (!cover) throw new Error("WeChat draft requires a cover image. Set `cover` in article frontmatter.");
  const coverPath = resolveInside(articleOutputDir, cover);
  assertPermanentImageFile(coverPath);
  for (const imageSource of imageSources) {
    assertUploadImageFile(resolveInside(articleOutputDir, imageSource));
  }

  if (editorHandoff) {
    const previewContent = content;
    let handoffContent = content;
    let coverMediaId = "";
    let replacements = new Map();

    if (!dryRun) {
      const accessToken = await getAccessToken();
      const uploadResult = await uploadAndReplaceContentImages(
        accessToken,
        articleOutputDir,
        handoffContent,
        imageSources,
      );
      handoffContent = uploadResult.content;
      replacements = uploadResult.replacements;
      coverMediaId = await uploadCoverImage(accessToken, coverPath);
    }

    writeEditorHandoff({
      selectedSlug,
      articleOutputDir,
      articleManifest,
      frontmatter,
      content: handoffContent,
      previewContent,
      imageSources,
      cover,
      coverMediaId,
      replacements,
    });
    return;
  }

  if (serveHandoff) {
    throw new Error("`--serve` is only valid with `--editor-handoff`.");
  }

  if (dryRun) {
    let dryRunContent = content;
    imageSources.forEach((imageSource, index) => {
      dryRunContent = replaceAllLiteral(dryRunContent, `src="${imageSource}"`, `src="${dryRunUploadedImageUrl(index + 1)}"`);
    });
    const payload = buildArticlePayload({
      frontmatter,
      manifest: articleManifest,
      content: dryRunContent,
      thumbMediaId: "DRY_RUN_THUMB_MEDIA_ID",
    });
    const finalChars = Array.from(dryRunContent).length;
    const dryRunPath = path.join(articleOutputDir, "wechat-draft-payload.dry-run.json");
    writeFileSync(dryRunPath, JSON.stringify(payload, null, 2) + "\n");
    console.log(`Dry run OK for ${selectedSlug}.`);
    console.log(
      `Content images: ${imageSources.length}; cover: ${cover}; estimated API HTML: ${finalChars}/${wechatContentCharLimit} chars.`,
    );
    console.log(`Wrote ${path.relative(root, dryRunPath)}.`);
    return;
  }

  const accessToken = await getAccessToken();
  const uploadResult = await uploadAndReplaceContentImages(accessToken, articleOutputDir, content, imageSources);
  content = uploadResult.content;

  const thumbMediaId = await uploadCoverImage(accessToken, coverPath);
  const payload = buildArticlePayload({ frontmatter, manifest: articleManifest, content, thumbMediaId });
  const mediaId = updateMediaId ? await updateDraft(accessToken, updateMediaId, payload) : await addDraft(accessToken, payload);
  const resultPath = path.join(articleOutputDir, "wechat-draft-result.json");
  writeFileSync(
    resultPath,
    JSON.stringify(
      {
        slug: selectedSlug,
        title: payload.articles[0].title,
        media_id: mediaId,
        mode: updateMediaId ? "update" : "add",
        content_images: imageSources.length,
        cover,
        created_at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${updateMediaId ? "Updated" : "Created"} WeChat draft for ${selectedSlug}.`);
  console.log(`Draft media_id: ${mediaId}`);
  console.log(`Wrote ${path.relative(root, resultPath)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
