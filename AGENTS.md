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

- Keep X Article and WeChat long-form sources under `src/content/platformArticles/<slug>/index.md`.
- Put article-local images and other source assets in the same `<slug>/` directory or its subdirectories.
- For every generated image, keep a same-basename Markdown sidecar with the prompt and generation notes next to the image, for example `cover.png` and `cover.md`.
- Platform article sources are not rendered into the public Zola site; use `nix develop -c npm run export:platform` to generate copy/paste packages.
- Do not run `npm run export:platform` and `npm run wechat:draft -- <slug>` concurrently; both rewrite `platform-exports`.
- WeChat Official Account publishing is local-only: credentials live in ignored `.env.local`, and `nix develop -c npm run wechat:draft -- <slug>` pushes directly to the WeChat draft box for manual preview and publishing. This machine has no fixed public IPv4; if WeChat returns `40164` or `not in whitelist`, stop and ask the user to add the returned outbound IP to the WeChat API IP whitelist. Do not add a GitHub Actions path for this workflow unless explicitly requested.
- When revising an existing WeChat draft, update it in place with `nix develop -c npm run wechat:draft -- <slug> --update-media-id <media_id>` instead of creating duplicate drafts.
- For every WeChat publication, try the official `/draft/add` API route first with `nix develop -c npm run wechat:draft -- <slug> --dry-run`. If compact API HTML still exceeds the 20,000-character content limit, stop and use an editor-based workflow such as doocs/md; do not keep stripping meaningful article structure just to force the API path.
- Do not implement the editor-based WeChat fallback until a real article is blocked by the official API route.
- For WeChat output, render external links as inline citation markers plus a bottom "引用链接" section. Keep only `mp.weixin.qq.com` links as normal inline links.
- X Article title and body are separate fields. The export preview must keep them separate and must not include the title in the body selection area.
- X Article does not preserve local images, display math, Markdown tables, or fenced code blocks when pasting the full body. Keep placeholders in the body preview and provide an insertion checklist with image previews, LaTeX source, Markdown table source with row/column counts, and code snippets.
- Do not use inline math in platform articles. Use plain text in prose, or promote important formulas to display math blocks.
- Before platform-article handoff, do a Markdown style pass for emphasis that both X Article and WeChat preserve: use `**...**` for central claims, `*...*` for caveats or tonal asides, and `~~...~~` only for deliberate rhetorical correction. Avoid emphasis spam.
- For X Article covers, prefer a 5:2 image such as 1600x640 and set `cover: "<image-file>"` in frontmatter.
- Before platform-article handoff, run `nix develop -c npm run export:platform`, `nix develop -c npm run build`, and `git diff --check`.
- When a platform article is ready for publication review, start a LAN preview with `nix develop -c npm run preview:platform -- <slug>` and report the URL.
