import { spawnSync } from "node:child_process";
import { resolveKitCli } from "./ensure-kit-cli.mjs";

const kitCli = await resolveKitCli();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "Usage: node scripts/run-architecture-kit.mjs <command> [options]",
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [kitCli, ...args], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
