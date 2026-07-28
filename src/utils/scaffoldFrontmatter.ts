/** Frontmatter applied to markdown and Mermaid files created by init/bootstrap scaffold. */
export const SCAFFOLD_STATUS = 'scaffold';

/** Copy-paste prompt for greenfield / brownfield AI documentation fill. */
export const GREENFIELD_AGENT_PROMPT = `Read \`.architecture-kit/agent-context.md\` and explore this codebase.

1. Fill \`architecture.config.json\` (project name, stack, integrations, data sources) from real code — not template defaults.
2. Fill \`docs/architecture/overview.md\`, \`ai-context.md\`, \`project-structure.md\`, and \`integrations.md\` from the repo.
3. Replace **every** generic \`docs/diagrams/*.mmd\` diagram (remove CMS/Analytics placeholders) with diagrams that match this project.
4. Fill remaining scaffold pages: deployment, environments, documentation-map, quality-gates, etc.
5. Remove \`status: scaffold\` frontmatter from **each** \`.md\` and \`.mmd\` file you review.
6. Only then set \`project.documentationStatus\` to \`"active"\` in \`architecture.config.json\`.
7. Run \`npx architecture-kit validate\` and fix all errors.

Do not restore docs from git unless the user asks — generate from the codebase. Link feature specs from documentation-map; do not duplicate ticket content.`;

export function stripFrontmatter(content: string): string {
  if (!content.startsWith('---\n')) {
    return content;
  }
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return content;
  }
  return content.slice(end + 5).replace(/^\n/, '');
}

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
   2. Give .architecture-kit/agent-context.md to your AI agent (prompt in Help page)
   3. Remove "status: scaffold" from each .md and .mmd file when reviewed
   4. Set project.documentationStatus to "active" in architecture.config.json
   5. npx architecture-kit validate
`.trim();

export function renderAgentPromptPre(): string {
  return `<pre class="agent-prompt"><code>${escapeForPre(GREENFIELD_AGENT_PROMPT)}</code></pre>`;
}

export function renderGreenfieldPromptBlock(): string {
  return `<section class="home-section home-section--prompt">
  <h2>AI setup prompt</h2>
  <p class="home-kit-blurb">After <code>scan</code> or <code>bootstrap --apply</code>, give this prompt to Cursor or your agent (sidebar links marked <span class="nav-scaffold-demo">◦ scaffold</span> still need review):</p>
  ${renderAgentPromptPre()}
</section>`;
}

function escapeForPre(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
