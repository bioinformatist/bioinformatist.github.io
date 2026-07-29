# positive-expectation-compounding-paths.png

Generated with the built-in image generation tool, then resized to 1200x800 and compressed as an indexed PNG for platform publishing.

## Prompt

```text
Use case: scientific-educational
Asset type: landscape editorial infographic inside a Chinese investment-education article
Primary request: Explain visually that a +50% gain and a -40% loss do not cancel each other, because investment wealth compounds multiplicatively.
Scene/backdrop: Clean warm-white editorial background with a subtle paper texture, no decorative scenery.
Subject: Two parallel left-to-right account-value paths. Top path has exactly three large circular checkpoints labeled "100", "150", "90", connected by a rising arrow labeled "+50%" and then a falling arrow labeled "-40%". Bottom path has exactly three large circular checkpoints labeled "100", "60", "90", connected by a falling arrow labeled "-40%" and then a rising arrow labeled "+50%". Both paths end at the same clearly emphasized "90" checkpoint. A faint reference line or small starting marker makes it visually obvious that both began at 100 and ended below the start.
Style/medium: Sophisticated flat editorial infographic, precise geometric layout, publication quality, sober financial education rather than playful marketing.
Composition/framing: 3:2 landscape, generous margins, two paths stacked vertically, aligned starting and ending columns, readable on a mobile article page.
Color palette: charcoal text and arrows, muted green for gains, muted red for losses, amber accent only on the final 90 checkpoints, warm white background.
Text (verbatim): "100", "150", "90", "+50%", "-40%", "100", "60", "90", "-40%", "+50%". Do not add any other text.
Constraints: All numbers and percentage labels must be exactly correct and legible. No formulas, no Chinese text, no currency symbols, no people, no stock charts, no candlesticks, no logos, no watermark. The top path must be 100 to 150 to 90. The bottom path must be 100 to 60 to 90. Both paths end at 90.
Avoid: 3D rendering, casino imagery, decorative icons, gradients, shadows that reduce readability, extra labels, swapped numbers, approximate values.
```

## Post-processing

```bash
magick <generated-image>.png \
  -resize 1200x800^ \
  -gravity center \
  -extent 1200x800 \
  -strip \
  -colors 256 \
  PNG8:src/content/platformArticles/expected-value-trade-frequency/positive-expectation-compounding-paths.png
```
