/** Frontmatter applied to markdown files created by init/bootstrap scaffold. */
export const SCAFFOLD_STATUS = 'scaffold';

export function wrapScaffoldFrontmatter(
  content: string,
  kitVersion: string,
): string {
  if (content.startsWith('---\n')) {
    return content;
  }
  return `---\nstatus: ${SCAFFOLD_STATUS}\nscaffoldVersion: "${kitVersion}"\n---\n\n${content}`;
}

export function hasScaffoldFrontmatter(content: string): boolean {
  if (!content.startsWith('---\n')) {
    return false;
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return false;
  }
  const fm = content.slice(4, end);
  return /^status:\s*scaffold\s*$/im.test(fm);
}

export const SCAFFOLD_NEXT_STEPS = `
⚠️  SCAFFOLD MODE — documentation is generic template content, not project-specific.
   Wrong or misleading until you customize it.

   Recommended next steps:
   1. npx architecture-kit scan
   2. Give .architecture-kit/agent-context.md to your AI agent (or fill docs manually)
   3. Remove "status: scaffold" from each doc frontmatter when reviewed
   4. Set project.documentationStatus to "active" in architecture.config.json
   5. npx architecture-kit validate
`.trim();
