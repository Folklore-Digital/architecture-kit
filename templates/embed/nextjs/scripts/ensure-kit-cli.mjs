import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureKitDependency } from "./ensure-kit-install.mjs";
import {
  findKitCli,
  findKitRoot,
  isInstalledKitPackage,
  pathExists,
  printKitSetupHelp,
} from "./lib/resolve-kit.mjs";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

async function buildKitAt(kitRoot, label) {
  console.log(`Building @folklore/architecture-kit (${label})...`);
  if (await pathExists(`${kitRoot}/package-lock.json`)) {
    if (run("npm", ["ci"], kitRoot) !== 0) return false;
  } else if (run("npm", ["install"], kitRoot) !== 0) {
    return false;
  }
  return run("npm", ["run", "build"], kitRoot) === 0;
}

async function recompileKitAt(kitRoot, label) {
  console.log(`Recompiling @folklore/architecture-kit (${label})...`);
  return run("npm", ["run", "build"], kitRoot) === 0;
}

async function ensureKitCompiled(kitRootPath, label) {
  if (isInstalledKitPackage({ label })) {
    return true;
  }

  const hasDist = await pathExists(path.join(kitRootPath, "dist/cli.js"));
  if (!hasDist) {
    return buildKitAt(kitRootPath, label);
  }
  return recompileKitAt(kitRootPath, label);
}

export async function resolveKitCli() {
  await ensureKitDependency();

  const kitRoot = await findKitRoot();
  if (kitRoot && (await ensureKitCompiled(kitRoot.root, kitRoot.label))) {
    const found = await findKitCli();
    if (found) {
      return found.cli;
    }
  }

  printKitSetupHelp();
  process.exit(1);
}
