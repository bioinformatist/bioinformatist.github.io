import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { renderWechatEditorHandoff } from "./wechat-editor-handoff-page.mjs";

function embeddedPayload(html) {
  const match = html.match(/<script type="application\/json" id="handoffPayload">([\s\S]*?)<\/script>/);
  assert.ok(match, "expected embedded handoff payload");
  return JSON.parse(match[1]);
}

test("renders a COSE handoff page without exposing article HTML as executable markup", () => {
  const content = '<p>正文</p><img src="https://mmbiz.qpic.cn/example.png"><script>bad()</script>';
  const previewContent = '<p>预览</p><img src="chart.png">';
  const html = renderWechatEditorHandoff({
    title: "标题 </script>",
    digest: "摘要",
    content,
    previewContent,
    cover: "cover.png",
    contentImageCount: 1,
    coverMediaId: "cover-media-id",
  });
  const payload = embeddedPayload(html);

  assert.equal(payload.title, "标题 </script>");
  assert.equal(payload.content, content);
  assert.equal(payload.previewContent, previewContent);
  assert.equal(payload.coverMediaId, "cover-media-id");
  assert.doesNotMatch(html, /标题 <\/script>/);
  assert.doesNotMatch(html, /<script>bad\(\)<\/script>/);
  assert.match(html, /window\.\$cose\.addTask/);
  assert.match(html, /async function waitForCose/);
  assert.match(html, /while \(!window\.\$cose && Date\.now\(\) < deadline\)/);
  assert.match(html, /正在等待 COSE 扩展注入/);
  assert.match(html, /COSE 的首次 token 检测已经超时/);
  assert.match(html, /重新推入微信草稿箱/);
  assert.match(html, /封面已上传素材库，但需要在公众号后台手动选用/);
  assert.match(html, /ilhikcdphhpjofhlnbojifbihhfmmhfk/);
  assert.match(html, /推入微信草稿箱/);
});

test("disables external mutation for a dry-run handoff", () => {
  const html = renderWechatEditorHandoff({
    title: "Dry run",
    content: "<p>Preview only</p>",
    cover: "cover.png",
    contentImageCount: 0,
    dryRun: true,
  });

  assert.equal(embeddedPayload(html).dryRun, true);
  assert.match(html, /这是 dry-run 交接页，不会创建草稿/);
});

test("waits for COSE when the extension injects after the page script runs", async () => {
  const html = renderWechatEditorHandoff({
    title: "Delayed extension",
    content: "<p>正文</p>",
    cover: "cover.png",
    contentImageCount: 0,
  });
  const scriptMatch = html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
  assert.ok(scriptMatch, "expected the handoff page script");

  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        addEventListener() {},
        dataset: {},
        disabled: false,
        hidden: false,
        innerHTML: "",
        src: "",
        textContent: "",
      });
    }
    return elements.get(id);
  };
  element("handoffPayload").textContent = JSON.stringify(embeddedPayload(html));

  const pageWindow = {};
  vm.runInNewContext(scriptMatch[1], {
    Date,
    JSON,
    Promise,
    document: { getElementById: element },
    setTimeout,
    window: pageWindow,
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  pageWindow.$cose = { getAccounts: async () => [] };
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.match(element("statusText").textContent, /COSE 已就绪/);
  assert.equal(element("sendButton").disabled, false);
  assert.equal(element("extensionLink").hidden, true);
});
