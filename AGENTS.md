# AGENTS.md

## Local Preview

- This repo is usually developed on a headless machine.
- When starting Zola for user preview, bind to `0.0.0.0`, not `127.0.0.1`.
- Prefer `npm run dev` or `npm run preview`; both scripts bind Zola to `0.0.0.0` and set `--base-url` from the LAN address.
- After starting a server, report a LAN URL based on `hostname -I`, for example `http://192.168.0.116:1111`.
- Use `nix develop -c ...` when Node is not available globally.

## Site UX

- Keep primary navigation for site sections. Put language choices in a dedicated locale switcher, not beside `Posts`, `Projects`, or `Resume`.
- This site uses Zola with the tabi theme. Prefer small local template overrides over editing `themes/tabi` directly.
- After visible UI changes, verify desktop and mobile screenshots before handoff.
- For broader layout or page-quality changes, run `nix develop .#lighthouse -c npm run audit:lighthouse`.

## Quality Checks

- Use `nix develop -c npm run lint:actions` after editing GitHub Actions workflows.
- CI uses `lycheeverse/lychee-action` against generated `dist/**/*.html`: pull requests pass `--offline` for internal links; pushes to `main`, weekly schedules, and manual runs also check external links.
- Do not add `lychee` to the Nix devShell until the pinned nixpkgs revision has a binary-cache hit for it.

## Platform Articles

- Use `$platform-article-workflow` for substantial platform-article planning, drafting, structural revision, mathematical or technical review, publication handoff, and post-publication archiving. This file owns repository and platform-transfer contracts; the skill owns the editorial sequence.
- Treat the user's latest manual article edits as authoritative. After the user says they have completed a final edit, do not broadly rewrite the article unless explicitly asked.
- Publication previews may be started automatically when an article is ready for review. Creating or updating a WeChat draft, publishing externally, committing, or pushing requires an explicit user request.
- Keep X Article and WeChat long-form sources under `src/content/platformArticles/<slug>/index.md`.
- Put article-local images and other source assets in the same `<slug>/` directory or its subdirectories.
- For every generated image, keep a same-basename Markdown sidecar with the prompt and generation notes next to the image, for example `cover.png` and `cover.md`.
- Platform article sources are not rendered into the public Zola site; use `nix develop -c npm run export:platform` to generate copy/paste packages.
- Do not run `npm run export:platform`, `npm run wechat:draft -- <slug>`, `npm run wechat:handoff -- <slug>`, or `npm run wechat:handoff:reuse -- <slug>` concurrently; they rewrite `platform-exports`.
- WeChat Official Account publishing is local-only: credentials live in ignored `.env.local`, and `nix develop -c npm run wechat:draft -- <slug>` pushes directly to the WeChat draft box for manual preview and publishing. This machine has no fixed public IPv4; if WeChat returns `40164` or `not in whitelist`, stop and ask the user to add the returned outbound IP to the WeChat API IP whitelist. Do not add a GitHub Actions path for this workflow unless explicitly requested.
- When revising an existing WeChat draft, update it in place with `nix develop -c npm run wechat:draft -- <slug> --update-media-id <media_id>` instead of creating duplicate drafts.
- For every WeChat publication, try the official `/draft/add` API route first with `nix develop -c npm run wechat:draft -- <slug> --dry-run`. If compact API HTML still exceeds the 20,000-character content limit, stop; do not keep stripping meaningful article structure just to force the API path.
- For an API-blocked article, use `nix develop -c npm run wechat:handoff -- <slug>` for a fresh handoff. This uploads body images and the cover through the existing WeChat credentials, records a local ignored upload cache, and starts a LAN handoff page. To retry the editor transfer without uploading unchanged assets again, use `nix develop -c npm run wechat:handoff:reuse -- <slug>`; reuse fails closed unless the current body-image paths and bytes and the cover source and bytes exactly match the cache.
- Install COSE in a dedicated publishing browser profile. On the handoff page, open the WeChat Official Account backend, log in, and recheck the account; Send must remain disabled until COSE positively confirms the login. If COSE's first token check times out, keep the backend login open and retry the transfer. COSE writes the title and body, but cover selection remains manual. Treat completion as a handoff signal, not proof that WeChat saved correctly: select the uploaded cover and verify the body images, digest, and draft state in the official-account backend.
- For WeChat output, render external links as inline citation markers plus a bottom "引用链接" section. Keep only `mp.weixin.qq.com` links as normal inline links.
- Link another platform article with its relative source path, such as `../<slug>/index.md`. The exporter must resolve that link to the target article's `x_url` for X output and `wechat_url` for WeChat output; never carry one platform's published URL into the other platform by accident.
- Set `x_caption` in platform-article frontmatter to the short timeline copy entered in X's optional "Add a caption to your Article" field. Keep it distinct from the article title and SEO-style `description`; the exporter may use `description` only as a compatibility fallback for older drafts.
- X Article title, body, and publication caption are separate fields. The export preview must keep them separately selectable and must not include the title in the body selection area.
- X Article does not preserve local images, display math, Markdown tables, or fenced code blocks when pasting the full body. Keep placeholders in the body preview and provide an insertion checklist with image previews, LaTeX source, Markdown table source with row/column counts, and code snippets.
- When X needs a differently framed version of an article image, place `<basename>-x.<ext>` beside the source image. The X insertion checklist selects that variant automatically; the source article, full review, and WeChat output continue using the original image.
- The X Article preview must offer one-click `X 发布` and `完整审阅` modes. Publish mode keeps separately inserted resources as placeholders; review mode renders images, inline and display math, tables, and code blocks in the article body.
- X Article provides native LaTeX through its Insert menu, but rendered SVG math does not survive whole-body rich-text paste. Prefer ordinary text for simple inline notation. If `$...$` is necessary, X publish mode must expose copyable LaTeX source rather than SVG; review mode may render it visually. Keep complex formulas as display math blocks for native insertion. For WeChat output, keep inline formula text but remove the `$...$` delimiters.
- Before platform-article handoff, do a Markdown style pass for emphasis that both X Article and WeChat preserve: use `**...**` for central claims, `*...*` for caveats or tonal asides, and `~~...~~` only for deliberate rhetorical correction. Avoid emphasis spam.
- For X Article covers, prefer a 5:2 image such as 1600x640 and set `cover: "<image-file>"` in frontmatter.
- Before platform-article handoff, run `nix develop -c npm run test:platform-export`, `nix develop -c npm run export:platform`, `nix develop -c npm run build`, and `git diff --check`.
- When a platform article is ready for publication review, start a LAN preview with `nix develop -c npm run preview:platform -- <slug>` and report the URL.
- After publication, set `status`, `published_date`, `x_url`, and `wechat_url` in the source frontmatter and archive the article on the project page matching its language. Add a Chinese-only article only to the Chinese archive unless an English translation or mirror was explicitly requested.
