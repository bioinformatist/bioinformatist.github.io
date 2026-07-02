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

Useful project scripts:

```bash
npm run dev
npm run favicon
npm run avatar
npm run social-card
npm run lint:actions
npm run audit:lighthouse
npm run export:platform
npm run wechat:push-draft
```

`avatar` regenerates the public avatar, favicon, and social card from `src/assets/avatar-sun-yu-original.jpg`.

`favicon` regenerates `static/favicon.png` from the cropped public avatar.

`social-card` regenerates `static/img/social-card-home.png`, the 1200×630 Open Graph/Twitter sharing card used by `social_media_card` in `config.toml`.

`export:platform` writes X Article and WeChat copy/paste packages into `platform-exports/`. That directory is ignored because exports are reproducible from source. The exporter reads `src/content/platformArticles/<slug>/index.md` and copies image assets from the same article directory.

Platform article drafts may use headings, lists, blockquotes, tables, fenced code blocks, images, inline math, and display math. X Article exports include the source Markdown plus `x-article.html`, a browser preview for copying rich text into X's editor. WeChat exports convert supported Markdown blocks to copy/paste HTML and preserve math as styled TeX. For generated images, keep a same-basename Markdown sidecar with the prompt next to the image, for example `cover.png` and `cover.md`.

`wechat:push-draft` is intentionally dry-run only until the real Official Account permissions and secrets are verified.

`audit:lighthouse` builds the site with a local `base_url`, serves `dist/`, runs the Nix-provided Google Lighthouse CLI, checks score thresholds, and writes JSON reports to `.lighthouseci/`. On Linux, the `.#lighthouse` Nix shell provides Chromium, CJK fonts, and `CHROME_PATH`.

CI runs a Zola build, `actionlint`, and `lychee` checks against generated `dist/**/*.html`. Pull requests run the fast internal-link check; pushes to `main`, weekly schedules, and manual runs also check external links.

This machine is usually headless. `npm run dev` and `npm run preview` bind to `0.0.0.0` and set Zola's local `base_url` from the host LAN address; open the printed URL from another LAN machine, for example `http://192.168.0.116:1111/`.
