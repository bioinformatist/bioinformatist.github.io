const coseExtensionUrl =
  "https://chromewebstore.google.com/detail/cose-%E5%A4%9A%E5%B9%B3%E5%8F%B0%E6%96%87%E7%AB%A0%E5%90%8C%E6%AD%A5/ilhikcdphhpjofhlnbojifbihhfmmhfk";

function serializeForHtmlScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function renderWechatEditorHandoff({
  title,
  digest = "",
  content,
  previewContent = content,
  cover,
  contentImageCount,
  coverMediaId = "",
  dryRun = false,
}) {
  const payload = serializeForHtmlScript({
    title,
    digest,
    content,
    previewContent,
    cover,
    contentImageCount,
    coverMediaId,
    dryRun,
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>微信公众号草稿交接</title>
  <style>
    :root {
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      color: #242424;
      background: #f4f4f2;
    }
    * { box-sizing: border-box; }
    body { margin: 0; }
    button, a { font: inherit; }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid #d8d8d4;
      background: rgba(255, 255, 255, .96);
      backdrop-filter: blur(10px);
    }
    .toolbar-inner {
      width: min(1080px, calc(100% - 32px));
      margin: 0 auto;
      padding: 14px 0;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 16px;
      align-items: center;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 18px;
      line-height: 1.35;
      letter-spacing: 0;
    }
    .status {
      margin: 0;
      color: #666;
      font-size: 13px;
      line-height: 1.5;
      letter-spacing: 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
    }
    .button {
      min-height: 40px;
      border: 1px solid #222;
      border-radius: 6px;
      padding: 8px 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: #222;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }
    .button[hidden] {
      display: none;
    }
    .button:hover { background: #000; }
    .button:disabled {
      border-color: #aaa;
      color: #777;
      background: #ddd;
      cursor: not-allowed;
    }
    .button.secondary {
      border-color: #bbb;
      color: #333;
      background: #fff;
    }
    .button.secondary:hover { border-color: #777; }
    .workspace {
      width: min(1080px, calc(100% - 32px));
      margin: 24px auto 48px;
      display: grid;
      grid-template-columns: minmax(0, 720px) minmax(220px, 1fr);
      gap: 24px;
      align-items: start;
    }
    .paper {
      min-width: 0;
      padding: 34px 32px 44px;
      border: 1px solid #dfdfdb;
      background: #fff;
      box-shadow: 0 8px 28px rgba(0, 0, 0, .06);
    }
    .meta {
      position: sticky;
      top: 92px;
      min-width: 0;
      padding: 18px;
      border: 1px solid #dfdfdb;
      border-radius: 6px;
      background: #fff;
    }
    .meta h2 {
      margin: 0 0 14px;
      font-size: 15px;
      letter-spacing: 0;
    }
    .meta dl { margin: 0; }
    .meta dt {
      margin-top: 14px;
      color: #777;
      font-size: 12px;
    }
    .meta dd {
      margin: 4px 0 0;
      font-size: 13px;
      line-height: 1.55;
      overflow-wrap: anywhere;
    }
    .cover {
      display: block;
      width: 100%;
      height: auto;
      margin-top: 8px;
      border-radius: 4px;
    }
    .notice {
      margin: 16px 0 0;
      padding-top: 14px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 12px;
      line-height: 1.65;
    }
    @media (max-width: 760px) {
      .toolbar-inner {
        grid-template-columns: 1fr;
      }
      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .actions .button {
        width: 100%;
        white-space: normal;
      }
      .workspace {
        grid-template-columns: 1fr;
        width: min(100% - 20px, 720px);
        margin-top: 10px;
      }
      .paper { padding: 24px 16px 32px; }
      .meta {
        position: static;
        grid-row: 1;
      }
    }
  </style>
</head>
<body>
  <header class="toolbar">
    <div class="toolbar-inner">
      <div>
        <h1 id="articleTitle"></h1>
        <p class="status" id="statusText">正在检测 COSE 扩展和公众号登录状态...</p>
      </div>
      <div class="actions">
        <a class="button secondary" id="extensionLink" href="${coseExtensionUrl}" target="_blank" rel="noreferrer">安装 COSE</a>
        <a class="button secondary" id="loginLink" href="https://mp.weixin.qq.com/" target="_blank" rel="noreferrer" hidden>打开公众号后台</a>
        <button class="button secondary" id="recheckButton" type="button" hidden>重新检查登录</button>
        <button class="button" id="sendButton" type="button" disabled>推入微信草稿箱</button>
      </div>
    </div>
  </header>

  <main class="workspace">
    <article class="paper" id="articlePreview"></article>
    <aside class="meta">
      <h2>发布信息</h2>
      <dl>
        <dt>摘要建议</dt>
        <dd id="digestText"></dd>
        <dt>正文图片</dt>
        <dd id="imageCount"></dd>
        <dt>封面</dt>
        <dd id="coverState"></dd>
      </dl>
      <img class="cover" id="coverPreview" alt="文章封面">
      <p class="notice">COSE 会打开公众号后台、写入标题和正文并尝试保存草稿。完成后请在公众号后台核对正文图片、封面、摘要和草稿状态。</p>
    </aside>
  </main>

  <script type="application/json" id="handoffPayload">${payload}</script>
  <script>
    const payload = JSON.parse(document.getElementById("handoffPayload").textContent);
    const statusText = document.getElementById("statusText");
    const sendButton = document.getElementById("sendButton");
    const extensionLink = document.getElementById("extensionLink");
    const loginLink = document.getElementById("loginLink");
    const recheckButton = document.getElementById("recheckButton");
    let wechatAccount = null;

    document.getElementById("articleTitle").textContent = payload.title;
    document.getElementById("digestText").textContent = payload.digest || "未设置，将由公众号后台自动截取。";
    document.getElementById("imageCount").textContent = payload.dryRun
      ? payload.contentImageCount + " 张，本页继续使用本地预览地址。"
      : payload.contentImageCount + " 张，已换成微信素材地址。";
    document.getElementById("coverState").textContent = payload.coverMediaId
      ? "已上传到素材库，请在公众号后台选用。"
      : "尚未上传到素材库。";
    document.getElementById("coverPreview").src = payload.cover;
    document.getElementById("articlePreview").innerHTML = payload.previewContent;

    function setStatus(message, state = "") {
      statusText.textContent = message;
      statusText.dataset.state = state;
    }

    async function waitForCose(timeoutMs = 10000) {
      const deadline = Date.now() + timeoutMs;
      while (!window.$cose && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return window.$cose;
    }

    async function checkWechatLogin() {
      const cose = window.$cose;
      wechatAccount = null;
      sendButton.disabled = true;
      loginLink.hidden = true;
      recheckButton.hidden = false;
      recheckButton.disabled = true;
      setStatus("COSE 已就绪，正在确认公众号登录状态...", "checking");

      try {
        const accounts = await cose.getAccounts();
        const latestAccount = accounts.find((account) =>
          (account.uid === "wechat" || account.type === "wechat") && account.loggedIn === true
        ) || null;
        if (latestAccount) {
          wechatAccount = latestAccount;
          sendButton.disabled = false;
          setStatus("COSE 已就绪，微信公众号已登录。", "ready");
        } else {
          loginLink.hidden = false;
          setStatus("COSE 已就绪，但未检测到已登录的微信公众号。请打开公众号后台登录后重新检查。", "logged-out");
        }
      } catch (error) {
        loginLink.hidden = false;
        setStatus("COSE 已就绪，但登录状态检测失败：" + (error.message || error) + "。请打开公众号后台确认登录后重新检查。", "account-error");
      } finally {
        recheckButton.disabled = false;
      }
    }

    async function detectCose() {
      setStatus("正在等待 COSE 扩展注入...", "waiting");
      sendButton.disabled = true;
      extensionLink.hidden = true;
      loginLink.hidden = true;
      recheckButton.hidden = true;

      const cose = await waitForCose();
      if (!cose) {
        setStatus("没有检测到 COSE。请确认扩展已启用，并允许它访问此 LAN 地址后刷新页面。", "missing");
        sendButton.disabled = true;
        extensionLink.hidden = false;
        return;
      }

      extensionLink.hidden = true;
      if (payload.dryRun) {
        setStatus("这是 dry-run 交接页，不会创建草稿。", "dry-run");
        sendButton.disabled = true;
        return;
      }

      await checkWechatLogin();
    }

    recheckButton.addEventListener("click", checkWechatLogin);
    sendButton.addEventListener("click", () => {
      if (!window.$cose || payload.dryRun || wechatAccount?.loggedIn !== true) return;

      sendButton.disabled = true;
      setStatus("正在打开公众号后台并写入草稿...", "sending");
      const account = {
        uid: "wechat",
        type: "wechat",
        title: "微信公众号",
        ...wechatAccount,
        checked: true,
      };

      window.$cose.addTask(
        {
          post: {
            title: payload.title,
            content: payload.content,
            markdown: "",
            thumb: payload.cover,
            desc: payload.digest,
          },
          accounts: [account],
        },
        (progress) => {
          const current = progress?.accounts?.[0];
          if (!current) return;
          if (current.status === "failed") {
            if (current.error?.includes("无法获取微信公众号 token")) {
              setStatus("COSE 的首次 token 检测已经超时。完成公众号登录后，请再次点击下方按钮。", "failed");
              sendButton.textContent = "重新推入微信草稿箱";
            } else {
              setStatus("交接失败：" + (current.error || "未知错误"), "failed");
            }
            sendButton.disabled = false;
          } else if (current.status === "done") {
            setStatus("COSE 已完成正文写入。封面已上传素材库，但需要在公众号后台手动选用；随后请确认草稿已经保存。", "done");
          } else {
            setStatus(current.msg || "正在处理...", current.status || "sending");
          }
        },
        () => {
          sendButton.disabled = false;
        },
      );
    });

    detectCose();
  </script>
</body>
</html>
`;
}
