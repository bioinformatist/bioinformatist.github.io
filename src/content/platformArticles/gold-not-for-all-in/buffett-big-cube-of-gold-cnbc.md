# buffett-big-cube-of-gold-cnbc.jpg

用途：配合《为什么黄金不适合大笔梭哈？》中“难道巴菲特错了？”一节，引用 CNBC Buffett Archive 中 Warren Buffett 在 2011 Berkshire Hathaway Annual Meeting 谈黄金的关键帧，并在下方添加中文观点摘译。

来源：

- Page: https://buffett.cnbc.com/video/2011/04/30/buffett-on-a-big-cube-of-gold.html
- Image URL from CNBC page metadata: https://image.cnbcfm.com/api/v1/image/105106672-BAM-2011-CLIP-08-1.jpg?v=1529477912
- Title: `A big cube of gold`
- Date: 2011-04-30
- Publisher/site: CNBC Buffett Archive

使用说明：

- 本文仅作评论与说明引用。
- 保留画面右下角的 Buffett Archive / CNBC 标识。
- 中文文字是观点摘译，不是视频原始字幕。
- 不用作封面图，不裁切成装饰图，不与多张 CNBC 视频截图组合使用。

重生成命令：

```bash
curl -L --fail \
  -A 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' \
  'https://image.cnbcfm.com/api/v1/image/105106672-BAM-2011-CLIP-08-1.jpg?v=1529477912&w=1200&h=675' \
  -o /tmp/buffett-big-cube-source.jpg

nix develop .#lighthouse -c magick \
  -size 1200x855 xc:'#101214' \
  /tmp/buffett-big-cube-source.jpg -geometry +0+0 -composite \
  -fill '#f2b84b' -draw 'rectangle 0,675 1200,681' \
  -font 'Noto-Sans-CJK-SC' \
  -fill '#f7f1df' -pointsize 40 -gravity NorthWest \
  -annotate +54+720 '观点摘译：黄金不会生产任何东西；' \
  -fill '#f2b84b' -pointsize 40 \
  -annotate +54+770 '长期复利要靠农田、企业这类生产性资产。' \
  -fill '#c8c0ad' -pointsize 24 \
  -annotate +54+828 '图源：CNBC Buffett Archive, “A big cube of gold”, 2011-04-30。本文仅作评论与说明引用。' \
  -quality 90 \
  src/content/platformArticles/gold-not-for-all-in/buffett-big-cube-of-gold-cnbc.jpg
```
