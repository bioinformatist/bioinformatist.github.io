import { networkInterfaces, tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { join } from "node:path";

const port = process.env.PORT || "1111";
const outputDir = join(tmpdir(), `bioinformatist.github.io-zola-serve-${port}`);

function firstLanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "127.0.0.1";
}

const host = firstLanAddress();
const baseUrl = `http://${host}:${port}`;
const args = [
  "serve",
  "--interface",
  "0.0.0.0",
  "--port",
  port,
  "--output-dir",
  outputDir,
  "--force",
  "--base-url",
  baseUrl,
  "--no-port-append",
];

console.log(`Serving Zola at ${baseUrl}/`);

const child = spawn("zola", args, { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
