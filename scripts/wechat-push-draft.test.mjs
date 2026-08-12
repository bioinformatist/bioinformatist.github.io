import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { writeHandoffCache } from "./wechat-handoff-cache.mjs";

const exporter = fileURLToPath(new URL("./export-platform-articles.mjs", import.meta.url));
const pushDraft = fileURLToPath(new URL("./wechat-push-draft.mjs", import.meta.url));

function createArticleFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "wechat-push-draft-"));
  const articleDir = path.join(root, "src/content/platformArticles/fixture");
  mkdirSync(articleDir, { recursive: true });
  symlinkSync(path.dirname(pushDraft), path.join(root, "scripts"), "dir");
  writeFileSync(
    path.join(articleDir, "index.md"),
    `---
title: "Fixture"
description: "Fixture digest"
cover: "cover.png"
channels: ["wechat"]
status: "draft"
---

Fixture body.
`,
  );
  writeFileSync(path.join(articleDir, "cover.png"), "cover image bytes");
  return { root, articleDir };
}

function cleanWechatEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(WECHAT|WX)_/.test(key)) delete env[key];
  }
  return env;
}

test("official API dry-run applies publication settings from .env.local", () => {
  const fixture = createArticleFixture();
  writeFileSync(
    path.join(fixture.root, ".env.local"),
    [
      "WECHAT_AUTHOR=Fixture Author",
      "WECHAT_NEED_OPEN_COMMENT=1",
      "WECHAT_ONLY_FANS_CAN_COMMENT=1",
      "",
    ].join("\n"),
  );

  try {
    const result = spawnSync(process.execPath, [pushDraft, "fixture", "--dry-run"], {
      cwd: fixture.root,
      encoding: "utf8",
      env: cleanWechatEnv(),
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const payload = JSON.parse(
      readFileSync(
        path.join(fixture.root, "platform-exports/fixture/wechat-draft-payload.dry-run.json"),
        "utf8",
      ),
    );
    assert.equal(payload.articles[0].author, "Fixture Author");
    assert.equal(payload.articles[0].need_open_comment, 1);
    assert.equal(payload.articles[0].only_fans_can_comment, 1);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("upload reuse does not read .env.local", () => {
  const fixture = createArticleFixture();

  try {
    const exportResult = spawnSync(process.execPath, [exporter], {
      cwd: fixture.root,
      encoding: "utf8",
      env: cleanWechatEnv(),
    });
    assert.equal(exportResult.status, 0, exportResult.stderr || exportResult.stdout);

    const articleOutputDir = path.join(fixture.root, "platform-exports/fixture");
    writeHandoffCache({
      cachePath: path.join(fixture.root, ".wechat-handoff-cache/fixture.json"),
      slug: "fixture",
      articleOutputDir,
      imageSources: [],
      replacements: new Map(),
      coverSource: "cover.png",
      coverMediaId: "cover-media-id",
    });
    mkdirSync(path.join(fixture.root, ".env.local"));

    const result = spawnSync(
      process.execPath,
      [pushDraft, "fixture", "--editor-handoff", "--reuse-uploads"],
      {
        cwd: fixture.root,
        encoding: "utf8",
        env: cleanWechatEnv(),
      },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Prepared WeChat editor handoff for fixture/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
