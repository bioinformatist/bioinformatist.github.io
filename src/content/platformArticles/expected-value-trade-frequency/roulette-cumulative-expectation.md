# roulette-cumulative-expectation.png

Deterministic, code-generated statistical illustration for the roulette example. It compares individual cumulative P&L paths, the pointwise mean of 5,000 simulated paths, and the exact theoretical expectation line.

## Model

- European roulette red bet: win `+100` with probability `18 / 37`, lose `-100` with probability `19 / 37`.
- Each path contains 200 independent bets.
- The illustration shows 36 individual paths.
- The green line is the pointwise mean of 5,000 simulated paths.
- The orange line is the exact expectation `E[S_n] = -100n / 37`.
- The theoretical line has slope `-100 / 37`, or about `-2.70` yuan per bet.
- The vertical range is fixed at `-4,000` to `4,000` yuan, which contains every seeded sample path; an SVG clip path prevents strokes from crossing the plotting boundary.
- The seeded pseudo-random generator uses seed `20260728`, so reruns produce the same paths.

## Generation

```bash
nix develop .#lighthouse -c node \
  src/content/platformArticles/expected-value-trade-frequency/roulette-cumulative-expectation.mjs \
  /tmp/roulette-cumulative-expectation.svg

nix develop .#lighthouse -c magick \
  -background none \
  /tmp/roulette-cumulative-expectation.svg \
  -resize 1200x800 \
  -gravity center \
  -extent 1200x800 \
  -strip \
  -colors 256 \
  PNG8:src/content/platformArticles/expected-value-trade-frequency/roulette-cumulative-expectation.png
```
