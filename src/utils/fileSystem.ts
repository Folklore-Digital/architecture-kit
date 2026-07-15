import { access, appendFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDefaultConfig,
  type ProjectType,
} from '../config/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '../..');

export async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8');
}

export function getTemplatesDir(): string {
  return path.join(PACKAGE_ROOT, 'templates');
}

export function getTemplateDir(type: ProjectType): string {
  return path.join(getTemplatesDir(), type);
}

export async function copyTemplate(
  type: ProjectType,
  targetDir: string,
): Promise<void> {
  const source = getTemplateDir(type);
  if (!(await pathExists(source))) {
    throw new Error(`Template "${type}" not found at ${source}`);
  }

  await cp(source, targetDir, { recursive: true, force: false });
}

export async function resolveProjectName(cwd: string): Promise<string> {
  try {
    const pkgRaw = await readFile(path.join(cwd, 'package.json'), 'utf-8');
    const pkg = JSON.parse(pkgRaw) as { name?: string };
    if (pkg.name) {
      return pkg.name.replace(/^@[^/]+\//, '').replace(/-/g, ' ');
    }
  } catch {
    // ignore
  }

  return path.basename(cwd);
}

export async function scaffoldProject(
  cwd: string,
  type: ProjectType,
  projectName?: string,
): Promise<string[]> {
  const created: string[] = [];
  const name = projectName ?? (await resolveProjectName(cwd));
  const docsDir = path.join(cwd, 'docs');
  const configPath = path.join(cwd, 'architecture.config.json');

  if (await pathExists(docsDir)) {
    throw new Error(
      'docs/ already exists. Remove it or run init in a fresh directory.',
    );
  }

  if (await pathExists(configPath)) {
    throw new Error(
      'architecture.config.json already exists. Remove it before re-initializing.',
    );
  }

  await copyTemplate(type, docsDir);
  created.push('docs/');

  const config = createDefaultConfig(type, name);
  await writeJson(configPath, config);
  created.push('architecture.config.json');

  const cursorRuleSource = path.join(getTemplatesDir(), 'cursor/architecture-kit.mdc');
  const cursorRuleTarget = path.join(cwd, '.cursor/rules/architecture-kit.mdc');
  if (await pathExists(cursorRuleSource)) {
    await ensureDir(path.dirname(cursorRuleTarget));
    const cursorTemplate = await readFile(cursorRuleSource, 'utf-8');
    const cursorRule = cursorTemplate.replaceAll('{{projectName}}', name);
    await writeFile(cursorRuleTarget, cursorRule, 'utf-8');
    created.push('.cursor/rules/architecture-kit.mdc');
  }

  const agentsSnippetSource = path.join(getTemplatesDir(), 'AGENTS.snippet.md');
  const agentsPath = path.join(cwd, 'AGENTS.md');
  if (await pathExists(agentsSnippetSource)) {
    const snippet = await readFile(agentsSnippetSource, 'utf-8');
    if (await pathExists(agentsPath)) {
      const existing = await readFile(agentsPath, 'utf-8');
      if (!existing.includes('architecture-kit')) {
        await appendFile(agentsPath, `\n${snippet}`, 'utf-8');
        created.push('AGENTS.md (appended architecture section)');
      }
    } else {
      await writeFile(agentsPath, `${snippet.trim()}\n`, 'utf-8');
      created.push('AGENTS.md');
    }
  }

  return created;
}

export function integrationMentioned(
  integrationsMarkdown: string,
  integrationName: string,
): boolean {
  const pattern = new RegExp(
    integrationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'i',
  );
  return pattern.test(integrationsMarkdown);
}
