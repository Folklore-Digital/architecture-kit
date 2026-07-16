import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectPackageManager,
  kitUpdateCommand,
} from "./lib/package-manager.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function hasKitDependency(pkg) {
  return (
    pkg.devDependencies?.["@folklore/architecture-kit"] ??
    pkg.optionalDependencies?.["@folklore/architecture-kit"]
  );
}

/** Pull latest kit matching the host repo's semver range (git tag or registry). */
export async function ensureKitDependency() {
  if (process.env.ARCHITECTURE_KIT_LOCAL === "1") {
    return;
  }

  const pkg = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  if (!hasKitDependency(pkg)) {
    return;
  }

  const pm = await detectPackageManager(root);
  const { command, args } = await kitUpdateCommand(root, pm);

  console.log(
    `Updating @folklore/architecture-kit (${pm}, latest matching semver)...`,
  );
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.warn(
      `Warning: could not update @folklore/architecture-kit via ${pm}. Using installed copy.`,
    );
  }
}
