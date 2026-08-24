import React, { useState } from 'react';
import {
  Download,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Monitor,
  Apple,
  Terminal,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
} from 'lucide-react';
import { MonacoPreviewMock } from '../components/ui/MonacoPreviewMock';
import { ExecutionFlowDiagram } from '../components/ui/Diagrams';
import { GITHUB_REPO_URL } from '../data/downloadsData';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Does CppBook require Python or Node.js to be pre-installed?',
      a: 'No. The standalone desktop installers (Windows NSIS .exe, macOS .dmg, Linux AppImage) bundle all runtime dependencies automatically via PyInstaller and Electron. You only need a native C++ compiler (such as GCC/MinGW, Clang, or MSVC) on your PATH to compile and execute C++ code.',
    },
    {
      q: 'Can I use CppBook completely offline?',
      a: 'Yes, 100%. CppBook executes C++ locally on your machine via direct OS subprocess calls. No cloud servers, telemetry, or network connections are used during code compilation or execution.',
    },
    {
      q: 'How does state persistence work across notebook cells in C++?',
      a: 'CppBook uses a compile-and-replay engine. When executing a cell, preceding includes, classes, structs, functions, and variable declarations are synthesized into a temporary translation unit and compiled with native optimization flags, replaying prior state silently while displaying output exclusively for the active target cell.',
    },
    {
      q: 'Can I write standard "int main()" functions in notebook cells?',
      a: 'Yes. CppBook includes an AST symbol rewriter that isolates user-defined main() functions into cell execution hooks, preventing multiple-definition symbol collisions while allowing full standard competitive programming templates.',
    },
    {
      q: 'Is CppBook open source and free for commercial use?',
      a: 'Yes. CppBook is released as open-source software under the permissive MIT License. You can freely inspect, modify, and build upon the source code.',
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Subtle Platinum ambient glow orb in dark mode */}
      <div className="hidden dark:block absolute top-8 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-slate-200/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-[1400px] px-6 lg:px-12 pt-16 sm:pt-24 pb-24 space-y-12">
        {/* Centered Hero Typography */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            Write. Run. Learn.
            <br />
            <span className="text-gradient-platinum">All in one C++ notebook.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
            CppBook is a local Jupyter-like notebook IDE designed for C++. Write executable code cells, Markdown notes, real-time native compiler execution, and persistent multi-cell state.
          </p>
        </div>

        {/* 3D Realistic Parallax Mockup (Hero Centerpiece) */}
        <div className="max-w-5xl mx-auto">
          <MonacoPreviewMock />
        </div>

        {/* Action CTAs (Below 3D IDE element) */}
        <div className="text-center space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/downloads')}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Download CppBook</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/docs')}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#12141c] hover:border-slate-400 dark:hover:border-white/30 text-slate-900 dark:text-white font-bold text-base transition-all shadow-sm"
            >
              <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span>Explore Documentation</span>
            </button>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            Windows (64-bit) &middot; macOS (Apple Silicon / Intel) &middot; Linux AppImage
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="relative mx-auto max-w-[1400px] px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Crafted for Modern C++ Workflows
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Everything you need to experiment, prototype algorithms, solve DSA problems, and document complex C++ code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="doc-card rounded-2xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Monaco Editor Integration</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Industrial syntax highlighting, bracket colorization, code folding, minimap navigation, and C++ editing powered by Monaco.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/docs/features')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-slate-200 hover:underline pt-2"
            >
              <span>Read editor documentation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="doc-card rounded-2xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Real-time Native Execution</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Execute C++ code snippets instantly with your native system compiler, viewing stdout, stderr, exit codes, and diagnostics.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/docs/features')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-slate-200 hover:underline pt-2"
            >
              <span>Explore execution engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="doc-card rounded-2xl p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Persistent Execution State</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Variables, classes, and functions remain active across multiple cells, enabling complex multi-step development and algorithm staging.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/docs/features')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-slate-200 hover:underline pt-2"
            >
              <span>Learn how state persists</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Execution Pipeline Flowchart */}
      <section className="relative mx-auto max-w-[1400px] px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            How Code Executes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            A transparent look at the compile-and-replay pipeline and code synthesis engine.
          </p>
        </div>

        <ExecutionFlowDiagram />
      </section>

      {/* Quick Start 4-Step */}
      <section className="relative mx-auto max-w-[1400px] px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Getting Started in 4 Steps
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            From setup to running your first interactive C++ notebook cell.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="doc-card rounded-2xl p-6 space-y-2">
            <div className="text-xs font-mono text-slate-500 font-bold">STEP 1</div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Download Installer</h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">Download the standalone installer for Windows, macOS, or Linux.</p>
          </div>

          <div className="doc-card rounded-2xl p-6 space-y-2">
            <div className="text-xs font-mono text-slate-500 font-bold">STEP 2</div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Verify Compiler</h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">Ensure a standard C++ compiler (GCC, Clang, or MSVC) is installed.</p>
          </div>

          <div className="doc-card rounded-2xl p-6 space-y-2">
            <div className="text-xs font-mono text-slate-500 font-bold">STEP 3</div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Create Notebook</h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">Launch CppBook and click &ldquo;New Notebook&rdquo; to start a clean session.</p>
          </div>

          <div className="doc-card rounded-2xl p-6 space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">STEP 4</div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white">Run Cell</h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">Type C++ code and press Shift+Enter to compile and run immediately.</p>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section className="relative mx-auto max-w-[1400px] px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-white/10">
        <div className="rounded-3xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-[#10131b] p-8 sm:p-12 text-center space-y-8 shadow-sm">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              Download CppBook
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">
              Get the standalone desktop package for Windows, macOS, or Linux. Standalone installers bundle all runtime dependencies.
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('/downloads')}
              className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-all group shadow-md active:scale-95"
            >
              <div className="flex items-center gap-3.5 text-left">
                <div className="p-2 rounded-xl bg-white/10 dark:bg-slate-100 text-white dark:text-slate-950">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-base font-bold flex items-center gap-2 text-white dark:text-slate-950">
                    <span>Windows 64-bit</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 dark:bg-slate-200 font-mono font-normal">
                      Recommended
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 dark:text-slate-600 font-normal">
                    NSIS Installer &middot; CppBook.Setup.1.0.0.exe
                  </div>
                </div>
              </div>
              <Download className="w-5 h-5 text-white dark:text-slate-950" />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/downloads')}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0d13] hover:border-slate-300 dark:hover:border-white/20 text-slate-900 dark:text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Apple className="w-4 h-4" />
                <span>macOS (ARM/Intel)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/downloads')}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b0d13] hover:border-slate-300 dark:hover:border-white/20 text-slate-900 dark:text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Terminal className="w-4 h-4" />
                <span>Linux (AppImage)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="relative mx-auto max-w-4xl px-6 lg:px-8 py-20 border-t border-slate-200 dark:border-white/10">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Common questions regarding CppBook setup and execution.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="doc-card rounded-2xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-950 dark:text-white text-base hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
