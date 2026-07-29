# trading-friction-toll-gates.png

Generated with the built-in image generation tool. The initial landscape version was rejected because its five labels were too small on mobile. The accepted mobile-first revision was resized to 800px wide and compressed as an indexed PNG for platform publishing.

## Prompt

```text
Use case: scientific-educational
Asset type: landscape editorial infographic inside a Chinese investment-education article
Primary request: Show that a small gross trading profit can become a net loss after real trading frictions.
Scene/backdrop: Clean warm-white editorial background with subtle paper texture, matching a sober financial education publication.
Subject: A left-to-right flow begins with a large green rounded box labeled exactly "毛利润 +0.2%". The flow passes through five clearly separated toll-gate or deduction stages labeled exactly "交易所/监管", "券商佣金", "买卖价差", "滑点", and "税费/利息". At every stage, a small portion of green value is visibly removed downward as a coin, chip, or short bar. The line becomes thinner as it moves right, crosses a clear zero marker, and ends in a red rounded box labeled exactly "净结果 -0.1%". Above the five deductions, one concise label reads exactly "总摩擦 -0.3%".
Style/medium: Sophisticated flat editorial infographic, precise geometric layout, publication quality, serious and analytical rather than playful.
Composition/framing: 3:2 landscape, generous margins, large readable labels, simple left-to-right hierarchy, readable on a mobile article page. The five cost stages should be evenly spaced and visually distinct.
Color palette: charcoal text and outlines, muted green for gross profit, muted red for deductions and final loss, amber used sparingly for toll gates, warm white background.
Text (verbatim): "毛利润 +0.2%", "交易所/监管", "券商佣金", "买卖价差", "滑点", "税费/利息", "总摩擦 -0.3%", "净结果 -0.1%". Do not add any other text.
Constraints: Every Chinese label, sign, decimal, and percentage must be exactly correct and legible. The visual arithmetic must communicate +0.2% minus 0.3% equals -0.1%. No formulas beyond those three percentage values, no people, no broker app UI, no stock charts, no candlesticks, no logos, no watermark.
Avoid: 3D rendering, casino imagery, decorative icons, gradients, tiny labels, extra words, English text, swapped stages, incorrect percentages.
```

## Mobile-first revision prompt

```text
Reformat the referenced trading-friction infographic into a mobile-first vertical editorial infographic while preserving every fact and exact label.

Use case: scientific-educational
Asset type: portrait infographic inside a Chinese mobile investment-education article
Primary request: Show that a small gross trading profit becomes a net loss after real trading frictions.
Composition/framing: 4:5 portrait. At the top, a large green box labeled exactly "毛利润 +0.2%". Beneath it, a clear downward flow passes through five wide, full-row toll gates stacked vertically, labeled in this exact order: "交易所/监管", "券商佣金", "买卖价差", "滑点", "税费/利息". Each gate visibly removes a small red coin or short red bar to one side. A bracket or concise heading beside the five stages reads exactly "总摩擦 -0.3%". After the fifth gate, the flow crosses a visible zero marker and ends at a large red box labeled exactly "净结果 -0.1%". Use the full portrait width for every cost label so it remains legible at about 320 CSS pixels wide.
Style/medium: Keep the same sophisticated flat editorial infographic style, warm-white subtle paper background, precise geometry, serious analytical tone.
Color palette: charcoal text and outlines, muted green gross profit, muted red deductions and final loss, restrained amber toll-gate details.
Text (verbatim): "毛利润 +0.2%", "交易所/监管", "券商佣金", "买卖价差", "滑点", "税费/利息", "总摩擦 -0.3%", "净结果 -0.1%". Do not add any other text.
Constraints: Every Chinese character, sign, decimal, and percentage must be exactly correct and large enough for mobile reading. Arithmetic must communicate +0.2% minus 0.3% equals -0.1%. Preserve the toll-gate metaphor. No people, no UI, no stock chart, no candlesticks, no logos, no watermark.
Avoid: horizontal five-column layout, tiny labels, extra words, English, incorrect percentages, decorative clutter, gradients, 3D rendering.
```

## Post-processing

```bash
magick <generated-image>.png \
  -resize 800x \
  -strip \
  -colors 256 \
  PNG8:src/content/platformArticles/expected-value-trade-frequency/trading-friction-toll-gates.png
```
