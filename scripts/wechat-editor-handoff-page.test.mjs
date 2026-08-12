import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { renderWechatEditorHandoff } from "./wechat-editor-handoff-page.mjs";

function embeddedPayload(html) {
  const match = html.match(/<script type="application\/json" id="handoffPayload">([\s\S]*?)<\/script>/);
  assert.ok(match, "expected embedded handoff payload");
  return JSON.parse(match[1]);
}

function pageHarness({ dryRun = false, cose, injectCose } = {}) {
  const html = renderWechatEditorHandoff({
    title: dryRun ? "Dry run" : "Test article",
    content: "<p>正文</p>",
    cover: "cover.png",
    contentImageCount: 0,
    dryRun,
  });
  const scriptMatch = html.match(/<script>\s*([\s\S]*?)<\/script>\s*<\/body>/);
  assert.ok(scriptMatch, "expected the handoff page script");

  const elements = new Map();
  const callbacks = new Map();
  const element = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        addEventListener(event, callback) {
          callbacks.set(`${id}:${event}`, callback);
        },
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

  let now = 0;
  let timerCount = 0;
  const pageWindow = cose ? { $cose: cose } : {};
  const setTimeout = (callback, delay) => {
    timerCount += 1;
    now += delay;
    Promise.resolve().then(() => {
      injectCose?.({ pageWindow, timerCount });
      callback();
    });
  };

  vm.runInNewContext(scriptMatch[1], {
    Date: { now: () => now },
    JSON,
    Promise,
    document: { getElementById: element },
    setTimeout,
    window: pageWindow,
  });

  return {
    callback: (id, event = "click") => {
      const listener = callbacks.get(`${id}:${event}`);
      assert.ok(listener, `expected ${event} listener for ${id}`);
      return listener();
    },
    element,
    pageWindow,
  };
}

async function settle(iterations = 8) {
  for (let index = 0; index < iterations; index += 1) await Promise.resolve();
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
  assert.match(html, /打开公众号后台/);
  assert.match(html, /重新检查登录/);
});


test("preserves hidden behavior for button controls in generated stylesheet", () => {
  const html = renderWechatEditorHandoff({
    title: "标题",
    content: "<p>正文</p>",
    cover: "cover.png",
    contentImageCount: 0,
  });
  const styleMatch = html.match(/<style>[\s\S]*?<\/style>/);
  assert.ok(styleMatch, "expected style tag");
  const style = styleMatch[0];
  assert.match(style, /\.button\s*\[hidden\]\s*\{[\s\S]*?display\s*:\s*none\s*;[\s\S]*?\}/);
});

test("disables external mutation for a dry-run handoff", async () => {
  let taskCount = 0;
  const harness = pageHarness({
    dryRun: true,
    cose: {
      addTask() { taskCount += 1; },
      getAccounts: async () => [{ uid: "wechat", loggedIn: true }],
    },
  });
  await settle();

  assert.match(harness.element("statusText").textContent, /dry-run 交接页/);
  assert.equal(harness.element("sendButton").disabled, true);
  harness.callback("sendButton");
  assert.equal(taskCount, 0);
});

test("waits for delayed COSE injection and keeps send disabled when logged out", async () => {
  const harness = pageHarness({
    injectCose({ pageWindow, timerCount }) {
      if (timerCount === 1) pageWindow.$cose = { getAccounts: async () => [] };
    },
  });
  await settle();

  assert.match(harness.element("statusText").textContent, /未检测到已登录/);
  assert.equal(harness.element("sendButton").disabled, true);
  assert.equal(harness.element("loginLink").hidden, false);
  assert.equal(harness.element("recheckButton").hidden, false);
  assert.equal(harness.element("extensionLink").hidden, true);
});

test("keeps send disabled after COSE injection times out", async () => {
  let taskCount = 0;
  const harness = pageHarness();
  await settle(300);

  assert.match(harness.element("statusText").textContent, /没有检测到 COSE/);
  assert.equal(harness.element("sendButton").disabled, true);
  harness.pageWindow.$cose = { addTask() { taskCount += 1; } };
  harness.callback("sendButton");
  assert.equal(taskCount, 0);
});

test("keeps send disabled after account detection errors", async () => {
  const harness = pageHarness({
    cose: { getAccounts: async () => { throw new Error("account lookup failed"); } },
  });
  await settle();

  assert.match(harness.element("statusText").textContent, /登录状态检测失败：account lookup failed/);
  assert.equal(harness.element("sendButton").disabled, true);
  assert.equal(harness.element("loginLink").hidden, false);
  assert.equal(harness.element("recheckButton").disabled, false);
});

test("enables send only after recheck positively confirms WeChat login", async () => {
  let checkCount = 0;
  const harness = pageHarness({
    cose: {
      getAccounts: async () => {
        checkCount += 1;
        return checkCount === 1 ? [] : [{ uid: "wechat", type: "wechat", loggedIn: true }];
      },
    },
  });
  await settle();
  assert.equal(harness.element("sendButton").disabled, true);

  await harness.callback("recheckButton");
  assert.match(harness.element("statusText").textContent, /微信公众号已登录/);
  assert.equal(harness.element("sendButton").disabled, false);
  assert.equal(harness.element("loginLink").hidden, true);
});

test("invalidates a confirmed account when a later login check fails", async () => {
  let accountState = "logged-in";
  let taskCount = 0;
  const harness = pageHarness({
    cose: {
      getAccounts: async () => {
        if (accountState === "error") throw new Error("account lookup failed");
        return accountState === "logged-in"
          ? [{ uid: "wechat", type: "wechat", loggedIn: true }]
          : [];
      },
      addTask() { taskCount += 1; },
    },
  });
  await settle();
  assert.equal(harness.element("sendButton").disabled, false);

  accountState = "error";
  await harness.callback("recheckButton");
  assert.equal(harness.element("sendButton").disabled, true);
  harness.callback("sendButton");
  assert.equal(taskCount, 0);

  accountState = "logged-out";
  await harness.callback("recheckButton");
  assert.equal(harness.element("sendButton").disabled, true);
  harness.callback("sendButton");
  assert.equal(taskCount, 0);
});

test("allows token-timeout retry and retains manual-cover completion guidance", async () => {
  const tasks = [];
  const harness = pageHarness({
    cose: {
      getAccounts: async () => [{ uid: "wechat", type: "wechat", loggedIn: true }],
      addTask(task, onProgress, onComplete) {
        tasks.push({ task, onProgress, onComplete });
      },
    },
  });
  await settle();

  harness.callback("sendButton");
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].task.accounts[0].loggedIn, true);
  tasks[0].onProgress({ accounts: [{ status: "failed", error: "无法获取微信公众号 token" }] });
  assert.match(harness.element("statusText").textContent, /首次 token 检测已经超时/);
  assert.equal(harness.element("sendButton").textContent, "重新推入微信草稿箱");
  assert.equal(harness.element("sendButton").disabled, false);

  harness.callback("sendButton");
  assert.equal(tasks.length, 2);
  tasks[1].onProgress({ accounts: [{ status: "done" }] });
  assert.match(harness.element("statusText").textContent, /封面已上传素材库，但需要在公众号后台手动选用/);
  assert.match(harness.element("statusText").textContent, /确认草稿已经保存/);
  assert.equal(harness.element("sendButton").disabled, true);
});
