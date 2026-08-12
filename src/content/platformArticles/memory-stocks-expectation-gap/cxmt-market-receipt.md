# CXMT market receipt

## Purpose

Compare CXMT's first-day price-to-sales and price-to-book multiples with
Micron on the same two valuation dimensions.

## Data

- First-day closing market capitalization: RMB 3.28 trillion.
- 2025 revenue: RMB 61.799 billion.
- 2025 equity attributable to parent shareholders: RMB 56.754 billion.
- Implied market-cap-to-revenue multiple: approximately 53.
- Implied market-cap-to-parent-equity multiple: approximately 58.
- Micron market capitalization at writing: approximately USD 846.155 billion.
- Micron trailing-twelve-month revenue: USD 90.274 billion, calculated as
  FY2025 revenue plus the first nine months of FY2026 minus the first nine
  months of FY2025.
- Micron latest total equity: USD 100.724 billion.
- Implied Micron P/S: approximately 9.4.
- Implied Micron P/B: approximately 8.4.

Sources:

- https://paper.cnstock.com/html/2026-07/28/content_2249077.htm
- https://static.sse.com.cn/disclosure/listedinfo/announcement/c/new/2026-07-22/688825_20260722_Q1T7.pdf
- https://www.sec.gov/Archives/edgar/data/723125/000072312525000028/mu-20250828.htm
- https://www.sec.gov/Archives/edgar/data/723125/000072312526000015/mu-20260528.htm

## Important limitation

The multiples are scale comparisons, not standalone fair-value estimates.
CXMT uses 2025 annual figures while Micron uses trailing revenue and latest
equity, so the comparison is deliberately approximate. It avoids annualizing
a cyclical peak quarter.

## Reproduction

Run `node build-article-assets.mjs`, then rasterize the generated SVG with
ImageMagick.
