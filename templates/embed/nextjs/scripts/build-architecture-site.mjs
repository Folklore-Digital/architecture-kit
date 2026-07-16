import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveKitCli } from "./ensure-kit-cli.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteOut = path.join(root, "public/architecture");
const ARCHITECTURE_MOUNT = "/architecture/";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const kitCli = await resolveKitCli();

console.log("Building architecture docs site (kit output)...");
run(process.execPath, [kitCli, "build", "--out", siteOut], root);

console.log("Embedding docs for host app mount path...");
run(process.execPath, ["scripts/embed-architecture-site.mjs"], root);

console.log("");
console.log(`Architecture docs available at ${ARCHITECTURE_MOUNT}`);
