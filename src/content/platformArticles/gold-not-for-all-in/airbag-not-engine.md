# airbag-not-engine.png

Generated with the built-in image generation tool, then resized/cropped to 1600x900 and compressed as an indexed PNG for platform publishing.

## Prompt

Use case: illustration-story
Asset type: editorial cartoon illustration for a Chinese investment-education article
Primary request: Create a polished single-panel editorial cartoon illustrating the metaphor: an airbag is useful, but you should not turn the whole car into airbags. The article uses this metaphor to explain that gold can be a portfolio safety cushion, not the main engine.
Scene/backdrop: A clean, modern garage or road-side scene with a compact car. The car still has a visible engine area and steering wheel, but the cabin and exterior are absurdly overfilled with inflated white airbags, making it clear the car cannot drive properly. A few subtle gold bars or gold coins sit near the safety equipment to imply gold as a portfolio cushion.
Subject: The tension between useful safety protection and overdoing it. The car should look stuck or impractical, not crashed or violent.
Composition: Wide 16:9 composition, readable at article width, main car centered, uncluttered background, strong silhouette, no tiny details.
Style: sophisticated editorial cartoon, clean lines, semi-flat digital illustration, warm gold accents, restrained dark-neutral and cream palette, professional finance-publication tone.
Avoid: no readable text, no brand logos, no real car badges, no gore, no crash scene, no people injured, no meme style, no childish stickers, no watermark.

## Post-processing

```bash
magick <generated-image>.png \
  -resize 1600x900^ \
  -gravity center \
  -extent 1600x900 \
  -strip \
  -quality 88 \
  src/content/platformArticles/gold-not-for-all-in/airbag-not-engine.png

magick src/content/platformArticles/gold-not-for-all-in/airbag-not-engine.png \
  -strip \
  -colors 256 \
  PNG8:/tmp/airbag-not-engine-png8.png

cp /tmp/airbag-not-engine-png8.png \
  src/content/platformArticles/gold-not-for-all-in/airbag-not-engine.png
```
