import { writeFile } from "node:fs/promises";

const outputPath = process.argv[2];

if (!outputPath) {
  console.error("Usage: node roulette-cumulative-expectation.mjs <output.svg>");
  process.exit(1);
}

const width = 1200;
const height = 800;
const spins = 200;
const samplePathCount = 36;
const meanPathCount = 5000;
const stake = 100;

let seed = 20260728;

function random() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 2 ** 32;
}

function spin() {
  return random() < 18 / 37 ? stake : -stake;
}

function pathData() {
  const path = [0];

  for (let i = 0; i < spins; i += 1) {
    path.push(path.at(-1) + spin());
  }

  return path;
}

const samplePaths = Array.from({ length: samplePathCount }, pathData);
const meanPath = Array.from({ length: spins + 1 }, () => 0);

for (let pathIndex = 0; pathIndex < meanPathCount; pathIndex += 1) {
  const path = pathData();

  for (let i = 0; i <= spins; i += 1) {
    meanPath[i] += path[i] / meanPathCount;
  }
}

const plot = {
  left: 500,
  top: 175,
  width: 615,
  height: 370,
  minY: -4000,
  maxY: 4000,
};

const x = (value) => plot.left + (value / spins) * plot.width;
const y = (value) =>
  plot.top +
  ((plot.maxY - value) / (plot.maxY - plot.minY)) * plot.height;

function points(values) {
  return values
    .map((value, index) => `${x(index).toFixed(2)},${y(value).toFixed(2)}`)
    .join(" ");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function text(xPosition, yPosition, value, attributes = "") {
  return `<text x="${xPosition}" y="${yPosition}" ${attributes}>${escapeXml(value)}</text>`;
}

const theoreticalPath = Array.from(
  { length: spins + 1 },
  (_, index) => (-stake / 37) * index,
);

const yTicks = [-4000, -3000, -2000, -1000, 0, 1000, 2000, 3000, 4000];
const xTicks = [0, 50, 100, 150, 200];

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f7f3ec"/>
  <defs>
    <clipPath id="plot-area">
      <rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}"/>
    </clipPath>
  </defs>
  <style>
    text {
      font-family: "Noto Sans CJK SC", sans-serif;
      fill: #242424;
      letter-spacing: 0;
    }
    .title { font-size: 36px; font-weight: 700; }
    .panel-title { font-size: 25px; font-weight: 700; }
    .body { font-size: 22px; }
    .small { font-size: 18px; }
    .axis { font-size: 16px; fill: #5f5f5f; }
  </style>

  ${text(60, 64, "一次结果会乱跳，平均结果沿期望线移动", 'class="title"')}

  <rect x="55" y="110" width="350" height="590" rx="8" fill="#fffdf9" stroke="#d8d1c7" stroke-width="2"/>
  ${text(85, 155, "一次投注", 'class="panel-title"')}

  <rect x="85" y="200" width="290" height="115" rx="8" fill="#e3f0e9" stroke="#8eb7a3" stroke-width="2"/>
  ${text(115, 248, "+100 元", 'font-size="32" font-weight="700" fill="#21654d"')}
  ${text(115, 282, "概率 18 / 37", 'class="body"')}

  <rect x="85" y="340" width="290" height="115" rx="8" fill="#f4e4df" stroke="#c99b8f" stroke-width="2"/>
  ${text(115, 388, "-100 元", 'font-size="32" font-weight="700" fill="#8b3a2d"')}
  ${text(115, 422, "概率 19 / 37", 'class="body"')}

  <path d="M230 472 V515" stroke="#77716a" stroke-width="3"/>
  <path d="M218 502 L230 518 L242 502" fill="none" stroke="#77716a" stroke-width="3"/>
  ${text(98, 565, "加权平均", 'class="small"')}
  ${text(98, 612, "E[X] = -2.70 元", 'font-size="29" font-weight="700" fill="#b16618"')}
  ${text(98, 653, "不是下一次的结果", 'class="small" fill="#66615b"')}

  <rect x="440" y="110" width="705" height="620" rx="8" fill="#fffdf9" stroke="#d8d1c7" stroke-width="2"/>
  ${text(470, 155, "重复 200 次", 'class="panel-title"')}

  ${yTicks
    .map(
      (tick) => `
        <line x1="${plot.left}" y1="${y(tick)}" x2="${plot.left + plot.width}" y2="${y(tick)}"
          stroke="${tick === 0 ? "#a9a39a" : "#e7e1d8"}" stroke-width="${tick === 0 ? 2 : 1}"/>
        ${text(plot.left - 12, y(tick) + 6, String(tick), 'class="axis" text-anchor="end"')}
      `,
    )
    .join("")}

  ${xTicks
    .map(
      (tick) => {
        const anchor =
          tick === 0 ? "start" : tick === spins ? "end" : "middle";
        return `
        <line x1="${x(tick)}" y1="${plot.top}" x2="${x(tick)}" y2="${plot.top + plot.height}"
          stroke="#eee8df" stroke-width="1"/>
        ${text(x(tick), plot.top + plot.height + 27, String(tick), `class="axis" text-anchor="${anchor}"`)}
      `;
      },
    )
    .join("")}

  <g clip-path="url(#plot-area)">
    ${samplePaths
      .map(
        (path) =>
          `<polyline points="${points(path)}" fill="none" stroke="#a7a7a7" stroke-opacity="0.20" stroke-width="1.5"/>`,
      )
      .join("")}

    <polyline points="${points(meanPath)}" fill="none" stroke="#28775c" stroke-width="5"/>
    <polyline points="${points(theoreticalPath)}" fill="none" stroke="#ef981b" stroke-width="5" stroke-dasharray="13 8"/>
  </g>

  ${text(plot.left + 18, plot.top + 30, "Sₙ（元）", 'class="axis"')}
  ${text(plot.left + plot.width, plot.top + plot.height + 55, "投注次数 n", 'class="axis" text-anchor="end"')}

  <line x1="665" y1="625" x2="715" y2="625" stroke="#a7a7a7" stroke-opacity="0.55" stroke-width="3"/>
  ${text(726, 632, "单个账户", 'class="small"')}
  <line x1="855" y1="625" x2="905" y2="625" stroke="#28775c" stroke-width="5"/>
  ${text(916, 632, "5000 条路径均值", 'class="small"')}
  <line x1="665" y1="675" x2="715" y2="675" stroke="#ef981b" stroke-width="5" stroke-dasharray="13 8"/>
  ${text(726, 682, "理论累计期望", 'class="small"')}
  ${text(916, 682, "斜率 = -2.70 元 / 次", 'class="small" fill="#b16618"')}

  ${text(600, 775, "单条路径可能暂时赚钱；路径的平均值会靠近理论期望线。", 'class="small" text-anchor="middle" fill="#66615b"')}
</svg>
`;

await writeFile(outputPath, svg);
