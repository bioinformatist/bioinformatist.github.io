# gold-price-transmission.png

用途：配合《为什么黄金不适合大笔梭哈？》中“黄金价格的传导链”一节，用一张图说明实际利率、美元、风险事件和央行配置如何共同影响黄金价格。

生成说明：

- 源图为同目录下的 `gold-price-transmission.svg`。
- PNG 由 ImageMagick 从 SVG 转换生成。
- 视觉目标：用三条路径表达黄金价格的主要传导链，避免把“黄金为什么涨”和“黄金为什么跌”拆成重复叙述。
- 文案重点：黄金不是简单的“抗通胀按钮”，它交易的是机会成本和信用压力。

重生成命令：

```bash
nix develop .#lighthouse -c magick src/content/platformArticles/gold-not-for-all-in/gold-price-transmission.svg src/content/platformArticles/gold-not-for-all-in/gold-price-transmission.png
```
