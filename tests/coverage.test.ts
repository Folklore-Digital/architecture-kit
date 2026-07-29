import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCoverageReport } from '../src/coverage/buildCoverageReport.js';
import { runInit } from '../src/commands/init.js';

describe('coverage report', () => {
  it('buildCoverageReport groups scaffold issues on fresh init', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'arch-kit-coverage-'));
    await runInit({ type: 'generic', cwd, name: 'Coverage Demo' });

    const report = await buildCoverageReport(cwd);

    expect(report.schemaVersion).toBe('1.0.0');
    expect(report.project.name).toBe('Coverage Demo');
    expect(report.summary.scaffoldFileCount).toBeGreaterThan(0);
    expect(
      report.categories.scaffold.errors + report.categories.scaffold.warnings,
    ).toBeGreaterThan(0);
  });
});
