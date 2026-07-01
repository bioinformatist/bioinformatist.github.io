import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const source = "src/assets/avatar-sun-yu-original.jpg";
const output = "static/img/avatar-sun-yu.jpg";

mkdirSync(dirname(output), { recursive: true });

execFileSync(
  "magick",
  [
    source,
    "-auto-orient",
    "-crop",
    "1080x1080+0+500",
    "+repage",
    "-resize",
    "512x512",
    "-strip",
    "-quality",
    "86",
    output,
  ],
  { stdio: "inherit" },
);
