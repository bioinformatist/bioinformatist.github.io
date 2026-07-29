# trading-friction-toll-gates-x.png

X Article-specific derivative of `trading-friction-toll-gates.png`. The original `800x1563` portrait infographic is preserved for WeChat; this version fits the complete image inside a `3:4` canvas so X does not center-crop away the gross-profit or net-result blocks.

No content was regenerated, cropped, or stretched. The original image was scaled proportionally and centered on a matching warm-white background.

## Generation

```bash
nix develop -c magick \
  src/content/platformArticles/expected-value-trade-frequency/trading-friction-toll-gates.png \
  -resize 800x1067 \
  -background '#f7f3ec' \
  -gravity center \
  -extent 800x1067 \
  -strip \
  -colors 256 \
  PNG8:src/content/platformArticles/expected-value-trade-frequency/trading-friction-toll-gates-x.png
```
