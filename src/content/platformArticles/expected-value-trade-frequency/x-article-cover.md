# X Article cover

Generated with the installed image-generation skill, then center-cropped to 1600x640 with ImageMagick.

## Complete generation prompt

```text
Use case: stylized-concept
Asset type: 1600x640 wide editorial cover for a Chinese investment-education X Article
Primary request: Visualize how repeated identical red/black roulette bets gradually reveal the casino's small but persistent edge.
Scene/backdrop: A refined European roulette table viewed from a slightly elevated wide cinematic angle, with one green zero pocket clearly part of a 37-pocket wheel, and a sequence of many small red and black betting chips or markers receding across the composition. The early bets feel balanced and uncertain; toward the far side, a subtle accumulation of chips on the house side reveals the persistent edge.
Style/medium: Sophisticated editorial illustration, semi-realistic 3D with clean geometric composition, suitable for a serious financial education article.
Composition/framing: Exact 5:2 ultrawide composition, designed to crop cleanly to 1600x640. Roulette wheel on the left third, repeated betting sequence flowing left to right, ample breathing room, no central text area required.
Lighting/mood: Controlled casino lighting, sober and analytical rather than glamorous, with restrained contrast.
Color palette: Deep green felt, muted red and black, warm ivory highlights, small brass accents.
Constraints: No rendered text, no letters, no numbers, no formulas, no stock tickers, no logos, no watermark, no identifiable people, no hands, no playing cards, no American double-zero roulette. The visual must communicate repetition and a small structural house advantage, not a dramatic jackpot or a single lucky spin.
Avoid: neon casino spectacle, luxury advertising, piles of money, currency symbols, charts, candlesticks, screens, typography, brand marks.
```

The first result contained small roulette numerals and was rejected. The accepted result used this corrective prompt:

```text
Create a revised version of the previous ultrawide roulette editorial cover with one strict correction: remove every visible numeral, letter, label, formula, and marking from the roulette wheel and betting layout. Use plain alternating red and black color inlays plus exactly one green inlay, all completely blank. Keep the sober 5:2 composition, deep green felt, roulette wheel on the left, repeated red/black chips progressing across the table, subtle house-side accumulation, warm restrained lighting, and no people. No text-like glyphs anywhere, no logos, no watermark, no currency, no charts, no stock imagery.
```

Final sizing command:

```bash
nix develop -c magick src/content/platformArticles/expected-value-trade-frequency/x-article-cover.png -resize '1600x640^' -gravity center -extent 1600x640 src/content/platformArticles/expected-value-trade-frequency/x-article-cover.png
```
