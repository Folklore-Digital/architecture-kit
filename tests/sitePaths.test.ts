import { describe, expect, it } from 'vitest';
import {
  buildEmbedManifest,
  normalizeMountPath,
  resolveAgentOutputDir,
  resolveSiteMountPath,
  resolveSiteOutputDir,
} from '../src/config/sitePaths.js';
import { createDefaultConfig } from '../src/config/schema.js';

describe('sitePaths', () => {
  it('normalizes mount path with leading and trailing slashes', () => {
    expect(normalizeMountPath('architecture')).toBe('/architecture/');
    expect(normalizeMountPath('/internal/docs/')).toBe('/internal/docs/');
  });

  it('uses defaults when site and paths are unset', () => {
    const config = createDefaultConfig('nextjs', 'Demo');
    expect(resolveSiteMountPath(config)).toBe('/architecture/');
    expect(resolveSiteOutputDir(config)).toBe('public/architecture');
    expect(resolveAgentOutputDir(config)).toBe('.architecture-kit');
  });

  it('reads custom site and agent output from config', () => {
    const config = createDefaultConfig('generic', 'Demo');
    config.site = {
      showDates: true,
      dateSource: 'git',
      mountPath: '/docs/system/',
      outputDir: 'static/architecture',
    };
    config.paths.agentOutput = '.cache/architecture-kit';

    expect(resolveSiteMountPath(config)).toBe('/docs/system/');
    expect(resolveSiteOutputDir(config)).toBe('static/architecture');
    expect(resolveAgentOutputDir(config)).toBe('.cache/architecture-kit');

    const manifest = buildEmbedManifest(config, '0.5.5');
    expect(manifest.mountPath).toBe('/docs/system/');
    expect(manifest.outputDir).toBe('static/architecture');
  });
});
