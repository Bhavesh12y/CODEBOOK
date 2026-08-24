import React from 'react';
import { DocSection } from '../types/docs';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Callout } from '../components/ui/Callout';
import { PlatformTabs } from '../components/ui/PlatformTabs';
import { ArchitectureDiagram, ExecutionFlowDiagram, PersistentStateDiagram } from '../components/ui/Diagrams';
import { MacOSInstallInstructions } from '../components/ui/MacOSInstallInstructions';
import { Check, ArrowRight } from 'lucide-react';

interface DocPageProps {
  section: DocSection;
  onNavigateSection: (id: string) => void;
  onNavigateRoute: (route: string) => void;
}

export const DocPage: React.FC<DocPageProps> = ({
  section,
  onNavigateSection,
  onNavigateRoute,
}) => {
  switch (section.id) {
    case 'overview':
      return (
        <div className="space-y-12 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="welcome" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Introduction
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>CppBook</strong> is an interactive, Jupyter-like notebook integrated development environment designed specifically for modern C++. It pairs a responsive React frontend with Monaco Editor and a local FastAPI backend, enabling you to write, compile, and execute C++ code interactively with persistent multi-cell execution state.
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              CppBook runs <strong>100% locally</strong> on your workstation using your native C++ compiler (GCC, Clang, or MSVC) without any cloud dependencies or telemetry.
            </p>

            <Callout type="architecture" title="Local-First Architectural Guarantee">
              CppBook performs all code parsing, compilation, and execution locally on your workstation via direct OS subprocesses. No proprietary cloud backends or user accounts are required.
            </Callout>
          </section>

          <section id="quick-links" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Documentation Index
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div
                onClick={() => onNavigateSection('get-started')}
                className="doc-card rounded-2xl p-6 cursor-pointer space-y-2"
              >
                <div className="text-base font-bold text-slate-950 dark:text-white flex items-center justify-between">
                  <span>Getting Started</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Step-by-step guide to installing and executing your first C++ notebook cell.
                </p>
              </div>

              <div
                onClick={() => onNavigateSection('user-guide')}
                className="doc-card rounded-2xl p-6 cursor-pointer space-y-2"
              >
                <div className="text-base font-bold text-slate-950 dark:text-white flex items-center justify-between">
                  <span>User Guide</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Learn about cells, shortcuts, persistence, and file imports.
                </p>
              </div>

              <div
                onClick={() => onNavigateSection('features')}
                className="doc-card rounded-2xl p-6 cursor-pointer space-y-2"
              >
                <div className="text-base font-bold text-slate-950 dark:text-white flex items-center justify-between">
                  <span>Features Deep Dive</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Detailed specifications of all built-in capabilities and compiler controls.
                </p>
              </div>

              <div
                onClick={() => onNavigateSection('architecture')}
                className="doc-card rounded-2xl p-6 cursor-pointer space-y-2"
              >
                <div className="text-base font-bold text-slate-950 dark:text-white flex items-center justify-between">
                  <span>Architecture &amp; Engine</span>
                  <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Technical deep-dive on AST classification and compile-and-replay.
                </p>
              </div>
            </div>
          </section>

          <section id="how-cppbook-works-brief" className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              How CppBook Works
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              C++ is a static, compiled language without a native dynamic interpreter. CppBook achieves an interactive notebook experience through an automated <strong>compile-and-replay architecture</strong>:
            </p>
            <ol className="list-decimal pl-6 space-y-2.5 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
              <li>When you execute a cell, CppBook aggregates all preceding code cells in the notebook.</li>
              <li>An AST chunk classifier separates includes, namespaces, global structs/classes, functions, and executable statements.</li>
              <li>A temporary unified translation unit (<code>main.cpp</code>) is synthesized with automatic deduplication.</li>
              <li>Your system C++ compiler is invoked in a non-blocking background process.</li>
              <li>Prior cells are replayed silently to establish in-memory state; stdout and stderr from the active cell are captured and streamed directly to your notebook window.</li>
            </ol>

            <ArchitectureDiagram />
          </section>
        </div>
      );

    case 'get-started':
      return (
        <div className="space-y-12 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="system-requirements" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              System Requirements
            </h2>
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left text-sm border-collapse rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#141722] border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono text-xs">
                    <th className="py-3.5 px-5 font-bold">Component</th>
                    <th className="py-3.5 px-5 font-bold">Standalone Desktop App</th>
                    <th className="py-3.5 px-5 font-bold">Source Development</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0f1118]">
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Operating System</td>
                    <td className="py-3.5 px-5">Windows 10/11 (64-bit), macOS 12+, Linux (x64)</td>
                    <td className="py-3.5 px-5">Same</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Node.js</td>
                    <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Bundled (Not Required)</td>
                    <td className="py-3.5 px-5 font-mono">v20.0+</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Python</td>
                    <td className="py-3.5 px-5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Bundled (Not Required)</td>
                    <td className="py-3.5 px-5 font-mono">v3.11+</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">C++ Compiler</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900 dark:text-slate-100">g++, clang++, or MSVC on PATH</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-900 dark:text-slate-100">Same</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="installation-steps" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Installation by Platform
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Select your operating system below for step-by-step setup instructions:
            </p>

            <PlatformTabs
              windowsContent={
                <div className="space-y-4 text-sm">
                  <p className="text-slate-950 dark:text-white font-bold">1. Download the Windows Installer:</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Download <code className="font-semibold text-slate-900 dark:text-slate-200">CppBook.Setup.1.0.0.exe</code> from the <button type="button" onClick={() => onNavigateRoute('/downloads')} className="text-slate-900 dark:text-white underline font-bold">Downloads page</button>.
                  </p>
                  <p className="text-slate-950 dark:text-white font-bold pt-2">2. Run Setup Wizard:</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Execute the installer to install CppBook into your user applications directory.
                  </p>
                  <p className="text-slate-950 dark:text-white font-bold pt-2">3. Verify MinGW-w64 GCC:</p>
                  <CodeBlock
                    language="powershell"
                    filename="PowerShell"
                    code={`# Check if g++ is already on PATH\ng++ --version\n\n# Or install MSYS2 via winget if missing\nwinget install -e --id MSYS2.MSYS2\n\n# In MSYS2 UCRT64 terminal, run:\npacman -S --needed mingw-w64-ucrt-x86_64-gcc\n\n# Add C:\\msys64\\ucrt64\\bin to system PATH`}
                  />
                </div>
              }
              macContent={
                <div className="space-y-4 text-sm">
                  <p className="text-slate-950 dark:text-white font-bold">1. Download the Apple Disk Image (.dmg):</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Choose <strong>Apple Silicon (ARM64)</strong> for M1/M2/M3/M4 or <strong>Intel (x64)</strong>.
                  </p>
                  <p className="text-slate-950 dark:text-white font-bold pt-2">2. Install to Applications:</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Mount the <code className="font-semibold text-slate-900 dark:text-slate-200">.dmg</code> and drag CppBook to your Applications folder.
                  </p>
                  <p className="text-slate-950 dark:text-white font-bold pt-2">3. Install Apple Clang:</p>
                  <CodeBlock
                    language="bash"
                    filename="Terminal"
                    code={`# Install Command Line Tools\nxcode-select --install\n\n# Verify clang++\nclang++ --version`}
                  />
                  <Callout type="note" title="macOS Gatekeeper">
                    If prompted on initial launch, allow the binary in <em>System Settings &gt; Privacy &amp; Security</em> or run: <code>xattr -cr /Applications/CppBook.app</code>.
                  </Callout>
                </div>
              }
              linuxContent={
                <div className="space-y-4 text-sm">
                  <p className="text-slate-950 dark:text-white font-bold">1. Download AppImage:</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Download <code className="font-semibold text-slate-900 dark:text-slate-200">CppBook-1.0.0.AppImage</code>.
                  </p>
                  <p className="text-slate-950 dark:text-white font-bold pt-2">2. Grant Execution Permission &amp; Run:</p>
                  <CodeBlock
                    language="bash"
                    filename="Terminal"
                    code={`chmod +x CppBook-1.0.0.AppImage\n./CppBook-1.0.0.AppImage`}
                  />
                  <p className="text-slate-950 dark:text-white font-bold pt-2">3. Ensure GCC is installed:</p>
                  <CodeBlock
                    language="bash"
                    filename="Terminal"
                    code={`# Ubuntu / Debian\nsudo apt update && sudo apt install -y g++ build-essential\n\n# Fedora\nsudo dnf install -y gcc-c++\n\n# Arch\nsudo pacman -S gcc`}
                  />
                </div>
              }
            />
          </section>

          <section id="first-launch" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              First Launch &amp; Notebook Creation
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Upon launching CppBook, the desktop application initializes the local FastAPI server in the background and presents the Home Dashboard.
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
              <li>Click <strong>New Notebook</strong> on the Home dashboard.</li>
              <li>Provide a title, e.g. <code>First Notebook</code>.</li>
              <li>Click <strong>Create</strong> to open the notebook workspace.</li>
            </ol>
          </section>

          <section id="write-first-cell" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Write &amp; Execute Your First Cell
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Enter the following code in the initial editor cell:
            </p>
            <CodeBlock
              language="cpp"
              filename="Cell 1"
              showLineNumbers
              code={`#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Welcome to CppBook!" << endl;\n    cout << "C++ Standard: " << __cplusplus << endl;\n    return 0;\n}`}
            />
            <p className="text-slate-700 dark:text-slate-300">
              Press <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono text-xs border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-200 font-semibold">Shift + Enter</kbd> to compile and execute the cell.
            </p>
          </section>

          <section id="expected-result" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Expected Output
            </h2>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-[#03050a] p-5 text-xs font-mono shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 text-slate-700 dark:text-slate-400">
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold text-sm">
                  <Check className="w-4 h-4" /> status: success &middot; exit code: 0
                </span>
                <span>elapsed: 0.042s</span>
              </div>
              <div className="pt-3 text-slate-900 dark:text-slate-200 space-y-1 text-xs sm:text-sm font-semibold">
                <div>Welcome to CppBook!</div>
                <div>C++ Standard: 201703</div>
              </div>
            </div>
          </section>
        </div>
      );

    case 'installation':
      return (
        <div className="space-y-12 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="desktop-installer" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Desktop Installer
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              The standalone installer creates a self-contained application bundle containing the Electron runtime and pre-compiled Python backend.
            </p>
          </section>

          <section id="macos-setup" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              macOS Installation &amp; Gatekeeper Instructions
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              On macOS, drag CppBook to your <code>/Applications</code> folder. If macOS blocks the unsigned binary or shows &ldquo;CppBook is damaged&rdquo;, use either of these two terminal commands:
            </p>
            <MacOSInstallInstructions />
          </section>

          <section id="windows-setup" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Windows Compiler Configuration (MinGW / GCC)
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              CppBook detects <code>g++.exe</code> on PATH. You can verify your environment with the included detection tool:
            </p>
            <CodeBlock
              language="powershell"
              filename="PowerShell"
              code={`# Check compiler\npowershell -ExecutionPolicy Bypass -File tools\\check-compiler.ps1\n\n# Or install MSYS2\npowershell -ExecutionPolicy Bypass -File tools\\check-compiler.ps1 -Install`}
            />
          </section>

          <section id="compiler-verification" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Verifying Compiler Detection Endpoint
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Query the local backend compiler endpoint:
            </p>
            <CodeBlock
              language="bash"
              filename="cURL"
              code={`curl http://127.0.0.1:8000/api/compiler`}
            />
            <CodeBlock
              language="json"
              filename="Response"
              code={`{\n  "available": true,\n  "compiler": "GCC",\n  "path": "C:\\\\msys64\\\\ucrt64\\\\bin\\\\g++.exe",\n  "version": "g++ (Rev1, Built by MSYS2 project) 14.2.0",\n  "error": null\n}`}
            />
          </section>

          <section id="custom-compiler-override" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Custom Compiler Override
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Override compiler selection by setting the <code>CPP_COMPILER</code> variable:
            </p>
            <CodeBlock
              language="bash"
              filename=".env"
              code={`CPP_COMPILER="C:\\CustomCompiler\\bin\\g++.exe"\nCPP_STANDARD="c++20"\nEXECUTION_TIMEOUT_SECONDS=30`}
            />
          </section>
        </div>
      );

    case 'user-guide':
      return (
        <div className="space-y-12 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="notebooks-overview" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Notebook Document Model
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              A CppBook notebook consists of ordered <strong>Code Cells</strong> and <strong>Markdown Cells</strong> saved in standard <code>.cppnb</code> JSON format.
            </p>
          </section>

          <section id="monaco-editing" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Keyboard Shortcuts Reference
            </h2>
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left text-sm border-collapse rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#141722] border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                    <th className="py-3.5 px-5">Shortcut</th>
                    <th className="py-3.5 px-5">Action</th>
                    <th className="py-3.5 px-5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0f1118] text-xs sm:text-sm">
                  <tr>
                    <td className="py-3.5 px-5 font-mono text-slate-950 dark:text-white font-bold">Shift + Enter</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Run Cell &amp; Advance</td>
                    <td className="py-3.5 px-5">Executes current cell and selects/creates next cell.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-mono text-slate-950 dark:text-white font-bold">Ctrl/Cmd + Enter</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Run Cell</td>
                    <td className="py-3.5 px-5">Executes cell while maintaining focus.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-mono text-slate-950 dark:text-white font-bold">Alt + Enter</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Run &amp; Insert Below</td>
                    <td className="py-3.5 px-5">Executes cell and inserts a new code cell below.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-mono text-slate-950 dark:text-white font-bold">Ctrl/Cmd + S</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Save Notebook</td>
                    <td className="py-3.5 px-5">Persists active notebook state to disk.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-mono text-slate-950 dark:text-white font-bold">Ctrl/Cmd + Shift + P</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-950 dark:text-white">Command Palette</td>
                    <td className="py-3.5 px-5">Opens searchable command menu.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="persistent-state-guide" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Multi-Cell State Persistence
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              Declarations in preceding cells are preserved across runs via compile-and-replay code synthesis:
            </p>

            <PersistentStateDiagram />

            <CodeBlock
              language="cpp"
              filename="Cell 1"
              code={`#include <iostream>\n#include <vector>\n\nstruct Account {\n    std::string name;\n    double balance;\n};\n\nAccount user{"Alice", 1000.0};`}
            />

            <CodeBlock
              language="cpp"
              filename="Cell 2"
              code={`user.balance += 500.0;\nstd::cout << user.name << ": $" << user.balance << std::endl;`}
            />
          </section>
        </div>
      );

    case 'features':
      return (
        <div className="space-y-8 text-slate-700 dark:text-slate-300 text-base leading-relaxed">
          <p>
            Detailed specifications for all verified features present in the CppBook repository:
          </p>

          <div className="space-y-5">
            <div id="feature-monaco" className="doc-card rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">1. Monaco C++ Editor Integration</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Provides syntax highlighting, bracket matching, indentation guides, and code folding for C++.</p>
            </div>

            <div id="feature-execution-engine" className="doc-card rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">2. Compile-and-Replay Execution Engine</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Synthesizes translation units and compiles natively via system C++ compiler processes.</p>
            </div>

            <div id="feature-main-rewriting" className="doc-card rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">3. Smart user main() Rewriting</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Rewrites user-defined <code>int main()</code> functions to avoid multiple definition link collisions.</p>
            </div>

            <div id="feature-interactive-ws" className="doc-card rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">4. WebSocket Terminal for Interactive I/O</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Bi-directional streaming for interactive <code>std::cin</code> terminal input.</p>
            </div>

            <div id="feature-desktop-app" className="doc-card rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">5. Standalone Desktop Architecture</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Self-contained Electron desktop application with automated backend lifecycle management.</p>
            </div>
          </div>
        </div>
      );

    case 'architecture':
      return (
        <div className="space-y-12 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="four-layer-architecture" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Four-Layer Architecture
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              CppBook is organized into four decoupled architectural layers:
            </p>
            <ArchitectureDiagram />
          </section>

          <section id="execution-pipeline" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Execution Pipeline
            </h2>
            <ExecutionFlowDiagram />
          </section>

          <section id="backend-api-table" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              FastAPI Backend Endpoints
            </h2>
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left text-xs sm:text-sm border-collapse rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#141722] border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-mono font-bold">
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Endpoint</th>
                    <th className="py-3.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-[#0f1118]">
                  <tr>
                    <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">GET</td>
                    <td className="py-3 px-4 text-slate-950 dark:text-white font-bold">/api/health</td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">Liveness and readiness check.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">GET</td>
                    <td className="py-3 px-4 text-slate-950 dark:text-white font-bold">/api/compiler</td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">Returns detected compiler and toolchain specs.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-blue-700 dark:text-blue-400 font-bold">POST</td>
                    <td className="py-3 px-4 text-slate-950 dark:text-white font-bold">/api/execute</td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">Compiles and runs target cell with compile-and-replay.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-blue-700 dark:text-blue-400 font-bold">POST</td>
                    <td className="py-3 px-4 text-slate-950 dark:text-white font-bold">/api/execute/all</td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">Sequentially executes all code cells.</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-purple-700 dark:text-purple-400 font-bold">WS</td>
                    <td className="py-3 px-4 text-slate-950 dark:text-white font-bold">/api/execute/interactive</td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">Interactive WebSocket for live stdin/stdout streams.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      );

    case 'developer-guide':
      return (
        <div className="space-y-12 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="dev-prerequisites" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Prerequisites
            </h2>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>Node.js 20.0+ and npm</li>
              <li>Python 3.11+</li>
              <li>C++ Compiler (GCC, Clang, or MSVC)</li>
            </ul>
          </section>

          <section id="dev-environment-setup" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Development Server Setup
            </h2>
            <CodeBlock
              language="bash"
              filename="Terminal"
              code={`# 1. Clone repo\ngit clone https://github.com/Bhavesh12y/CPPBOOK.git\ncd CPPBOOK\n\n# 2. Install dependencies\nnpm install\n\n# 3. Setup Python venv\npython -m venv .venv\n.venv\\Scripts\\python -m pip install -r backend/requirements.txt\n\n# 4. Start concurrent dev servers\nnpm run dev`}
            />
          </section>

          <section id="electron-packaging" className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight border-b border-slate-200 dark:border-white/10 pb-3">
              Packaging Commands
            </h2>
            <CodeBlock
              language="bash"
              filename="Terminal"
              code={`# Build backend executable (PyInstaller)\nnpm run desktop:backend\n\n# Build Windows installer (.exe)\nnpm run desktop:dist:win\n\n# Build Linux AppImage\nnpm run desktop:dist:linux\n\n# Build macOS DMG\nnpm run desktop:dist:mac`}
            />
          </section>
        </div>
      );

    case 'troubleshooting':
      return (
        <div className="space-y-8 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <div id="compiler-not-found" className="doc-card rounded-2xl p-6 space-y-2">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              Compiler Not Detected on PATH
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400"><strong>Symptom:</strong> &ldquo;No C++ compiler found. Install GCC/g++ or set CPP_COMPILER.&rdquo;</p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Solution:</strong> On Windows, add <code>C:\msys64\ucrt64\bin</code> to PATH. On macOS, run <code>xcode-select --install</code>.</p>
          </div>

          <div id="macos-gatekeeper" className="doc-card rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              macOS Gatekeeper Block / App Reported Damaged
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400"><strong>Symptom:</strong> macOS displays &ldquo;CppBook is damaged and can&rsquo;t be opened&rdquo; or blocks launch from unidentified developer.</p>
            <MacOSInstallInstructions />
          </div>

          <div id="linux-appimage" className="doc-card rounded-2xl p-6 space-y-2">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
              Linux AppImage Execution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400"><strong>Symptom:</strong> AppImage fails to launch.</p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Solution:</strong> Grant execution permission (<code>chmod +x</code>) and ensure <code>libfuse2</code> is installed.</p>
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-5 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <div className="doc-card rounded-2xl p-6 space-y-2">
            <h3 className="font-bold text-slate-950 dark:text-white text-base">Does CppBook require Python pre-installed to run?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">No. Standalone desktop releases bundle Python as a native binary using PyInstaller.</p>
          </div>

          <div className="doc-card rounded-2xl p-6 space-y-2">
            <h3 className="font-bold text-slate-950 dark:text-white text-base">Can I use CppBook offline?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Yes, 100%. Compilation and execution run entirely locally on your computer.</p>
          </div>

          <div className="doc-card rounded-2xl p-6 space-y-2">
            <h3 className="font-bold text-slate-950 dark:text-white text-base">Which C++ standards are supported?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Defaults to C++17; supports C++20 and C++23 depending on your compiler.</p>
          </div>
        </div>
      );

    case 'security':
      return (
        <div className="space-y-10 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="zero-telemetry" className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
              Zero Telemetry
            </h2>
            <p className="text-slate-700 dark:text-slate-300">CppBook contains no telemetry, analytics beacons, or remote tracking.</p>
          </section>

          <section id="network-behavior" className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
              Localhost Binding
            </h2>
            <p className="text-slate-700 dark:text-slate-300">The backend binds exclusively to loopback (<code>127.0.0.1</code>), ensuring no local network exposure.</p>
          </section>
        </div>
      );

    case 'license':
      return (
        <div className="space-y-8 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
          <section id="project-license" className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
              MIT License
            </h2>
            <CodeBlock
              language="text"
              filename="LICENSE"
              code={`MIT License\n\nCopyright (c) 2026 CppBook Contributors\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.`}
            />
          </section>
        </div>
      );

    default:
      return null;
  }
};
