/**
 * Post-process architecture-kit static output for embedding in a host app.
 * Keeps the kit package generic; mount-path rewriting lives in the project.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readEmbedManifest } from "./lib/read-architecture-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const embed = await readEmbedManifest(root);
const siteDir = path.join(root, embed.outputDir);

function isAbsoluteHref(href) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/|#|mailto:)/i.test(href);
}

/** Kit flattens docs/architecture/* to the site root; drop stale path prefix. */
function normalizeEmbeddedPath(resolved) {
  if (resolved.startsWith("architecture/")) {
    return resolved.slice("architecture/".length);
  }
  if (resolved.startsWith("../")) {
    return resolved.replace(/^(\.\.\/)+/, "");
  }
  return resolved;
}

const SKIP_REWRITE =
  /(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/gi;

function rewriteHrefAttributes(html, fileRelativePath, mountPath) {
  const mount = mountPath.endsWith("/") ? mountPath : `${mountPath}/`;
  const fileDir = path.posix.dirname(fileRelativePath);

  return html.replace(/href="([^"]+)"/gi, (match, href) => {
    if (isAbsoluteHref(href)) {
      return match;
    }
    const joined = path.posix.join(fileDir === "." ? "" : fileDir, href);
    const resolved = normalizeEmbeddedPath(path.posix.normalize(joined));
    return `href="${mount}${resolved}"`;
  });
}

/** Rewrite relative doc links only in HTML markup — not inline script/style. */
function rewriteHtmlLinks(html, fileRelativePath, mountPath) {
  const parts = html.split(SKIP_REWRITE);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) {
        return part;
      }
      return rewriteHrefAttributes(part, fileRelativePath, mountPath);
    })
    .join("");
}

async function walkHtml(dir, baseDir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtml(full, baseDir, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(path.relative(baseDir, full).replace(/\\/g, "/"));
    }
  }
  return files;
}

const htmlFiles = await walkHtml(siteDir, siteDir);
for (const relativePath of htmlFiles) {
  const fullPath = path.join(siteDir, relativePath);
  const html = await readFile(fullPath, "utf-8");
  const rewritten = rewriteHtmlLinks(html, relativePath, embed.mountPath);
  await writeFile(fullPath, rewritten, "utf-8");
}

console.log(
  `Embedded ${htmlFiles.length} pages with mount path ${embed.mountPath}`,
);
