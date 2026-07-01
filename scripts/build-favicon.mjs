import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const source = "static/img/avatar-sun-yu.jpg";
const output = "static/favicon.png";

mkdirSync(dirname(output), { recursive: true });

execFileSync(
  "magick",
  [
    source,
    "-resize",
    "128x128^",
    "-gravity",
    "center",
    "-extent",
    "128x128",
    "-filter",
    "point",
    "-resize",
    "24x24",
    "-colors",
    "32",
    "-filter",
    "point",
    "-resize",
    "256x256",
    "-strip",
    output,
  ],
  { stdio: "inherit" },
);

