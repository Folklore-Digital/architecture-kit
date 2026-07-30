import path from "node:path";
import { spawnSync } from "node:child_process";
import { ensureKitDependency } from "./ensure-kit-install.mjs";
import {
  kitInstallInKitRoot,
  kitRunBuildInKitRoot,
} from "./lib/package-manager.mjs";
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
  console.log(`Building @folklore-digital/architecture-kit (${label})...`);
  const install = await kitInstallInKitRoot(kitRoot);
  if (run(install.command, install.args, kitRoot) !== 0) return false;
  const build = await kitRunBuildInKitRoot(kitRoot);
  return run(build.command, build.args, kitRoot) === 0;
}

async function recompileKitAt(kitRoot, label) {
  console.log(`Recompiling @folklore-digital/architecture-kit (${label})...`);
  const build = await kitRunBuildInKitRoot(kitRoot);
  return run(build.command, build.args, kitRoot) === 0;
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
