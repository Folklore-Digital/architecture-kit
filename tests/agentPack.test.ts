import { mkdtemp, readFile, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { emitAgentPack } from '../src/agent/emitAgentPack.js';
import { writeAgentPack, AGENT_PACK_SCHEMA } from '../src/agent/writeAgentPack.js';
import { createDefaultConfig } from '../src/config/schema.js';
import { runInit } from '../src/commands/init.js';
import { buildSite } from '../src/site/buildSite.js';

describe('agent pack', () => {
  it('writes agent-pack.json and prompt files on emit', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-pack-'));
    const config = createDefaultConfig('nextjs', 'Demo');

    const packPath = await emitAgentPack({ cwd, config });

    expect(packPath).toContain('agent-pack.json');
    await access(path.join(cwd, '.architecture-kit/prompts/greenfield.md'));
    await access(path.join(cwd, '.architecture-kit/prompts/brownfield-doc-update.md'));

    const raw = await readFile(packPath, 'utf-8');
    const pack = JSON.parse(raw) as {
      schemaVersion: string;
      kitVersion: string;
      project: { name: string };
      prompts: { greenfield: string };
    };

    expect(pack.schemaVersion).toBe(AGENT_PACK_SCHEMA);
    expect(pack.project.name).toBe('Demo');
    expect(pack.prompts.greenfield).toContain('prompts/greenfield.md');
  });

  it('includes search index copy on build', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-pack-build-'));
    await runInit({ type: 'generic', cwd, name: 'Pack Test' });

    const config = JSON.parse(
      await readFile(path.join(cwd, 'architecture.config.json'), 'utf-8'),
    );

    const result = await buildSite(cwd, config);
    expect(result.agentPackPath).toBeTruthy();

    await access(path.join(cwd, '.architecture-kit/search-index.json'));

    const pack = JSON.parse(
      await readFile(result.agentPackPath!, 'utf-8'),
    ) as { searchIndexPath?: string; docs: unknown[] };

    expect(pack.searchIndexPath).toBe('.architecture-kit/search-index.json');
    expect(pack.docs.length).toBeGreaterThan(0);
  });

  it('writeAgentPack works without config using scan fallback', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-pack-scan-'));
    const packPath = await writeAgentPack({
      cwd,
      config: null,
      kitVersion: '0.5.2',
      scan: {
        scannedAt: new Date().toISOString(),
        projectName: 'orphan',
        suggestedType: 'generic',
        detectionConfidence: 'low',
        detectionSignals: [],
        findings: [],
        existingDocs: {
          hasConfig: false,
          hasArchitectureDocs: false,
          architectureDocCount: 0,
          adrCount: 0,
          diagramCount: 0,
          missingRecommended: [],
        },
        suggestedIntegrations: [],
        envVarKeys: [],
        storybookDetected: false,
      },
    });

    const pack = JSON.parse(await readFile(packPath, 'utf-8')) as {
      project: { name: string };
      scan?: { suggestedType: string };
    };
    expect(pack.project.name).toBe('orphan');
    expect(pack.scan?.suggestedType).toBe('generic');
  });
});
