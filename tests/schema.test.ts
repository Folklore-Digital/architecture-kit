import { describe, expect, it } from 'vitest';
import {
  architectureConfigSchema,
  createDefaultConfig,
  SCHEMA_VERSION,
} from '../src/config/schema.js';

describe('architectureConfigSchema', () => {
  it('accepts a valid generic config', () => {
    const config = createDefaultConfig('generic', 'Test Project');
    const result = architectureConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects invalid schema version', () => {
    const config = createDefaultConfig('generic');
    const result = architectureConfigSchema.safeParse({
      ...config,
      schemaVersion: '9.9.9',
    });
    expect(result.success).toBe(false);
  });

  it('creates nextjs defaults with App Router stack', () => {
    const config = createDefaultConfig('nextjs', 'Inspire Web');
    expect(config.schemaVersion).toBe(SCHEMA_VERSION);
    expect(config.project.type).toBe('nextjs');
    expect(config.stack.frontend).toBe('Next.js App Router');
    expect(config.architecture.renderingModel).toContain('server-components');
  });
});
