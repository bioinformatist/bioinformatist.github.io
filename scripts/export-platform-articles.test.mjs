import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const exporter = fileURLToPath(new URL("./export-platform-articles.mjs", import.meta.url));

function articleContents(html, id) {
  const match = html.match(new RegExp(`<article id="${id}"[^>]*>([\\s\\S]*?)</article>`));
  assert.ok(match, `expected article#${id}`);
  return match[1];
}

test("formula renderer has a CJK font for text units", () => {
  const result = spawnSync("magick", ["-list", "font"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Noto Sans CJK/, "expected Noto Sans CJK in ImageMagick's font list");
});

test("exports inline math per platform and provides publish/review modes", () => {
  const root = mkdtempSync(path.join(tmpdir(), "platform-export-test-"));
  const articleDir = path.join(root, "src/content/platformArticles/fixture");
  mkdirSync(articleDir, { recursive: true });
  writeFileSync(
    path.join(articleDir, "index.md"),
    `---
title: "Fixture"
x_caption: "A concise caption."
channels: ["x-article", "wechat"]
status: "draft"
---

概率是 $p = 0.5$。

[上一篇文章](../previous/index.md)

收益率是 $-2.70\\%$。

![示例图](chart.png)

$$
E[X] = 0\\text{ 元}
$$

重复 $n$ 次。

| A | B |
| --- | --- |
| 1 | 2 |

\`\`\`text
line one
line two
\`\`\`
`,
  );
  const previousDir = path.join(root, "src/content/platformArticles/previous");
  mkdirSync(previousDir, { recursive: true });
  writeFileSync(
    path.join(previousDir, "index.md"),
    `---
title: "Previous"
status: "published"
x_url: "https://x.com/example/status/1"
wechat_url: "https://mp.weixin.qq.com/s/example"
---

Previous article.
`,
  );
  writeFileSync(path.join(articleDir, "chart-x.png"), "");

  try {
    const result = spawnSync(process.execPath, [exporter], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const outputDir = path.join(root, "platform-exports/fixture");
    const xHtml = readFileSync(path.join(outputDir, "x-article.html"), "utf8");
    const wechatHtml = readFileSync(path.join(outputDir, "wechat.html"), "utf8");
    const publishHtml = articleContents(xHtml, "publishArticle");
    const reviewHtml = articleContents(xHtml, "reviewArticle");

    assert.match(xHtml, /data-preview-mode="publish"/);
    assert.match(xHtml, /data-preview-mode="review"/);
    assert.match(xHtml, /id="selectCaption"/);
    assert.match(xHtml, /id="captionText">A concise caption\.<\/span>/);
    assert.match(publishHtml, /href="https:\/\/x\.com\/example\/status\/1"/);
    assert.doesNotMatch(publishHtml, /mp\.weixin\.qq\.com\/s\/example/);
    assert.equal((publishHtml.match(/class="math-inline-source"/g) || []).length, 3);
    assert.doesNotMatch(publishHtml, /<svg/);
    assert.match(publishHtml, /class="math-inline-source"[^>]*>p = 0\.5<\/span>/);
    assert.match(publishHtml, /class="math-inline-source"[^>]*>-2\.70%<\/span>/);
    assert.match(publishHtml, /【图片 1/);
    assert.match(xHtml, /<code>chart-x\.png<\/code>/);
    assert.match(reviewHtml, /<figure[\s\S]*chart\.png/);
    assert.equal((reviewHtml.match(/class="math-inline"/g) || []).length, 3);
    assert.match(reviewHtml, /class="math-display"[\s\S]*<svg/);
    assert.match(reviewHtml, />元<\/text>/);
    assert.match(reviewHtml, /<table/);
    assert.match(reviewHtml, /<pre/);

    assert.doesNotMatch(wechatHtml, /\$p = 0\.5\$/);
    assert.match(wechatHtml, /概率是 p = 0\.5。/);
    assert.match(wechatHtml, /收益率是 -2\.70%。/);
    assert.doesNotMatch(wechatHtml, /\\%/);
    assert.match(wechatHtml, /href="https:\/\/mp\.weixin\.qq\.com\/s\/example"/);
    assert.doesNotMatch(wechatHtml, /x\.com\/example\/status\/1/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
