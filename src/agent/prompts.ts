/** When to update architecture docs after code changes (brownfield / ongoing work). */
export const BROWNFIELD_DOC_UPDATE_PROMPT = `When changing this codebase, keep architecture docs in sync:

- New or changed integrations / dependencies → \`docs/architecture/integrations.md\` (+ ADR if \`governance.newIntegrationRequiresAdr\`)
- Environment variables → \`docs/architecture/environments.md\`
- Deployment, hosting, or build scripts → \`deployment.md\`, \`scripts-and-load-order.md\`
- Folder structure or module boundaries → \`project-structure.md\`, \`ai-context.md\`
- Rendering or data-fetching patterns → \`rendering-model.md\`, \`data-fetching.md\`, \`server-vs-client.md\`
- System shape changes → update \`docs/diagrams/*.mmd\` and link from overview / documentation-map

After doc edits: \`npx architecture-kit validate\` (use \`--ci\` before merge).
Do not duplicate ticket/feature specs in architecture docs — link from \`documentation-map.md\`.`;
