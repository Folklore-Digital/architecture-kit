import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// scripts/lib → repo root (two levels up)
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const vendorKit = {
  root: path.join(root, "vendor/architecture-kit"),
  label: "vendor/architecture-kit (submodule)",
};

const siblingKit = {
  root: path.resolve(root, "../architecture-kit"),
  label: "../architecture-kit (sibling clone)",
};

const installedKit = {
  root: path.join(root, "node_modules/@folklore/architecture-kit"),
  label: "node_modules (npm install)",
};

/** Local kit dev: sibling/vendor first. CI/server: installed package first. */
function kitSearchOrder() {
  if (process.env.ARCHITECTURE_KIT_LOCAL === "1") {
    return [vendorKit, siblingKit, installedKit];
  }
  return [installedKit, vendorKit, siblingKit];
}

export const kitSearchRoots = [vendorKit, siblingKit, installedKit];

export async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function findKitRoot() {
  for (const candidate of kitSearchOrder()) {
    if (await pathExists(path.join(candidate.root, "package.json"))) {
      return candidate;
    }
  }
  return null;
}

export async function findKitCli() {
  for (const candidate of kitSearchOrder()) {
    const cli = path.join(candidate.root, "dist/cli.js");
    if (await pathExists(cli)) {
      return { ...candidate, cli };
    }
  }
  return null;
}

export function isInstalledKitPackage(kitRoot) {
  return kitRoot?.label.includes("node_modules") ?? false;
}

export function printKitSetupHelp() {
  console.error("");
  console.error("@folklore/architecture-kit is not available.");
  console.error("");
  console.error("Install the version pinned in package.json:");
  console.error("");
  console.error("  npm install   # or: yarn install / pnpm install");
  console.error("  npm run build-dev   # or: yarn build-dev");
  console.error("");
  console.error(
    "The dependency uses git semver tags — bump the kit version and tag",
  );
  console.error(
    "vX.Y.Z in the architecture-kit repo; host repos pick it up on build.",
  );
  console.error("");
  console.error("Local kit development (two repos side by side):");
  console.error("");
  console.error("  export ARCHITECTURE_KIT_LOCAL=1");
  console.error("  yarn dev   # or: npm run dev");
  console.error("");
}
