# Reader misunderstandings composite

Source files:

- `reader-question-probability.png`
- `reader-question-sample-space.png`

Processing notes:

- Removed only the one-pixel outer border and redundant uniform outer whitespace.
- Preserved the source screenshots unchanged beside the composite.
- Stacked the trimmed screenshots top-to-bottom, centered on the original light-gray background.
- Did not re-typeset, edit, obscure, or otherwise alter any quoted text.

Reproducible command, run from the repository root:

```bash
nix develop -c magick \( src/content/platformArticles/expected-value-trade-frequency/reader-question-probability.png -shave 1x1 -fuzz 4% -trim +repage \) \( src/content/platformArticles/expected-value-trade-frequency/reader-question-sample-space.png -shave 1x1 -fuzz 4% -trim +repage \) -background '#eeeeee' -gravity center -append src/content/platformArticles/expected-value-trade-frequency/reader-misunderstandings-composite.png
```
