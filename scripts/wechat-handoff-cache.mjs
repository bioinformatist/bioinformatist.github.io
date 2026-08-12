import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const cacheVersion = 1;
const sha256Pattern = /^[a-f0-9]{64}$/;
const freshHandoffHint = "Run a fresh `npm run wechat:handoff -- <slug>` to refresh uploads.";

function fail(message) {
  throw new Error(`${message} ${freshHandoffHint}`);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function assetPath(articleOutputDir, relativePath) {
  const base = path.resolve(articleOutputDir);
  const resolved = path.resolve(base, relativePath);
  if (resolved === base || !resolved.startsWith(`${base}${path.sep}`)) {
    fail(`Cached asset path is invalid: ${relativePath}.`);
  }
  return resolved;
}

function normalizeReplacements(replacements) {
  if (replacements instanceof Map) return replacements;
  if (isRecord(replacements)) return new Map(Object.entries(replacements));
  throw new TypeError("Upload replacements must be a Map or plain object.");
}

function validateImageUrl(imagePath, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`Cached upload URL is invalid for ${imagePath}.`);
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "mmbiz.qpic.cn") {
    fail(`Cached upload URL is invalid for ${imagePath}.`);
  }
}

function validateCacheShape(cache, cachePath, slug) {
  if (!isRecord(cache)) fail(`Upload cache is invalid: ${cachePath}.`);
  if (cache.version !== cacheVersion) fail(`Upload cache schema is invalid: ${cachePath}.`);
  if (cache.slug !== slug) fail(`Upload cache slug mismatch at ${cachePath}: expected ${slug}.`);
  if (typeof cache.created_at !== "string" || Number.isNaN(Date.parse(cache.created_at))) {
    fail(`Upload cache timestamp is invalid: ${cachePath}.`);
  }
  if (!isRecord(cache.content_images)) fail(`Upload cache content_images is invalid: ${cachePath}.`);
  if (!isRecord(cache.cover)) fail(`Upload cache cover is invalid: ${cachePath}.`);

  for (const [imagePath, entry] of Object.entries(cache.content_images)) {
    if (!imagePath || !isRecord(entry)) fail(`Cached body image entry is invalid: ${imagePath || cachePath}.`);
    if (!sha256Pattern.test(entry.sha256 || "")) fail(`Cached SHA-256 is invalid for ${imagePath}.`);
    validateImageUrl(imagePath, entry.url);
  }

  if (typeof cache.cover.source !== "string" || !cache.cover.source) {
    fail(`Cached cover source is invalid: ${cachePath}.`);
  }
  if (!sha256Pattern.test(cache.cover.sha256 || "")) {
    fail(`Cached SHA-256 is invalid for ${cache.cover.source}.`);
  }
  if (typeof cache.cover.media_id !== "string" || !cache.cover.media_id.trim()) {
    fail(`Cached cover media ID is invalid for ${cache.cover.source}.`);
  }
}

export function writeHandoffCache({
  cachePath,
  slug,
  articleOutputDir,
  imageSources,
  replacements,
  coverSource,
  coverMediaId,
  createdAt = new Date().toISOString(),
}) {
  const uploadedImages = normalizeReplacements(replacements);
  const sortedImageSources = [...imageSources].sort();
  const contentImages = {};

  for (const imageSource of sortedImageSources) {
    if (!uploadedImages.has(imageSource)) {
      throw new Error(`Fresh upload result is missing body image: ${imageSource}.`);
    }
    const url = uploadedImages.get(imageSource);
    validateImageUrl(imageSource, url);
    contentImages[imageSource] = {
      sha256: sha256File(assetPath(articleOutputDir, imageSource)),
      url,
    };
  }
  if (uploadedImages.size !== sortedImageSources.length) {
    throw new Error("Fresh upload result contains an unexpected body image path.");
  }
  if (typeof coverMediaId !== "string" || !coverMediaId.trim()) {
    throw new Error(`Fresh upload result is missing a cover media ID for ${coverSource}.`);
  }

  const cache = {
    version: cacheVersion,
    slug,
    created_at: createdAt,
    content_images: contentImages,
    cover: {
      source: coverSource,
      sha256: sha256File(assetPath(articleOutputDir, coverSource)),
      media_id: coverMediaId,
    },
  };

  mkdirSync(path.dirname(cachePath), { recursive: true });
  const temporaryPath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(cache, null, 2)}\n`, { flag: "wx" });
    renameSync(temporaryPath, cachePath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
  return cache;
}

export function reuseHandoffCache({
  cachePath,
  slug,
  articleOutputDir,
  imageSources,
  coverSource,
}) {
  let cache;
  try {
    cache = JSON.parse(readFileSync(cachePath, "utf8"));
  } catch (error) {
    fail(`Cannot read upload cache ${cachePath}: ${error.message}.`);
  }
  validateCacheShape(cache, cachePath, slug);

  const currentPaths = [...imageSources].sort();
  const cachedPaths = Object.keys(cache.content_images).sort();
  const missingPath = currentPaths.find((imagePath) => !Object.hasOwn(cache.content_images, imagePath));
  if (missingPath) fail(`Upload cache is missing body image path: ${missingPath}.`);
  const unexpectedPath = cachedPaths.find((imagePath) => !currentPaths.includes(imagePath));
  if (unexpectedPath) fail(`Upload cache has unexpected body image path: ${unexpectedPath}.`);

  const replacements = new Map();
  for (const imagePath of currentPaths) {
    const entry = cache.content_images[imagePath];
    const currentHash = sha256File(assetPath(articleOutputDir, imagePath));
    if (currentHash !== entry.sha256) fail(`Body image changed: ${imagePath}.`);
    replacements.set(imagePath, entry.url);
  }

  if (cache.cover.source !== coverSource) {
    fail(`Cover source changed: expected ${cache.cover.source}, found ${coverSource}.`);
  }
  const currentCoverHash = sha256File(assetPath(articleOutputDir, coverSource));
  if (currentCoverHash !== cache.cover.sha256) fail(`Cover image changed: ${coverSource}.`);

  return { replacements, coverMediaId: cache.cover.media_id };
}
