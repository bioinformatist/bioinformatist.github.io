# DRAM price growth deceleration chart

## Purpose

Show the difference between a rising cumulative price change and a falling
quarterly growth rate. The green line is a midpoint-based cumulative-change
illustration and the orange bars are reported quarterly growth-rate midpoints.

## Data

- 2026 Q1 conventional DRAM contract prices: 93% to 98% QoQ; midpoint 95.5%.
- 2026 Q2 conventional DRAM contract prices: 58% to 63% QoQ; midpoint 60.5%.
- 2026 Q3 conventional DRAM contract prices: 13% to 18% QoQ; midpoint 15.5%.
- The cumulative-change illustration starts at 0% in 2025 Q4 and compounds the
  three midpoint growth rates: 0%, 95.5%, 213.8%, and 262.4%.
- The green line is not a TrendForce index or a quoted DRAM product price.

Sources:

- https://www.trendforce.com/presscenter/news/20260601-13070.html
- https://www.trendforce.com/presscenter/news/20260703-13134.html

## Reproduction

Run `node build-article-assets.mjs`, then rasterize the generated SVG with
ImageMagick. The SVG is a deterministic source asset, not an AI-generated
market forecast.
