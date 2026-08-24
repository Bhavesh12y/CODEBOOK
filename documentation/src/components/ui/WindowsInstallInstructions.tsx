import React, { useState } from 'react';
import { Monitor, ShieldAlert, ZoomIn, X } from 'lucide-react';

export const WindowsInstallInstructions: React.FC = () => {
  const [activePreview, setActivePreview] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#0c0e14] p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white font-mono tracking-tight">
              Windows Download &amp; SmartScreen Fix
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              If Edge, Chrome, or Windows SmartScreen flags the new .exe as &ldquo;isn&rsquo;t commonly downloaded&rdquo;:
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-mono font-bold">
          <ShieldAlert className="w-3 h-3" /> Windows Visual Guide
        </span>
      </div>

      {/* Visual Step-by-Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1 Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11131a] flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono border border-blue-500/30">
                1
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-950 dark:text-white">
                  Click Three Dots &rarr; Choose &ldquo;Keep&rdquo;
                </h5>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                  In your browser downloads popup (Edge / Chrome / Brave), hover over the file, click the three dots{' '}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-black/60 text-slate-950 dark:text-white font-mono font-bold border border-slate-200 dark:border-white/10 text-xs">
                    &middot;&middot;&middot;
                  </span>{' '}
                  and select <strong className="text-blue-600 dark:text-blue-400">Keep</strong>.
                </p>
              </div>
            </div>

            {/* Step 1 Full Image */}
            <div
              className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900/60 p-2 cursor-pointer shadow-xs"
              onClick={() => setActivePreview('./images/windows-keep-step1.png')}
            >
              <img
                src="./images/windows-keep-step1.png"
                alt="Windows Step 1: Click keep in downloads menu"
                className="w-full h-auto max-h-[340px] object-contain rounded-lg group-hover:scale-[1.01] transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs rounded-xl">
                <ZoomIn className="w-4 h-4" />
                <span>Click to view full size</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 Card */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11131a] flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs font-mono border border-amber-500/30">
                2
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-950 dark:text-white">
                  Click &ldquo;Delete &or;&rdquo; &rarr; Choose &ldquo;Keep anyway&rdquo;
                </h5>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                  On the &ldquo;Make sure you trust...&rdquo; prompt, click the{' '}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-black/60 text-slate-950 dark:text-white font-mono font-bold border border-slate-200 dark:border-white/10 text-xs">
                    Delete &or;
                  </span>{' '}
                  dropdown arrow and select <strong className="text-amber-600 dark:text-amber-400">Keep anyway</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 Full Image */}
            <div
              className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900/60 p-2 cursor-pointer shadow-xs"
              onClick={() => setActivePreview('./images/windows-keep-step2.png')}
            >
              <img
                src="./images/windows-keep-step2.png"
                alt="Windows Step 2: Select Keep Anyway from Delete dropdown"
                className="w-full h-auto max-h-[340px] object-contain rounded-lg group-hover:scale-[1.01] transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs rounded-xl">
                <ZoomIn className="w-4 h-4" />
                <span>Click to view full size</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Windows SmartScreen Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11131a] flex items-start gap-3.5 shadow-xs">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono border border-emerald-500/30">
          3
        </div>
        <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          When running the installer on your PC, if Windows SmartScreen displays a blue protection overlay, click{' '}
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-black/60 text-slate-950 dark:text-white font-mono font-bold border border-slate-200 dark:border-white/10 text-xs">
            More info
          </span>{' '}
          and then click <strong className="text-emerald-600 dark:text-emerald-400 underline">Run anyway</strong>.
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 cursor-pointer"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-[#0c0e14] rounded-2xl border border-white/20 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activePreview}
              alt="Enlarged Windows Step Preview"
              className="w-full h-auto max-h-[82vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
