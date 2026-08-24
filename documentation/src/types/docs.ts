export interface DocSection {
  id: string;
  title: string;
  description: string;
  category: string;
  order: number;
  readTime: string;
  headings: DocHeading[];
  content?: string;
}

export interface DocHeading {
  id: string;
  title: string;
  level: number;
}

export interface SearchResultItem {
  id: string;
  sectionId: string;
  title: string;
  category: string;
  excerpt: string;
  url: string;
  keywords?: string[];
}

export interface ReleaseAsset {
  platform: 'windows' | 'macos' | 'linux' | 'source';
  platformName: string;
  arch: string;
  filename: string;
  size: string;
  fileType: string;
  downloadUrl: string;
  checksum?: string;
  isRecommendedFor?: ('win32' | 'darwin' | 'linux')[];
  icon: string;
}

export interface ReleaseVersion {
  version: string;
  isLatest: boolean;
  releaseDate: string;
  tag: string;
  githubUrl: string;
  summary: string;
  highlights: string[];
  whatsNew: string[];
  improvements: string[];
  bugFixes: string[];
  knownIssues: string[];
  assets: ReleaseAsset[];
}

export interface PlatformSpec {
  os: 'windows' | 'macos' | 'linux';
  name: string;
  supportedVersions: string;
  arch: string[];
  compiler: string;
  packageType: string;
  installerFile: string;
  installCommand?: string;
  downloadUrl: string;
}
