import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = dirname(fileURLToPath(import.meta.url));

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function text(x, y, value, attributes = "") {
  return `<text x="${x}" y="${y}" ${attributes}>${escapeXml(value)}</text>`;
}

function baseSvg(width, height, body, title = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f7f3ec"/>
  <style>
    text {
      font-family: "Noto Sans CJK SC", sans-serif;
      fill: #202020;
      letter-spacing: 0;
    }
    .title { font-size: 38px; font-weight: 700; }
    .subtitle { font-size: 22px; fill: #5f5a54; }
    .label { font-size: 22px; font-weight: 700; }
    .body { font-size: 19px; }
    .small { font-size: 16px; fill: #68625c; }
  </style>
  ${title ? `<title>${escapeXml(title)}</title>` : ""}
  ${body}
</svg>`;
}

const growthRates = [95.5, 60.5, 15.5];
const quarters = ["2026 Q1", "2026 Q2", "2026 Q3"];
const priceIndex = [100];
for (const growthRate of growthRates) {
  priceIndex.push(priceIndex.at(-1) * (1 + growthRate / 100));
}
const cumulativeGrowth = priceIndex.map((value) => value - 100);

function growthChart() {
  const width = 1200;
  const height = 800;
  const linePlot = { left: 135, top: 190, width: 920, height: 205 };
  const barPlot = { left: 135, top: 485, width: 920, height: 155 };
  const x = (index) => linePlot.left + (index / 3) * linePlot.width;
  const yCumulative = (value) =>
    linePlot.top + linePlot.height - (value / 300) * linePlot.height;
  const linePoints = cumulativeGrowth
    .map((value, index) => `${x(index)},${yCumulative(value)}`)
    .join(" ");

  const body = `
    ${text(60, 70, "价格仍在涨，涨价速度已经掉下来了", 'class="title"')}
    ${text(60, 110, "Conventional DRAM 合约价：季度涨幅中值与累计涨幅推演", 'class="subtitle"')}

    <rect x="55" y="145" width="1090" height="585" rx="8" fill="#fffdf9" stroke="#d9d2c8" stroke-width="2"/>

    ${text(80, 177, "相对 2025 Q4 的累计涨幅（中值连乘推演）", 'class="label"')}
    ${[0, 100, 200, 300]
      .map(
        (tick) => `
          <line x1="${linePlot.left}" y1="${yCumulative(tick)}" x2="${linePlot.left + linePlot.width}" y2="${yCumulative(tick)}"
            stroke="#e7e0d7" stroke-width="1"/>
          ${text(linePlot.left - 15, yCumulative(tick) + 6, `${tick}%`, 'class="small" text-anchor="end"')}
        `,
      )
      .join("")}

    <polyline points="${linePoints}" fill="none" stroke="#23795d" stroke-width="7"/>
    ${cumulativeGrowth
      .map(
        (value, index) => `
          <circle cx="${x(index)}" cy="${yCumulative(value)}" r="8" fill="#23795d"/>
          ${index === 0 ? "" : text(x(index), yCumulative(value) - 16, `${value.toFixed(1)}%`, 'class="body" text-anchor="middle" fill="#175b45"')}
          ${text(x(index), 430, index === 0 ? "2025 Q4" : quarters[index - 1], 'class="small" text-anchor="middle"')}
        `,
      )
      .join("")}

    ${text(80, 475, "当季环比涨幅中值", 'class="label"')}
    <line x1="${barPlot.left}" y1="${barPlot.top + barPlot.height}" x2="${barPlot.left + barPlot.width}" y2="${barPlot.top + barPlot.height}" stroke="#d8d0c7" stroke-width="2"/>
    ${growthRates
      .map((rate, index) => {
        const barWidth = 132;
        const barHeight = (rate / 100) * barPlot.height;
        const barX = x(index + 1) - barWidth / 2;
        const barY = barPlot.top + barPlot.height - barHeight;
        return `
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="5" fill="#f29b21"/>
          ${text(x(index + 1), barY - 12, `${rate}%`, 'class="label" text-anchor="middle" fill="#a95700"')}
          ${text(x(index + 1), 674, quarters[index], 'class="small" text-anchor="middle"')}
        `;
      })
      .join("")}
    ${text(600, 710, "绿线为涨幅中值连乘推演，并非官方价格指数或具体产品报价。", 'class="small" text-anchor="middle"')}
  `;

  return baseSvg(width, height, body, "DRAM价格水平与涨价速度");
}

function transmissionChart() {
  const width = 1200;
  const height = 800;
  const items = [
    ["DRAM 原厂", "售价与出货量", "收入、毛利率", "#f29b21"],
    ["模组厂", "晶圆采购与库存", "库存收益或成本压力", "#55a57f"],
    ["接口芯片", "服务器出货与代际", "芯片销量和产品结构", "#4f88b7"],
    ["设备材料", "原厂资本开支", "订单和产能利用率", "#9b75ad"],
    ["终端品牌", "零部件成本", "提价、降配或需求受压", "#c06d5e"],
  ];

  const body = `
    ${text(60, 70, "同一轮涨价，不是同一张利润表", 'class="title"')}
    ${text(60, 110, "上市地点不是利润因子，产业链位置才是", 'class="subtitle"')}
    <line x1="95" y1="180" x2="1105" y2="180" stroke="#262626" stroke-width="4"/>
    ${text(600, 155, "DRAM 价格上涨", 'class="label" text-anchor="middle"')}
    ${items
      .map((item, index) => {
        const x = 55 + index * 226;
        const center = x + 105;
        return `
          <line x1="${center}" y1="180" x2="${center}" y2="235" stroke="#77716b" stroke-width="3"/>
          <path d="M${center - 9} 223 L${center} 237 L${center + 9} 223" fill="none" stroke="#77716b" stroke-width="3"/>
          <rect x="${x}" y="250" width="210" height="410" rx="8" fill="#fffdf9" stroke="${item[3]}" stroke-width="4"/>
          <rect x="${x}" y="250" width="210" height="86" rx="6" fill="${item[3]}"/>
          ${text(center, 304, item[0], 'class="label" text-anchor="middle" fill="#ffffff"')}
          ${text(center, 390, "首先影响", 'class="small" text-anchor="middle"')}
          ${text(center, 430, item[1], 'class="body" text-anchor="middle"')}
          <line x1="${x + 25}" y1="475" x2="${x + 185}" y2="475" stroke="#ddd5cb" stroke-width="2"/>
          ${text(center, 525, "最终观察", 'class="small" text-anchor="middle"')}
          ${text(center, 567, item[2], 'class="body" text-anchor="middle"')}
          ${text(center, 620, index === 0 ? "直接价格暴露" : "间接传导", 'class="small" text-anchor="middle" fill="' + item[3] + '"')}
        `;
      })
      .join("")}
    ${text(600, 735, "“存储概念股”共享题材，不代表共享同一种盈利弹性。", 'class="body" text-anchor="middle"')}
  `;

  return baseSvg(width, height, body, "存储产业链利润传导");
}

function fomoChart() {
  const width = 1200;
  const height = 800;
  const plot = { left: 80, top: 165, width: 1040, height: 470 };
  const market = [
    [0.0, 0.14],
    [0.12, 0.18],
    [0.25, 0.28],
    [0.39, 0.48],
    [0.5, 0.86],
    [0.58, 0.54],
    [0.65, 0.31],
    [0.74, 0.56],
    [0.82, 0.45],
    [0.9, 0.32],
    [1.0, 0.27],
  ];
  const fundamental = [
    [0.0, 0.13],
    [0.25, 0.2],
    [0.5, 0.3],
    [0.75, 0.38],
    [1.0, 0.44],
  ];
  const point = ([x, y]) =>
    `${plot.left + x * plot.width},${plot.top + (1 - y) * plot.height}`;
  const marketPoints = market.map(point).join(" ");
  const fundamentalPoints = fundamental.map(point).join(" ");

  const body = `
    ${text(60, 70, "基本面仍向上，情绪已经走完一轮过山车", 'class="title"')}
    ${text(60, 110, "FOMO 上冲 → 快速回撤 → relief rally → 再次承压", 'class="subtitle"')}
    <rect x="55" y="145" width="1090" height="555" rx="8" fill="#fffdf9" stroke="#d9d2c8" stroke-width="2"/>
    <rect x="${plot.left + 0.25 * plot.width}" y="${plot.top}" width="${0.27 * plot.width}" height="${plot.height}" fill="#f29b21" fill-opacity="0.11"/>
    <rect x="${plot.left + 0.52 * plot.width}" y="${plot.top}" width="${0.14 * plot.width}" height="${plot.height}" fill="#b94f42" fill-opacity="0.09"/>
    <rect x="${plot.left + 0.66 * plot.width}" y="${plot.top}" width="${0.13 * plot.width}" height="${plot.height}" fill="#4f88b7" fill-opacity="0.12"/>
    <rect x="${plot.left + 0.79 * plot.width}" y="${plot.top}" width="${0.21 * plot.width}" height="${plot.height}" fill="#77716b" fill-opacity="0.07"/>
    ${[0.2, 0.4, 0.6, 0.8]
      .map(
        (value) =>
          `<line x1="${plot.left}" y1="${plot.top + (1 - value) * plot.height}" x2="${plot.left + plot.width}" y2="${plot.top + (1 - value) * plot.height}" stroke="#ebe5dc" stroke-width="1"/>`,
      )
      .join("")}
    <polyline points="${fundamentalPoints}" fill="none" stroke="#23795d" stroke-width="7" stroke-dasharray="16 10"/>
    <polyline points="${marketPoints}" fill="none" stroke="#202020" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>

    ${text(plot.left + 0.385 * plot.width, 194, "FOMO 追价阶段", 'class="body" text-anchor="middle" fill="#a95700"')}
    ${text(plot.left + 0.59 * plot.width, 194, "快速回撤", 'class="small" text-anchor="middle" fill="#963b30"')}
    ${text(plot.left + 0.725 * plot.width, 194, "relief rally", 'class="small" text-anchor="middle" fill="#3d6f98"')}
    ${text(plot.left + 0.895 * plot.width, 194, "再次承压", 'class="small" text-anchor="middle"')}

    <line x1="170" y1="665" x2="225" y2="665" stroke="#202020" stroke-width="7"/>
    ${text(240, 672, "市场价格", 'class="body"')}
    <line x1="455" y1="665" x2="510" y2="665" stroke="#23795d" stroke-width="7" stroke-dasharray="16 10"/>
    ${text(525, 672, "基本价值趋势（示意）", 'class="body"')}
    ${text(1030, 672, "时间 →", 'class="body" text-anchor="end"')}
    ${text(600, 750, "图示解释机制，不代表任何公司的精确估值或价格预测。", 'class="small" text-anchor="middle"')}
  `;

  return baseSvg(width, height, body, "FOMO与relief rally机制");
}

function cxmtReceipt() {
  const width = 1200;
  const height = 800;
  const body = `
    ${text(60, 70, "市场给了多高的估值？", 'class="title"')}
    ${text(60, 110, "长鑫科技上市首日估值倍数，与 Micron 写作时点粗略对照", 'class="subtitle"')}

    <rect x="95" y="145" width="1010" height="575" fill="#fffdf9" stroke="#202020" stroke-width="3"/>
    ${text(300, 205, "估值指标", 'class="small" text-anchor="middle"')}
    ${text(660, 205, "长鑫科技", 'class="label" text-anchor="middle" fill="#d97800"')}
    ${text(935, 205, "Micron（MU）", 'class="label" text-anchor="middle" fill="#23795d"')}
    <line x1="130" y1="235" x2="1070" y2="235" stroke="#d9d2c8" stroke-width="2"/>

    ${text(300, 295, "参考市值", 'class="body" text-anchor="middle"')}
    ${text(660, 295, "3.28 万亿元", 'class="label" text-anchor="middle" fill="#d97800"')}
    ${text(935, 295, "约 8462 亿美元", 'class="label" text-anchor="middle" fill="#23795d"')}
    <line x1="130" y1="335" x2="1070" y2="335" stroke="#e6dfd6" stroke-width="2"/>

    ${text(300, 410, "市销率 P/S", 'class="label" text-anchor="middle"')}
    ${text(300, 445, "市值 ÷ 营业收入", 'class="small" text-anchor="middle"')}
    ${text(660, 435, "约 53 倍", 'font-size="58" font-weight="800" text-anchor="middle" fill="#d97800"')}
    ${text(935, 435, "约 9.4 倍", 'font-size="48" font-weight="800" text-anchor="middle" fill="#23795d"')}
    <line x1="130" y1="485" x2="1070" y2="485" stroke="#e6dfd6" stroke-width="2"/>

    ${text(300, 560, "市净率 P/B", 'class="label" text-anchor="middle"')}
    ${text(300, 595, "市值 ÷ 股东权益", 'class="small" text-anchor="middle"')}
    ${text(660, 585, "约 58 倍", 'font-size="58" font-weight="800" text-anchor="middle" fill="#d97800"')}
    ${text(935, 585, "约 8.4 倍", 'font-size="48" font-weight="800" text-anchor="middle" fill="#23795d"')}

    <rect x="95" y="660" width="1010" height="60" fill="#202020"/>
    ${text(600, 699, "财务期间不同，仅作数量级参照，不直接等于公允价值", 'class="body" text-anchor="middle" style="fill:#fffdf9"')}
  `;

  return baseSvg(width, height, body, "长鑫科技上市首日估值账单");
}

function tradingCostDistribution() {
  const width = 1200;
  const height = 800;

  function curvePath(plotLeft, plotWidth, baseY, center, sigma, amplitude) {
    const points = [];
    for (let index = 0; index <= 100; index += 1) {
      const value = -3 + (index / 100) * 6;
      const x = plotLeft + (index / 100) * plotWidth;
      const density = Math.exp(-((value - center) ** 2) / (2 * sigma ** 2));
      const y = baseY - amplitude * density;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return points.join(" ");
  }

  const left = { x: 70, width: 500, baseY: 620 };
  const right = { x: 650, width: 500, baseY: 620 };
  const leftZero = left.x + left.width / 2;
  const rightZero = right.x + right.width / 2;
  const rightNetMean = right.x + ((-0.7 + 3) / 6) * right.width;

  const body = `
    ${text(60, 70, "波动把结果摊开，成本把均值推向亏损", 'class="title"')}
    ${text(60, 110, "没有预测优势时：高波动不创造正期望，交易摩擦却会持续扣分", 'class="subtitle"')}

    <rect x="55" y="145" width="530" height="555" rx="8" fill="#fffdf9" stroke="#d9d2c8" stroke-width="2"/>
    <rect x="635" y="145" width="530" height="555" rx="8" fill="#fffdf9" stroke="#d9d2c8" stroke-width="2"/>

    ${text(320, 195, "毛超额收益：中心仍在 0", 'class="label" text-anchor="middle"')}
    <line x1="${left.x}" y1="${left.baseY}" x2="${left.x + left.width}" y2="${left.baseY}" stroke="#77716b" stroke-width="2"/>
    <line x1="${leftZero}" y1="235" x2="${leftZero}" y2="${left.baseY}" stroke="#202020" stroke-width="2" stroke-dasharray="8 8"/>
    <polyline points="${curvePath(left.x, left.width, left.baseY, 0, 0.65, 285)}" fill="none" stroke="#8f8982" stroke-width="5"/>
    <polyline points="${curvePath(left.x, left.width, left.baseY, 0, 1.2, 210)}" fill="none" stroke="#f29b21" stroke-width="8"/>
    ${text(leftZero, 650, "0", 'class="body" text-anchor="middle"')}
    ${text(110, 665, "亏损", 'class="small"')}
    ${text(535, 665, "盈利", 'class="small" text-anchor="end"')}
    <line x1="130" y1="245" x2="180" y2="245" stroke="#8f8982" stroke-width="5"/>
    ${text(192, 252, "低波动", 'class="small"')}
    <line x1="365" y1="245" x2="415" y2="245" stroke="#f29b21" stroke-width="8"/>
    ${text(427, 252, "高波动", 'class="small"')}
    ${text(320, 685, "分布变宽，不代表中心右移", 'class="small" text-anchor="middle"')}

    ${text(900, 195, "扣除成本：中心向左移动", 'class="label" text-anchor="middle"')}
    <line x1="${right.x}" y1="${right.baseY}" x2="${right.x + right.width}" y2="${right.baseY}" stroke="#77716b" stroke-width="2"/>
    <line x1="${rightZero}" y1="235" x2="${rightZero}" y2="${right.baseY}" stroke="#202020" stroke-width="2" stroke-dasharray="8 8"/>
    <polyline points="${curvePath(right.x, right.width, right.baseY, 0, 1.05, 210)}" fill="none" stroke="#a9a39c" stroke-width="5" stroke-dasharray="12 8"/>
    <polyline points="${curvePath(right.x, right.width, right.baseY, -0.7, 1.05, 210)}" fill="none" stroke="#b94f42" stroke-width="8"/>
    <line x1="${rightNetMean}" y1="345" x2="${rightNetMean}" y2="${right.baseY}" stroke="#b94f42" stroke-width="3"/>
    ${text(rightNetMean, 330, "净收益均值", 'class="small" text-anchor="middle" fill="#963b30"')}
    ${text(rightZero, 650, "0", 'class="body" text-anchor="middle"')}
    ${text(690, 665, "亏损", 'class="small"')}
    ${text(1115, 665, "盈利", 'class="small" text-anchor="end"')}
    ${text(900, 685, "每次交易成本都把分布向左推", 'class="small" text-anchor="middle"')}

    ${text(600, 755, "示意图：曲线用于解释均值与离散程度，不假设真实收益服从正态分布。", 'class="small" text-anchor="middle"')}
  `;

  return baseSvg(width, height, body, "交易成本如何移动收益分布");
}

function cover() {
  const width = 1600;
  const height = 640;
  const body = `
    <rect x="0" y="0" width="1600" height="640" fill="#121212"/>
    <rect x="0" y="0" width="34" height="640" fill="#f29b21"/>

    ${text(105, 120, "基本面没坏，为什么我不买？", 'font-size="36" font-weight="600" style="fill:#f5f2ec"')}
    ${text(100, 330, "存储", 'font-size="196" font-weight="900" style="fill:#f29b21"')}
    ${text(112, 420, "未来十年的故事", 'font-size="48" font-weight="700" style="fill:#f5f2ec"')}
    ${text(112, 480, "可能几天就买完了", 'font-size="48" font-weight="700" style="fill:#f5f2ec"')}

    <rect x="900" y="120" width="560" height="350" rx="18" fill="#1d1d1d" stroke="#f29b21" stroke-width="8"/>
    ${[0, 1, 2, 3]
      .map(
        (row) =>
          [0, 1, 2]
            .map(
              (column) =>
                `<rect x="${955 + column * 165}" y="${165 + row * 72}" width="125" height="44" rx="5" fill="#f2eee7"/>`,
            )
            .join(""),
      )
      .join("")}
    ${Array.from(
      { length: 12 },
      (_, index) =>
        `<rect x="${932 + index * 44}" y="470" width="20" height="48" fill="#f29b21"/>`,
    ).join("")}
    ${text(1180, 585, "DRAM", 'font-size="32" font-weight="800" text-anchor="middle" style="fill:#7d7770"')}

    <path d="M820 525 C925 515 1015 480 1075 370 C1135 260 1195 130 1260 215 C1320 292 1345 440 1430 300 C1475 225 1520 250 1570 330"
      fill="none" stroke="#f29b21" stroke-width="18" stroke-linecap="round"/>
    <circle cx="1260" cy="215" r="14" fill="#f5f2ec"/>
  `;

  return baseSvg(width, height, body, "我为什么不建议你买存储");
}

const assets = new Map([
  ["dram-price-growth-deceleration.svg", growthChart()],
  ["storage-profit-transmission.svg", transmissionChart()],
  ["fomo-relief-rally.svg", fomoChart()],
  ["cxmt-market-receipt.svg", cxmtReceipt()],
  ["trading-cost-distribution.svg", tradingCostDistribution()],
  ["x-article-cover.svg", cover()],
]);

await Promise.all(
  [...assets].map(([filename, contents]) =>
    writeFile(join(outputDirectory, filename), contents),
  ),
);

console.log(`Generated ${assets.size} SVG assets in ${outputDirectory}`);
