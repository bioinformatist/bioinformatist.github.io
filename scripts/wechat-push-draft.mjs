const dryRun = process.argv.includes("--dry-run");

if (dryRun) {
  console.log("Dry run only. Generate platform exports with `npm run export:platform` first.");
  console.log("Real WeChat draft push is intentionally not enabled until account permissions are verified.");
  process.exit(0);
}

console.error("Refusing to push WeChat drafts without an explicit implementation and verified account permissions.");
process.exit(1);
