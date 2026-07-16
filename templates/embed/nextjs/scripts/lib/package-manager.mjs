import { access, readFile } from "node:fs/promises";
import path from "node:path";

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isYarnBerry(cwd) {
  if (await exists(path.join(cwd, ".yarn", "releases"))) {
    return true;
  }
  const pkgPath = path.join(cwd, "package.json");
  if (await exists(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    return /^yarn@[2-9]/u.test(pkg.packageManager ?? "");
  }
  return false;
}

/** Detect host repo package manager from lockfiles / packageManager field. */
export async function detectPackageManager(cwd) {
  const pkgPath = path.join(cwd, "package.json");
  if (await exists(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    const field = pkg.packageManager;
    if (field?.startsWith("yarn")) return "yarn";
    if (field?.startsWith("pnpm")) return "pnpm";
    if (field?.startsWith("npm")) return "npm";
  }

  if (await exists(path.join(cwd, "yarn.lock"))) return "yarn";
  if (await exists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(path.join(cwd, "package-lock.json"))) return "npm";

  return "npm";
}

export async function kitUpdateCommand(cwd, pm) {
  switch (pm) {
    case "yarn":
      if (await isYarnBerry(cwd)) {
        return {
          command: "yarn",
          args: ["up", "@folklore/architecture-kit"],
        };
      }
      return {
        command: "yarn",
        args: ["upgrade", "@folklore/architecture-kit", "--latest"],
      };
    case "pnpm":
      return {
        command: "pnpm",
        args: ["update", "@folklore/architecture-kit"],
      };
    default:
      return {
        command: "npm",
        args: ["update", "@folklore/architecture-kit"],
      };
  }
}

export async function detectKitPackageManager(kitRoot) {
  if (await exists(path.join(kitRoot, "yarn.lock"))) return "yarn";
  if (await exists(path.join(kitRoot, "pnpm-lock.yaml"))) return "pnpm";
  return "npm";
}

export async function kitInstallInKitRoot(kitRoot) {
  const pm = await detectKitPackageManager(kitRoot);
  switch (pm) {
    case "yarn":
      return { command: "yarn", args: ["install"] };
    case "pnpm":
      return { command: "pnpm", args: ["install"] };
    default:
      if (await exists(path.join(kitRoot, "package-lock.json"))) {
        return { command: "npm", args: ["ci"] };
      }
      return { command: "npm", args: ["install"] };
  }
}

export async function kitRunBuildInKitRoot(kitRoot) {
  const pm = await detectKitPackageManager(kitRoot);
  switch (pm) {
    case "yarn":
      return { command: "yarn", args: ["build"] };
    case "pnpm":
      return { command: "pnpm", args: ["run", "build"] };
    default:
      return { command: "npm", args: ["run", "build"] };
  }
}
