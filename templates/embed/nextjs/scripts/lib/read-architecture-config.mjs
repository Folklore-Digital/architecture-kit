/**
 * Read site embed settings from architecture.config.json (host repo).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEFAULTS = {
  mountPath: "/architecture/",
  outputDir: "public/architecture",
  agentOutput: ".architecture-kit",
};

function normalizeMountPath(mountPath) {
  let normalized = String(mountPath).trim().replace(/\\/g, "/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

/** @param {string} root Host repo root */
export async function readSiteEmbedConfig(root) {
  try {
    const raw = await readFile(
      path.join(root, "architecture.config.json"),
      "utf-8",
    );
    const config = JSON.parse(raw);
    return {
      mountPath: normalizeMountPath(
        config.site?.mountPath ?? DEFAULTS.mountPath,
      ),
      outputDir: config.site?.outputDir ?? DEFAULTS.outputDir,
      agentOutput: config.paths?.agentOutput ?? DEFAULTS.agentOutput,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/** Prefer embed-manifest.json written by kit build when present. */
export async function readEmbedManifest(root) {
  const config = await readSiteEmbedConfig(root);
  const manifestPath = path.join(root, config.agentOutput, "embed-manifest.json");

  try {
    const raw = await readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    return {
      mountPath: normalizeMountPath(manifest.mountPath ?? config.mountPath),
      outputDir: manifest.outputDir ?? config.outputDir,
      agentOutput: manifest.agentOutput ?? config.agentOutput,
    };
  } catch {
    return config;
  }
}
