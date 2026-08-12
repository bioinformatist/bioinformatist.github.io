import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { reuseHandoffCache, writeHandoffCache } from "./wechat-handoff-cache.mjs";

function createFixture() {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "wechat-handoff-cache-"));
  const articleOutputDir = path.join(tempDir, "article");
  const cachePath = path.join(tempDir, ".wechat-handoff-cache", "article.json");
  const imageSources = ["images/second.png", "images/first.png"];
  const coverSource = "cover.png";
  mkdirSync(path.join(articleOutputDir, "images"), { recursive: true });
  writeFileSync(path.join(articleOutputDir, "images/first.png"), "first image bytes");
  writeFileSync(path.join(articleOutputDir, "images/second.png"), "second image bytes");
  writeFileSync(path.join(articleOutputDir, coverSource), "cover image bytes");

  return { tempDir, articleOutputDir, cachePath, imageSources, coverSource };
}

function writeValidCache(overrides = {}) {
  const state = createFixture();
  const replacements = new Map([
    ["images/first.png", "https://mmbiz.qpic.cn/first.png"],
    ["images/second.png", "https://mmbiz.qpic.cn/second.png"],
  ]);
  writeHandoffCache({
    ...state,
    slug: "article",
    replacements,
    coverMediaId: "cover-media-id",
    createdAt: "2026-08-12T00:00:00.000Z",
    ...overrides,
  });
  return { ...state, replacements };
}

function cacheJson(cachePath) {
  return JSON.parse(readFileSync(cachePath, "utf8"));
}

function overwriteCache(cachePath, mutate) {
  const cache = cacheJson(cachePath);
  mutate(cache);
  writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}

function assertFreshFailure(callback, pattern) {
  assert.throws(callback, (error) => {
    assert.match(error.message, pattern);
    assert.match(error.message, /fresh `npm run wechat:handoff/);
    return true;
  });
}

function allObjectKeys(value) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...allObjectKeys(child)]);
}

test("atomically writes and reuses an exact upload cache independent of object ordering", () => {
  const state = writeValidCache();
  const cache = cacheJson(state.cachePath);

  assert.deepEqual(Object.keys(cache.content_images), ["images/first.png", "images/second.png"]);
  assert.equal(cache.version, 1);
  assert.equal(cache.slug, "article");
  assert.equal(cache.cover.media_id, "cover-media-id");
  assert.deepEqual(
    allObjectKeys(cache).filter((key) => /^(content|token|credential|cookie|secret)$/i.test(key)),
    [],
  );
  assert.deepEqual(readdirSync(path.dirname(state.cachePath)), ["article.json"]);

  cache.content_images = {
    "images/second.png": cache.content_images["images/second.png"],
    "images/first.png": cache.content_images["images/first.png"],
  };
  writeFileSync(state.cachePath, `${JSON.stringify(cache, null, 2)}\n`);

  const reused = reuseHandoffCache({ ...state, slug: "article" });
  assert.deepEqual(reused.replacements, state.replacements);
  assert.equal(reused.coverMediaId, "cover-media-id");
});

test("cleans the temporary file and preserves the destination when replacement fails", () => {
  const state = createFixture();
  const sentinelPath = path.join(state.cachePath, "sentinel");
  mkdirSync(state.cachePath, { recursive: true });
  writeFileSync(sentinelPath, "unchanged");

  assert.throws(
    () => writeHandoffCache({
      ...state,
      slug: "article",
      replacements: new Map([
        ["images/first.png", "https://mmbiz.qpic.cn/first.png"],
        ["images/second.png", "https://mmbiz.qpic.cn/second.png"],
      ]),
      coverMediaId: "cover-media-id",
    }),
  );

  assert.equal(readFileSync(sentinelPath, "utf8"), "unchanged");
  assert.deepEqual(readdirSync(path.dirname(state.cachePath)), [path.basename(state.cachePath)]);
});

test("fails closed when the current body-image path set changes", () => {
  const state = writeValidCache();
  assert.throws(
    () => reuseHandoffCache({ ...state, slug: "article", imageSources: ["images/first.png"] }),
    /unexpected body image path: images\/second\.png.*fresh `npm run wechat:handoff/,
  );
  assert.throws(
    () => reuseHandoffCache({ ...state, slug: "article", imageSources: [...state.imageSources, "images/new.png"] }),
    /missing body image path: images\/new\.png.*fresh `npm run wechat:handoff/,
  );
});

test("fails closed when body-image bytes change", () => {
  const state = writeValidCache();
  writeFileSync(path.join(state.articleOutputDir, "images/first.png"), "changed bytes");
  assert.throws(
    () => reuseHandoffCache({ ...state, slug: "article" }),
    /Body image changed: images\/first\.png.*fresh `npm run wechat:handoff/,
  );
});

test("fails closed when cover bytes or source change", () => {
  const changedBytes = writeValidCache();
  writeFileSync(path.join(changedBytes.articleOutputDir, changedBytes.coverSource), "changed cover bytes");
  assert.throws(
    () => reuseHandoffCache({ ...changedBytes, slug: "article" }),
    /Cover image changed: cover\.png.*fresh `npm run wechat:handoff/,
  );

  const changedSource = writeValidCache();
  assert.throws(
    () => reuseHandoffCache({ ...changedSource, slug: "article", coverSource: "other-cover.png" }),
    /Cover source changed: expected cover\.png, found other-cover\.png.*fresh `npm run wechat:handoff/,
  );
});

test("fails closed for a missing, malformed, or wrong-slug cache", () => {
  const missing = createFixture();
  assert.throws(
    () => reuseHandoffCache({ ...missing, slug: "article" }),
    /Cannot read upload cache.*fresh `npm run wechat:handoff/,
  );

  const malformed = writeValidCache();
  writeFileSync(malformed.cachePath, "not json");
  assert.throws(
    () => reuseHandoffCache({ ...malformed, slug: "article" }),
    /Cannot read upload cache.*fresh `npm run wechat:handoff/,
  );

  const wrongSlug = writeValidCache();
  assert.throws(
    () => reuseHandoffCache({ ...wrongSlug, slug: "different-article" }),
    /slug mismatch.*expected different-article.*fresh `npm run wechat:handoff/,
  );
});

test("fails closed for an invalid schema, digest, URL, or cover media ID", () => {
  for (const [mutate, pattern] of [
    [(cache) => { cache.version = 2; }, /schema is invalid/],
    [(cache) => { cache.content_images["images/first.png"].sha256 = "bad"; }, /SHA-256 is invalid for images\/first\.png/],
    [(cache) => { cache.content_images["images/first.png"].url = "https://example.com/image.png"; }, /upload URL is invalid for images\/first\.png/],
    [(cache) => { cache.cover.media_id = ""; }, /cover media ID is invalid for cover\.png/],
  ]) {
    const state = writeValidCache();
    overwriteCache(state.cachePath, mutate);
    assertFreshFailure(
      () => reuseHandoffCache({ ...state, slug: "article" }),
      pattern,
    );
  }
});
