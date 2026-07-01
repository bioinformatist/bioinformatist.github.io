import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const avatarPath = "static/img/avatar-sun-yu.jpg";
const svgPath = "/tmp/bioinformatist-social-card.svg";
const output = "static/img/social-card-home.png";

const avatar = readFileSync(avatarPath).toString("base64");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="avatarClip">
      <circle cx="930" cy="315" r="156"/>
    </clipPath>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="#fbfbf8"/>
  <rect x="58" y="54" width="1084" height="522" rx="28" fill="#ffffff" stroke="#e8dfcf" stroke-width="2"/>
  <path d="M58 520 C230 460 350 585 512 526 C670 468 770 518 904 478 C1012 446 1084 468 1142 430 L1142 576 L58 576 Z" fill="#fff0d1"/>
  <text x="112" y="142" fill="#b45309" font-family="DejaVu Sans, Arial, sans-serif" font-size="46" font-weight="700">~/yu-sun</text>
  <text x="112" y="246" fill="#16232a" font-family="DejaVu Sans, Arial, sans-serif" font-size="78" font-weight="700">Yu Sun</text>
  <text x="116" y="324" fill="#334155" font-family="DejaVu Sans, Arial, sans-serif" font-size="34" font-weight="500">Head of AI. Former data scientist.</text>
  <text x="116" y="390" fill="#b45309" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="600">Bioinformatics · Data Science</text>
  <text x="116" y="436" fill="#b45309" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" font-weight="600">Software Engineering</text>
  <text x="116" y="518" fill="#64748b" font-family="DejaVu Sans, Arial, sans-serif" font-size="28">bioinformatist.github.io</text>
  <circle cx="930" cy="315" r="170" fill="#f59e0b" opacity="0.18" filter="url(#softShadow)"/>
  <image x="774" y="159" width="312" height="312" clip-path="url(#avatarClip)" href="data:image/jpeg;base64,${avatar}"/>
  <circle cx="930" cy="315" r="156" fill="none" stroke="#b45309" stroke-width="8"/>
</svg>
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(svgPath, svg);

execFileSync(
  "magick",
  [
    resolve(svgPath),
    "-resize",
    "1200x630!",
    "-strip",
    output,
  ],
  { stdio: "inherit" },
);
