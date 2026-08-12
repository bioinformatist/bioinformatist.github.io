---
name: platform-article-workflow
description: Draft, revise, verify, preview, and archive long-form platform articles in this repository for X Article and WeChat. Use for article planning, argument restructuring, mathematical or technical review, visual-asset planning, final prose cleanup, publication handoff, or post-publication metadata updates. Do not use for ordinary Zola posts, legacy migration, or site UI work.
---

# Platform Article Workflow

Develop one canonical Markdown source into a rigorous, readable article and a
low-friction X/WeChat handoff. Follow the repository-level platform and safety
contracts in `AGENTS.md`; this skill owns the editorial sequence.

## Establish The Task

Identify whether the user is brainstorming, drafting, revising, preparing a
platform handoff, or archiving a published article. Do not implement while the
user is still discussing structure or explicitly asks for a plan.

Before editing:

- Read the current article, its frontmatter, article-local assets, and relevant
  published articles.
- Inspect the current diff. Treat the user's latest manual edits as
  authoritative.
- Recover the target reader, the article's one-sentence claim, and its role in
  the surrounding series.
- Preserve supplied facts, personal stories, screenshots, humor, intentional
  line breaks, and argument-bearing emphasis.

After the user says they have completed a final edit, make only requested or
strictly necessary corrections. Do not restart a broad rewrite without asking.

## Build The Argument

Before drafting prose, create or audit a compact argument map that records the
central claim, reader assumptions, and, for every section, its job, evidence
type, transition, and visual purpose. Then:

1. Give every section one distinct job.
2. Introduce concepts, notation, and data definitions before formulas or
   evidence that use them.
3. Pair technical material with an intuitive example, table, or explanatory
   image when that materially reduces reader effort.
4. Remove repeated conclusions, defensive meta-commentary, generic summaries,
   and rebuttals that do not advance the article.
5. Add explicit transitions when the article changes abstraction level or
   introduces the next article in a series.

Keep author/editor clarification out of reader-facing prose unless readers
need that context to understand or evaluate the argument.

Prefer a hard claim followed by its mechanism and evidence. Do not dilute the
author's judgment merely to sound neutral.

## Audit Technical Claims

Verify current or externally checkable claims with primary sources before
presenting them as facts. Separate sourced facts, mathematical derivations,
illustrative assumptions, personal observations, and opinions.

For mathematical or finance-heavy articles:

- Define random variables, units, signs, and time horizons before deriving a
  result.
- Treat trading expectation as net of commissions, exchange and regulatory
  fees, bid-ask spread, slippage or market impact, financing, borrow costs,
  taxes, and other applicable friction.
- Keep expected value, trade frequency, position sizing, arithmetic return,
  geometric or log growth, path dependence, drawdown, and ruin risk distinct.
- Check arithmetic independently and test boundary cases before simplifying
  the explanation.
- Do not generalize from one strategy, asset, sample path, or market regime
  beyond the stated assumptions.
- Use a visual only when it teaches the mechanism or geometric meaning; a
  formula remains supporting evidence rather than the sole explanation.

## Edit The Prose

Keep the language direct and specific. Preserve the user's concrete nouns,
colloquial phrasing, jokes, and deliberate sharpness when they carry meaning.

Use `**bold**` for central claims, `*italics*` for caveats or tonal asides, and
`~~strikethrough~~` only for deliberate rhetorical correction. Avoid emphasis
spam.

Once structure and correctness are stable, use the installed `stop-slop` skill
for a final pass when available. Reject changes that erase the author's voice,
repeat the thesis, add generic scene-setting, or replace precise claims with
vague abstractions.

## Manage Evidence And Assets

- Generate assets only after the article structure and data definitions are
  stable.
- Keep source images and generated assets beside the article source.
- Preserve original screenshots. Crop or reframe only for a stated readability
  or platform constraint, and keep the original.
- Give every generated or processed image a same-basename Markdown sidecar
  recording its prompt or reproducible processing notes.
- For data charts, record the source, baseline, calculation, and transformations
  in the sidecar. Label non-data explanatory images as schematics.
- Prefer argument-bearing diagrams over decoration.
- Use a `-x` variant only when X needs different framing; keep the canonical
  image for review and WeChat.
- Prepare a 5:2 X cover and a distinct `x_caption` before publication handoff.

## Hand Off To Platforms

Keep platform-specific transformation in the existing exporter rather than
manually forking the article source.

Before handoff:

1. Confirm title, X caption, body, images, formulas, tables, code blocks,
   citations, disclaimer, and prior-article links.
2. Link another platform article through its relative source path so the
   exporter can select the correct platform URL.
3. Run:

   ```bash
   nix develop -c npm run test:platform-export
   nix develop -c npm run export:platform
   nix develop -c npm run build
   git diff --check
   ```

4. Start `nix develop -c npm run preview:platform -- <slug>` automatically when
   the article is ready for publication review. Report the LAN URL.
5. Leave final copy edits to the user.

For WeChat publication, run the official API dry-run first. If its compact HTML
exceeds the platform limit, preserve the approved renderer and use
`nix develop -c npm run wechat:handoff -- <slug>` rather than restyling the
article in another editor. The handoff uploads image assets, then relies on the
COSE browser extension and the user's logged-in WeChat session to populate and
save a draft. Require a final check in the WeChat backend because browser
automation can drift when the editor DOM changes.

Do not create or update a WeChat draft, publish externally, commit, or push
unless the user explicitly requests that action. Never run the general exporter
and WeChat draft command concurrently.

## Archive Publication

After the user supplies the published URLs:

- Set `status`, `published_date`, `x_url`, and `wechat_url` in the source
  frontmatter.
- Add a Chinese-only article only to the Chinese investment-education project
  archive. Update the English archive only when an English translation or
  mirror was explicitly requested.
- Preserve platform identity: X output links to prior X publications and
  WeChat output links to prior WeChat publications.
- Re-run the exporter tests and site build before handoff.
