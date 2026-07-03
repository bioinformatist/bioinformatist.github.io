# Bioinformatist

Zola + tabi GitHub Pages site for the personal homepage, public resume, projects, posts, and platform article source exports.

## Content model

- `content/blog`: public posts. Migrated articles from older site shells live here as normal Zola posts.
- `content/projects`: public project entries, including the investment education series explanation page.
- `content/resume`: public Chinese and English resume sections.
- `src/content/platformArticles`: source articles for X Article and WeChat Official Account distribution. They are organized as `src/content/platformArticles/<slug>/index.md` with article-local assets beside the source, and are not published into the public site.
- `static/legacy-assets`: copied assets referenced by migrated legacy posts.

## Commands

Use the repo-local dev shell for Zola, Node, and workflow tooling:

```bash
nix develop -c npm run build
nix develop -c npm run lint:actions
nix develop .#lighthouse -c npm run audit:lighthouse
```

Node package installs use the repo-local `.npmrc`, currently pointed at `registry.npmmirror.com` for better availability from mainland China.

Useful project scripts:

```bash
npm run dev
npm run favicon
npm run avatar
npm run social-card
npm run lint:actions
npm run audit:lighthouse
npm run export:platform
npm run preview:platform -- grid-strategy-expected-value
npm run wechat:draft -- grid-strategy-expected-value
```

`avatar` regenerates the public avatar, favicon, and social card from `src/assets/avatar-sun-yu-original.jpg`.

`favicon` regenerates `static/favicon.png` from the cropped public avatar.

`social-card` regenerates `static/img/social-card-home.png`, the 1200×630 Open Graph/Twitter sharing card used by `social_media_card` in `config.toml`.

`export:platform` writes X Article and WeChat copy/paste packages into `platform-exports/`. That directory is ignored because exports are reproducible from source. The exporter reads `src/content/platformArticles/<slug>/index.md` and copies image assets from the same article directory.

Platform article drafts may use headings, bold, italics, strikethrough, lists, blockquotes, tables, fenced code blocks, images, and display math. Avoid inline math: X Article does not support it, and GitHub Markdown previews can expose raw `$...$` text. Use plain text in prose, or promote important formulas to `$$...$$` display blocks. X Article exports include the source Markdown plus `x-article.html`, a browser assembly page with separate title and rich-text body areas, plus image, LaTeX, table, and code snippets for manual insertion. WeChat exports convert supported Markdown blocks to copy/paste HTML and preserve math as styled TeX. For generated images, keep a same-basename Markdown sidecar with the prompt next to the image, for example `cover.png` and `cover.md`.

Set `disclaimer: "investment-education"` in platform article frontmatter to append the shared investment-education risk disclaimer to X Article and WeChat exports.

Set `cover: "<image-file>"` in platform article frontmatter for the X Article cover image. Prefer 5:2 images, for example 1600x640.

`preview:platform` regenerates platform exports, serves one article export directory on `0.0.0.0`, and prints a LAN URL. If there is only one exported article, the slug argument can be omitted.

`wechat:draft` regenerates platform exports, uploads article images to the WeChat Official Account APIs, creates a draft with `/cgi-bin/draft/add`, and stops there. Preview and publish from the WeChat draft box. Put `WECHAT_APP_ID` and `WECHAT_APP_SECRET` in ignored `.env.local`; optional `WECHAT_AUTHOR` sets the article author. This machine has no fixed public IPv4, so the current public outbound IP must be allowed in the WeChat API IP whitelist; if WeChat returns `40164` or `not in whitelist`, add the returned IP and retry. Use `npm run wechat:draft -- <slug> --dry-run` for local validation without network calls.

For WeChat, the default publishing path is two-stage: try the official `/draft/add` API route first; if compacted HTML still exceeds the API's 20,000-character `content` limit after image URL replacement, stop and use an editor-based workflow such as doocs/md. Do not keep removing useful article structure solely to fit the API limit.

## WeChat Official Account Publishing

Use the API route first for every article:

```bash
nix develop -c npm run wechat:draft -- <slug> --dry-run
```

Read the reported `estimated API HTML` count. If the dry run fails on the 20,000-character `content` limit or the 1MB body limit, stop the API path for that article and switch to an editor-based workflow when needed. The fallback is intentionally not implemented in this repo until an actual article requires it.

If the dry run passes, create the real draft:

```bash
nix develop -c npm run wechat:draft -- <slug>
```

The script uploads body images, uploads the cover, creates a WeChat draft, and prints the draft `media_id`. Final review and publishing stay inside the WeChat draft box. Before publishing, preview the draft and check paragraph spacing, code-block line breaks, table borders, formula images, body images, cover, and the risk disclaimer.

`audit:lighthouse` builds the site with a local `base_url`, serves `dist/`, runs the Nix-provided Google Lighthouse CLI, checks score thresholds, and writes JSON reports to `.lighthouseci/`. On Linux, the `.#lighthouse` Nix shell provides Chromium, CJK fonts, and `CHROME_PATH`.

CI runs a Zola build, `actionlint`, and `lychee` checks against generated `dist/**/*.html`. Pull requests run the fast internal-link check; pushes to `main`, weekly schedules, and manual runs also check external links.

This machine is usually headless. `npm run dev` and `npm run preview` bind to `0.0.0.0` and set Zola's local `base_url` from the host LAN address; open the printed URL from another LAN machine, for example `http://192.168.0.116:1111/`.
