# long-gamma-vs-grid.png

用途：配合《为什么你的网格策略一直亏钱？》中“它是做多波动率吗？”一节，解释正 gamma/long vol 与普通多头网格的关键差异。

生成说明：

- 源图为同目录下的 `long-gamma-vs-grid.svg`。
- PNG 由 ImageMagick 从 SVG 转换生成。
- 视觉目标：左侧用 U 型收益曲线表达“long gamma 喜欢价格大幅运动”，右侧用网格线、往返路径、单边下跌路径和库存柱表达“普通网格喜欢区间往返，单边下跌会增加库存”。
- 文案重点：`Long gamma 喜欢“动得大”，网格喜欢“来回动”`。

重生成命令：

```bash
nix develop .#lighthouse -c magick src/content/platformArticles/grid-strategy-expected-value/long-gamma-vs-grid.svg src/content/platformArticles/grid-strategy-expected-value/long-gamma-vs-grid.png
```
