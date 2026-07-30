import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../src/config/schema.js';
import {
  validateDeployArtifact,
  validateSecretsInDocs,
} from '../src/validators/deploySafety.js';

describe('deploy safety', () => {
  it('validateDeployArtifact errors when forbidden paths exist', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-deploy-artifact-'));
    const artifactDir = path.join(cwd, 'artifact');
    await mkdir(path.join(artifactDir, 'public/architecture'), {
      recursive: true,
    });
    await writeFile(
      path.join(artifactDir, 'public/architecture/index.html'),
      '<html></html>',
      'utf-8',
    );

    const config = createDefaultConfig('nextjs', 'Deploy Test');
    const issues = await validateDeployArtifact(artifactDir, config);

    expect(
      issues.some((issue) => issue.code === 'deploy-artifact-forbidden-paths'),
    ).toBe(true);
    expect(issues[0]?.level).toBe('error');
  });

  it('validateSecretsInDocs flags private key blocks', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-deploy-secrets-'));
    const docDir = path.join(cwd, 'docs/architecture');
    await mkdir(docDir, { recursive: true });
    await writeFile(
      path.join(docDir, 'environments.md'),
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      'utf-8',
    );

    const config = createDefaultConfig('generic', 'Secret Test');
    const issues = await validateSecretsInDocs(cwd, config);

    expect(issues.some((issue) => issue.code === 'doc-possible-secret')).toBe(
      true,
    );
  });
});
