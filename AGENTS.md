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
