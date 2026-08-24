import React, { useState } from 'react';
import { Layers, Terminal, FileCode } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  const layers = [
    {
      step: 'Layer 1',
      title: 'Electron Desktop Layer',
      tech: 'Electron 34 + Node.js Main Process + Preload Bridge',
      desc: 'Controls desktop window lifecycle, launches local Python backend on dynamic port, establishes secure IPC contextBridge, and monitors process health.',
    },
    {
      step: 'Layer 2',
      title: 'React Frontend UI',
      tech: 'React 19, TypeScript, Monaco Editor, Tailwind CSS',
      desc: 'Renders the notebook editor, handles cell operations, integrates Monaco C++ IntelliSense, manages autosave, and displays execution output.',
    },
    {
      step: 'Layer 3',
      title: 'FastAPI Backend Server',
      tech: 'FastAPI, Python 3.11+, Pydantic v2, Uvicorn',
      desc: 'Provides REST & WebSocket routes, manages .cppnb JSON files, coordinates kernel state, parses C++ code chunks, and maps diagnostic compiler errors.',
    },
    {
      step: 'Layer 4',
      title: 'Native C++ Compiler Engine',
      tech: 'MinGW-w64 / GCC / Apple Clang / MSVC',
      desc: 'Compiles synthesized C++ translation units (-std=c++17/20), runs native executable binaries with a 30s watchdog timer, and captures stdout/stderr streams.',
    },
  ];

  return (
    <div className="doc-card rounded-2xl overflow-hidden">
      {/* Window Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-[#090d18] border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Four-Layer Subsystem Architecture
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
          100% Localhost
        </span>
      </div>

      <div className="p-6 sm:p-8 space-y-3">
        {layers.map((layer, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedLayer(selectedLayer === idx ? null : idx)}
            className={`p-4 sm:p-5 rounded-xl border transition-colors cursor-pointer ${
              selectedLayer === idx
                ? 'border-slate-900 dark:border-white/30 bg-slate-100 dark:bg-white/10'
                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05080f] hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-950 dark:text-white px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20">
                  {layer.step}
                </span>
                <span className="font-bold text-slate-950 dark:text-white text-sm sm:text-base">
                  {layer.title}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{layer.tech}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-0 sm:pl-10">
              {layer.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ExecutionFlowDiagram: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Cell Aggregation',
      sub: 'Frontend Dispatch',
      desc: 'Frontend collects all code cells up to active cell and sends payload to /api/execute.',
      code: 'payload = { cells: [1..N] }',
    },
    {
      num: '02',
      title: 'AST Classification',
      sub: 'Backend Parser',
      desc: 'Separates #include lines, using directives, global structs/classes, and user main().',
      code: 'parse_ast_chunks(code)',
    },
    {
      num: '03',
      title: 'Native Compilation',
      sub: 'System Compiler',
      desc: 'Synthesizes temporary translation unit (main.cpp) and compiles with g++ (-std=c++17).',
      code: 'g++ -O2 -std=c++17 main.cpp',
    },
    {
      num: '04',
      title: 'Subprocess Execution',
      sub: 'Output Isolation',
      desc: 'Executes binary silently for prior cells, capturing active cell stdout, stderr, and timing.',
      code: 'exec(binary) -> stdout, exit 0',
    },
  ];

  return (
    <div className="doc-card rounded-2xl overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-[#090d18] border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Compile-and-Replay Execution Pipeline
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded border border-slate-300 dark:border-white/20 font-semibold">
          30s watchdog
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05080f] p-5 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-950 dark:text-white font-bold bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded border border-slate-300 dark:border-white/20">
                    {step.num}
                  </span>
                  <span className="text-slate-500">{step.sub}</span>
                </div>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm">{step.title}</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{step.desc}</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900 text-[10px] font-mono text-slate-100 border border-slate-800 truncate">
                <code>{step.code}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PersistentStateDiagram: React.FC = () => {
  return (
    <div className="doc-card rounded-2xl overflow-hidden">
      {/* Titlebar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-[#090d18] border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Code Synthesis &amp; Symbol Isolation
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded border border-slate-300 dark:border-white/20 font-semibold">
          Translation Unit Synthesis
        </span>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notebook Cells */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-white font-bold">
            Notebook Cells (Editor Window)
          </div>
          
          <div className="space-y-3 text-xs font-mono">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05080f] space-y-1">
              <div className="text-slate-900 dark:text-slate-200 font-bold">// Cell [1] Executed</div>
              <div className="text-slate-700 dark:text-slate-300">#include &lt;iostream&gt;</div>
              <div className="text-slate-700 dark:text-slate-300">int total = 100;</div>
            </div>

            <div className="p-4 rounded-xl border border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-[#080d18] space-y-1">
              <div className="text-slate-950 dark:text-white font-bold">// Cell [2] Active Target Cell</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">total += 50;</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">std::cout &lt;&lt; "Total: " &lt;&lt; total;</div>
            </div>
          </div>
        </div>

        {/* Synthesized main.cpp */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-white font-bold">
            Synthesized Translation Unit (main.cpp)
          </div>
          
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#05080f] text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1">
            <div className="text-slate-500">// 1. Deduplicated Header Includes</div>
            <div className="text-slate-800 dark:text-slate-200 font-semibold">#include &lt;iostream&gt;</div>
            <div className="text-slate-500 mt-2">// 2. Global State Declarations</div>
            <div className="text-slate-800 dark:text-slate-200 font-semibold">int total = 100;</div>
            <div className="text-slate-500 mt-2">// 3. Runner Wrapper</div>
            <div className="text-slate-800 dark:text-slate-200 font-semibold">int main() &#123;</div>
            <div className="pl-4 text-slate-800 dark:text-slate-200 font-semibold">total += 50;</div>
            <div className="pl-4 text-slate-800 dark:text-slate-200 font-semibold">std::cout &lt;&lt; "Total: " &lt;&lt; total;</div>
            <div className="pl-4 text-slate-800 dark:text-slate-200 font-semibold">return 0;</div>
            <div className="text-slate-800 dark:text-slate-200 font-semibold">&#125;</div>
          </div>
        </div>
      </div>
    </div>
  );
};
