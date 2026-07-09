# X Article cover prompt

Generated with the built-in image generation tool, then resized/cropped to 1600x640 for a 5:2 X Article cover.

## Prompt

Use case: productivity-visual
Asset type: 5:2 cover image for an X Article and WeChat investment-education article
Primary request: Create a polished horizontal cover image for an article about why gold is not suitable for going all-in, but can serve as a portfolio liquidity buffer. Do not include any text, labels, logos, watermarks, or UI.
Scene/backdrop: A sophisticated editorial financial still life on a dark neutral desk: a modest stack of gold bars or gold coins near the left third, a calm portfolio chart line and cash liquidity motif implied through abstract reflections, and a subtle storm-to-clear-light transition in the background.
Subject: Gold as a reserved base position and emergency liquidity cushion, not speculative gambling.
Composition: Wide cinematic 5:2-friendly composition, generous negative space, strong focal point, premium financial publication style, clean and uncluttered.
Style: realistic editorial photography with subtle warm gold highlights, restrained black/charcoal background, professional investment research aesthetic.
Avoid: no text, no dollar signs, no arrows, no exaggerated luxury, no casino imagery, no people, no flags, no brand logos, no charts with readable numbers.

## Post-processing

```bash
magick <generated-image>.png \
  -resize 1600x640^ \
  -gravity center \
  -extent 1600x640 \
  -strip \
  -quality 88 \
  src/content/platformArticles/gold-not-for-all-in/x-article-cover.png
```
