import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { emitAgentPack } from '../src/agent/emitAgentPack.js';
import { runInit } from '../src/commands/init.js';
import { buildSite } from '../src/site/buildSite.js';
import {
  getArchitectureContext,
  getArchitecturePage,
  listArchitecturePages,
  readAgentPack,
  searchArchitectureDocs,
} from '../src/mcp/handlers.js';
import { getArchitectureGaps, runArchitectureValidation } from '../src/mcp/gaps.js';

describe('MCP handlers', () => {
  it('getArchitectureContext returns ai-context and agent pack', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-'));
    await runInit({ type: 'generic', cwd, name: 'MCP Demo' });

    const config = JSON.parse(
      await readFile(path.join(cwd, 'architecture.config.json'), 'utf-8'),
    );
    await emitAgentPack({ cwd, config });

    const ctx = await getArchitectureContext(cwd);
    expect(ctx.project?.name).toBe('MCP Demo');
    expect(ctx.aiContext).toContain('AI Context');
    expect(ctx.agentPack?.docs.length).toBeGreaterThan(0);
  });

  it('searchArchitectureDocs finds overview by keyword', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-search-'));
    await runInit({ type: 'generic', cwd, name: 'Search Demo' });

    const config = JSON.parse(
      await readFile(path.join(cwd, 'architecture.config.json'), 'utf-8'),
    );

    await buildSite(cwd, config);

    const results = await searchArchitectureDocs(cwd, 'overview', 5);
    expect(results.some((r) => r.title.toLowerCase().includes('overview'))).toBe(
      true,
    );
  });

  it('getArchitecturePage reads markdown by path', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-page-'));
    await runInit({ type: 'generic', cwd, name: 'Page Demo' });

    const page = await getArchitecturePage(
      cwd,
      'docs/architecture/overview.md',
    );
    expect(page?.path).toContain('overview.md');
    expect(page?.content).toContain('Project Overview');
  });

  it('getArchitectureGaps reports scaffold files on fresh init', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-gaps-'));
    await runInit({ type: 'generic', cwd, name: 'Gaps Demo' });

    const gaps = await getArchitectureGaps(cwd);
    expect(gaps.scaffoldFileCount).toBeGreaterThan(0);
    expect(gaps.warnings.length).toBeGreaterThan(0);
  });

  it('listArchitecturePages returns scaffold docs after init', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-list-'));
    await runInit({ type: 'generic', cwd, name: 'List Demo' });

    const pages = await listArchitecturePages(cwd);
    expect(pages.length).toBeGreaterThan(5);
    expect(pages.some((p) => p.relativePath.includes('overview'))).toBe(true);
    expect(pages.some((p) => p.isScaffold)).toBe(true);
  });

  it('runArchitectureValidation returns structured report for MCP validate tool', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-val-'));
    await runInit({ type: 'generic', cwd, name: 'Validate Demo' });

    const report = await runArchitectureValidation(cwd, { ci: true });
    expect(report.scaffoldFileCount).toBeGreaterThan(0);
    expect(report.passed).toBe(false);
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('readAgentPack returns doc index after emitAgentPack', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-mcp-pack-'));
    await runInit({ type: 'generic', cwd, name: 'Pack Demo' });

    const config = JSON.parse(
      await readFile(path.join(cwd, 'architecture.config.json'), 'utf-8'),
    );
    await emitAgentPack({ cwd, config });

    const pack = await readAgentPack(cwd);
    expect(pack?.project.name).toBe('Pack Demo');
    expect(pack?.entrypoints.aiContext).toContain('ai-context.md');
    expect(pack?.docs.length).toBeGreaterThan(0);
  });
});
