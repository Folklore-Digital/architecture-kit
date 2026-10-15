/** Tool-neutral + optional vendor adapters for AI entrypoints. */

export const AI_ADAPTERS = ['agents', 'cursor', 'claude'] as const;

export type AiAdapter = (typeof AI_ADAPTERS)[number];

/** Default: tool-agnostic AGENTS.md only (no Cursor/Claude files). */
export const DEFAULT_AI_ADAPTERS: AiAdapter[] = ['agents'];

export function parseAiAdapters(
  raw: string | undefined,
  fallback: readonly AiAdapter[] = DEFAULT_AI_ADAPTERS,
): AiAdapter[] {
  if (raw == null || raw.trim() === '') {
    return [...fallback];
  }

  const parts = raw
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const adapters: AiAdapter[] = [];
  for (const part of parts) {
    if (!AI_ADAPTERS.includes(part as AiAdapter)) {
      throw new Error(
        `Invalid AI adapter "${part}". Valid: ${AI_ADAPTERS.join(', ')}`,
      );
    }
    if (!adapters.includes(part as AiAdapter)) {
      adapters.push(part as AiAdapter);
    }
  }

  if (adapters.length === 0) {
    return [...fallback];
  }

  return adapters;
}

export function hasAiAdapter(
  adapters: readonly AiAdapter[] | undefined,
  adapter: AiAdapter,
): boolean {
  const list = adapters?.length ? adapters : DEFAULT_AI_ADAPTERS;
  return list.includes(adapter);
}
