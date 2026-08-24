import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Check,
  FileCode,
  ChevronRight,
  Save,
  RotateCw,
  Plus,
  X,
} from 'lucide-react';

export const MonacoPreviewMock: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse tilt tracking over container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
    }, 450);
  };

  // Enhanced 3D dynamic parallax rotation combining scroll + mouse movement
  const scrollTiltY = Math.max(-12, Math.min(6, -6 + scrollY * 0.025));
  const scrollTiltX = Math.max(0, Math.min(10, 5 - scrollY * 0.015));
  const translateY = Math.max(-25, Math.min(30, scrollY * 0.05));

  const totalRotY = scrollTiltY + mouseOffset.x * 14;
  const totalRotX = scrollTiltX - mouseOffset.y * 12;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1200 w-full select-none py-2"
    >
      <div
        style={{
          transform: `rotateY(${totalRotY}deg) rotateX(${totalRotX}deg) translateY(${translateY}px)`,
          transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
        }}
        className="rounded-2xl border border-slate-200 dark:border-[#2b303c] bg-white dark:bg-[#12141a] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.75)] overflow-hidden"
      >
        {/* Desktop App Window Titlebar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-[#181a22] border-b border-slate-200 dark:border-[#232732]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.5)] cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.5)] cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.5)] cursor-pointer" />
            
            {/* Active Tab Pill */}
            <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-[#12141a] border border-slate-200 dark:border-[#272b36] text-xs font-mono text-slate-900 dark:text-slate-200 font-semibold shadow-sm">
              <FileCode className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>stl-algorithms.cppnb</span>
              <X className="w-3 h-3 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-1" />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 cursor-pointer">
              <Plus className="w-3 h-3" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5 text-[11px] border border-emerald-500/20 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              GCC 14.2 &middot; Ready
            </span>
          </div>
        </div>

        {/* CppBook Action Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-[#14161f] border-b border-slate-200 dark:border-[#232732] text-xs font-medium">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-black text-slate-950 dark:text-white text-xs tracking-wide mr-1">
              CPP<span className="text-slate-500 dark:text-slate-400">book</span>
            </span>
            <div className="h-3.5 w-[1px] bg-slate-300 dark:bg-[#272b36] mr-1" />
            <button type="button" className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-white/5 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200">
              <Plus className="w-3 h-3" /> Code
            </button>
            <button type="button" className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-white/5 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200">
              <Save className="w-3 h-3" /> Save
            </button>
            <button
              type="button"
              onClick={handleRun}
              className="px-3 py-1 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center gap-1.5 text-[11px] font-bold transition-all shadow-sm active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" /> Run All
            </button>
            <button type="button" className="px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-white/5 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200">
              <RotateCw className="w-3 h-3" /> Restart
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Autosaved &middot; .cppnb
          </div>
        </div>

        {/* Editor Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-[#232732] bg-white dark:bg-[#0d0e13]">
          {/* Workspace Mini Sidebar */}
          <div className="hidden md:block md:col-span-4 p-4 bg-slate-50 dark:bg-[#101218] text-xs font-mono space-y-4">
            <div className="text-slate-500 uppercase text-[10px] tracking-wider font-bold px-1">Workspace Files</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-950 dark:text-white font-bold">
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>stl-algorithms.cppnb</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 cursor-pointer">
                <span className="w-3.5 text-center text-slate-400 dark:text-slate-600">&bull;</span>
                <span>data-structures.cppnb</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 cursor-pointer">
                <span className="w-3.5 text-center text-slate-400 dark:text-slate-600">&bull;</span>
                <span>hello-world.cppnb</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-[#232732] px-1 space-y-1">
              <div className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Compiler Toolchain</div>
              <div className="text-slate-900 dark:text-slate-200 text-[11px] font-bold">MinGW GCC 14.2 &middot; C++17</div>
              <div className="text-slate-500 text-[10px] truncate">C:\msys64\ucrt64\bin\g++.exe</div>
            </div>
          </div>

          {/* Cell & Monaco Area */}
          <div className="md:col-span-8 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-slate-100/50 dark:bg-[#0d0e13]">
            {/* Cell Container */}
            <div className="rounded-xl border border-slate-200 dark:border-[#272b36] bg-white dark:bg-[#13151c] overflow-hidden shadow-sm">
              {/* Cell Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 dark:bg-[#181b24] border-b border-slate-200 dark:border-[#232732] text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-200 bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded">
                    [1] C++ Code Cell
                  </span>
                  <span className="text-slate-500 text-[10px]">Shift+Enter to Run</span>
                </div>
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-sans text-xs font-bold shadow-sm transition-colors active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isRunning ? 'Compiling...' : 'Run'}
                </button>
              </div>

              {/* Monaco Simulator Code Editor */}
              <div className="p-4 text-xs font-mono leading-relaxed bg-[#0b0c10] text-slate-200">
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">1</span><span className="text-blue-400 font-semibold">#include</span> <span className="text-emerald-300">&lt;iostream&gt;</span></div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">2</span><span className="text-blue-400 font-semibold">#include</span> <span className="text-emerald-300">&lt;vector&gt;</span></div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">3</span><span className="text-blue-400 font-semibold">#include</span> <span className="text-emerald-300">&lt;algorithm&gt;</span></div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">4</span><span className="text-blue-400 font-semibold">using namespace</span> <span className="text-cyan-300">std</span>;</div>
                <div className="my-1 text-slate-800 select-none">&bull;</div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">5</span>vector&lt;<span className="text-purple-400 font-semibold">int</span>&gt; nums = &#123;<span className="text-amber-300 font-semibold">42</span>, <span className="text-amber-300 font-semibold">17</span>, <span className="text-amber-300 font-semibold">99</span>, <span className="text-amber-300 font-semibold">8</span>, <span className="text-amber-300 font-semibold">31</span>&#125;;</div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">6</span>sort(nums.begin(), nums.end());</div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">7</span>cout &lt;&lt; <span className="text-emerald-300">&quot;Sorted elements: &quot;</span>;</div>
                <div><span className="text-slate-600 select-none mr-3 text-[10px]">8</span><span className="text-blue-400 font-semibold">for</span> (<span className="text-purple-400 font-semibold">int</span> n : nums) cout &lt;&lt; n &lt;&lt; <span className="text-emerald-300">&quot; &quot;</span>;</div>
              </div>
            </div>

            {/* Output Panel Below Cell */}
            {hasExecuted && (
              <div className="rounded-xl border border-slate-200 dark:border-[#272b36] bg-slate-50 dark:bg-[#0b0c10] p-3.5 text-xs font-mono space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#232732] text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                    <Check className="w-3.5 h-3.5" /> status: success &middot; exit code: 0
                  </span>
                  <span>elapsed: 0.038s</span>
                </div>
                <div className="pt-1 text-slate-900 dark:text-slate-200 font-bold text-xs">
                  Sorted elements: 8 17 31 42 99
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
