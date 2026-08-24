import { ReleaseVersion } from '../types/docs';
import { CURRENT_VERSION, DOWNLOAD_ASSETS, GITHUB_REPO_URL } from './downloadsData';

export const RELEASES: ReleaseVersion[] = [
  {
    version: '1.0.0',
    tag: 'v1.0.0',
    isLatest: true,
    releaseDate: 'August 2026',
    githubUrl: `${GITHUB_REPO_URL}/releases/tag/v1.0.0`,
    summary: 'The inaugural major release of CppBook — a full-featured, local-first C++ interactive notebook IDE for Windows, macOS, and Linux.',
    highlights: [
      'Interactive C++ notebook interface with Monaco Editor and syntax intelligence',
      'Compile-and-replay execution model preserving persistent notebook state across cells',
      'Seamless multi-platform packaging (Windows NSIS .exe, macOS ARM64/x64 .dmg, Linux AppImage)',
      'Automated local backend lifecycle management in standalone Electron application',
      'Automatic C++ compiler detection (GCC, Clang, MSVC) with diagnostic parsing',
      'Native .cppnb JSON notebook format with full import/export support for .cpp files',
    ],
    whatsNew: [
      'Interactive Monaco Editor with full C++ highlighting, bracket matching, code folding, and minimap toggle',
      'Dual cell support: executable C++ code cells and rendered Markdown documentation cells',
      'Real-time execution feedback: stdout, stderr, exit codes, execution timing, and compiler warnings',
      'Compile-and-replay persistence engine allowing variables and functions to persist across subsequent cells',
      'Smart user main() rewriting to allow standard `int main()` code in notebook cells without symbol collisions',
      'Interactive terminal streaming over WebSocket for interactive stdin/stdout programs',
      'Automated compiler detection utility and helper scripts for Windows MinGW, macOS Xcode, and Linux GCC',
      'Project file tree sidebar for browsing local workspace files and example notebooks',
      'Multi-theme visual engine (Midnight, Obsidian, Graphite, Matrix, Daylight)',
      'Extensible AI assistant panel interface with local key configuration',
    ],
    improvements: [
      'Optimized PyInstaller backend bundling for sub-second startup times in desktop mode',
      'FastAPI async routing with non-blocking subprocess execution and timeout protection',
      'Precise compiler diagnostic line-mapping back to specific notebook cells',
      'Deduplicated `#include` and `using namespace` directives during temporary translation unit synthesis',
      'Added graceful subprocess tree termination preventing orphaned worker processes',
      'Enhanced keyboard shortcut engine with customizable keybindings (Shift+Enter, Ctrl+Enter, Ctrl+S, Ctrl+K)',
    ],
    bugFixes: [
      'Fixed symbol redefinition error when declaring identical function prototypes across separate cells',
      'Resolved path space handling in Windows MinGW GCC compiler invocation',
      'Fixed Electron desktop port collision by dynamically scanning and reserving available local ports',
      'Corrected ANSI color code escape sequence rendering in compiler error output panel',
      'Fixed autosave race condition during active cell execution',
    ],
    knownIssues: [
      'macOS builds are currently unsigned; users need to allow app launch via System Settings > Security & Privacy or `xattr -cr`',
      'Interactive stdin streaming requires active WebSocket connection and is limited to one concurrent interactive session',
    ],
    assets: DOWNLOAD_ASSETS,
  },
  {
    version: '0.9.0-beta',
    tag: 'v0.9.0-beta',
    isLatest: false,
    releaseDate: 'July 2026',
    githubUrl: `${GITHUB_REPO_URL}/releases/tag/v0.9.0-beta`,
    summary: 'Public beta milestone featuring the compile-and-replay execution model, Electron shell integration, and initial `.cppnb` specification.',
    highlights: [
      'Initial release of FastAPI C++ compilation engine',
      'Basic Monaco editor integration with code execution',
      'Initial support for `.cppnb` notebook files',
      'Cross-platform desktop runner prototype',
    ],
    whatsNew: [
      'Introduced compile-and-replay parser for multi-cell execution',
      'Added cell status indicators (idle, running, success, error, stopped)',
      'Basic export to `.cpp` source files',
    ],
    improvements: [
      'Reduced memory footprint of temporary code synthesis directory',
      'Added execution timeout safeguard (default 30 seconds)',
    ],
    bugFixes: [
      'Fixed crash when running empty code cells',
      'Fixed file descriptor leak on Linux kernel restart',
    ],
    knownIssues: [
      'No interactive stdin support (addressed in v1.0.0)',
      'Limited compiler warning diagnostics',
    ],
    assets: [],
  }
];
