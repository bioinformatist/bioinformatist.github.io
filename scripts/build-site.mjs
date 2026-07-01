import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });

const result = spawnSync("zola", ["build", "--output-dir", "dist", "--force"], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
