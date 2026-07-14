import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectType } from '../config/schema.js';
import { pathExists } from '../utils/fileSystem.js';

export type DetectionSignal = {
  label: string;
  weight: number;
};

export type DetectionResult = {
  suggested: ProjectType;
  confidence: 'high' | 'medium' | 'low';
  signals: DetectionSignal[];
  scores: Record<ProjectType, number>;
};

async function readJsonFile(filePath: string): Promise<unknown | null> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function depNames(pkg: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const section = pkg[key];
    if (section && typeof section === 'object') {
      for (const name of Object.keys(section as Record<string, unknown>)) {
        names.add(name);
      }
    }
  }
  return names;
}

function addScore(
  scores: Record<ProjectType, number>,
  type: ProjectType,
  weight: number,
  signals: DetectionSignal[],
  label: string,
): void {
  scores[type] += weight;
  signals.push({ label, weight });
}

export async function detectProjectType(
  cwd: string,
): Promise<DetectionResult> {
  const scores: Record<ProjectType, number> = {
    nextjs: 0,
    'wordpress-custom': 0,
    'wordpress-builder': 0,
    craft: 0,
    generic: 0,
  };
  const signals: DetectionSignal[] = [];

  const pkgPath = path.join(cwd, 'package.json');
  const pkg = (await readJsonFile(pkgPath)) as Record<string, unknown> | null;
  const deps = pkg ? depNames(pkg) : new Set<string>();

  if (deps.has('next')) {
    addScore(scores, 'nextjs', 10, signals, 'package.json depends on "next"');
  }
  if (deps.has('phaser') || deps.has('react')) {
    addScore(scores, 'nextjs', 1, signals, 'React/game stack often pairs with Next.js shell');
  }

  const composerPath = path.join(cwd, 'composer.json');
  const composer = (await readJsonFile(composerPath)) as Record<string, unknown> | null;
  if (composer) {
    const require = composer.require;
    if (require && typeof require === 'object') {
      const req = require as Record<string, string>;
      if (req['craftcms/cms']) {
        addScore(scores, 'craft', 10, signals, 'composer.json requires craftcms/cms');
      }
      if (req['roots/wordpress'] || req['johnpbloch/wordpress']) {
        addScore(
          scores,
          'wordpress-custom',
          6,
          signals,
          'composer.json includes WordPress via Composer',
        );
      }
    }
  }

  const wpContent = path.join(cwd, 'wp-content');
  if (await pathExists(wpContent)) {
    addScore(scores, 'wordpress-custom', 8, signals, 'wp-content/ directory present');
  }

  const builderMarkers = [
    'wp-content/plugins/elementor',
    'wp-content/plugins/divi-builder',
  ];
  for (const marker of builderMarkers) {
    if (await pathExists(path.join(cwd, marker))) {
      addScore(
        scores,
        'wordpress-builder',
        8,
        signals,
        `${marker} suggests a page-builder workflow`,
      );
    }
  }

  const sageMarkers = ['resources/views', 'app/setup.php', 'composer.json'];
  const hasSageLayout =
    (await pathExists(path.join(cwd, 'resources/views'))) &&
    (await pathExists(path.join(cwd, 'composer.json')));
  if (hasSageLayout && (await pathExists(wpContent))) {
    addScore(
      scores,
      'wordpress-custom',
      4,
      signals,
      'Sage-like theme layout (resources/views + wp-content)',
    );
  }

  try {
    const entries = await readdir(cwd);
    if (entries.some((name) => name.endsWith('.twig'))) {
      addScore(scores, 'craft', 2, signals, 'Twig templates in project root');
    }
  } catch {
    // ignore
  }

  const templatesDir = path.join(cwd, 'templates');
  if (await pathExists(templatesDir)) {
    addScore(scores, 'craft', 2, signals, 'templates/ directory (common in Craft)');
  }

  const ranked = (Object.entries(scores) as [ProjectType, number][])
    .sort((a, b) => b[1] - a[1]);

  const topScore = ranked[0]?.[1] ?? 0;
  const secondScore = ranked[1]?.[1] ?? 0;

  let suggested: ProjectType = 'generic';
  let confidence: DetectionResult['confidence'] = 'low';

  if (topScore === 0) {
    suggested = 'generic';
    signals.push({ label: 'No strong signals; defaulting to generic', weight: 0 });
  } else {
    suggested = ranked[0][0];
    if (topScore >= 8 && topScore - secondScore >= 4) {
      confidence = 'high';
    } else if (topScore >= 4) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
  }

  return { suggested, confidence, signals, scores };
}
