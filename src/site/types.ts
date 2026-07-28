export type DocSection = 'architecture' | 'adr' | 'diagram' | 'other';

export type DocPage = {
  section: DocSection;
  /** Path relative to docs root, e.g. architecture/overview.md */
  relativePath: string;
  /** Absolute path on disk */
  sourcePath: string;
  title: string;
  /** Output path relative to site root, e.g. architecture/overview.html */
  outputPath: string;
  /** ISO date strings for display */
  lastUpdated?: string;
  lastReviewed?: string;
  /** Plain text excerpt for search (markdown only) */
  searchText?: string;
};

export type SearchIndexEntry = {
  title: string;
  path: string;
  section: DocSection;
  excerpt: string;
};

export type BuildSiteOptions = {
  cwd: string;
  outDir: string;
  docsDir: string;
  projectName: string;
};

export type BuildSiteResult = {
  outDir: string;
  pages: DocPage[];
};
