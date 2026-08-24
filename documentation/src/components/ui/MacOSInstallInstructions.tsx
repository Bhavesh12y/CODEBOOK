import React, { useState } from 'react';
import { Apple, Copy, Check, Terminal, AlertTriangle } from 'lucide-react';

interface MacOSInstallInstructionsProps {
  compact?: boolean;
}

export const MacOSInstallInstructions: React.FC<MacOSInstallInstructionsProps> = ({ compact = false }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#0c0e14] p-6 sm:p-7 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white">
            <Apple className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-950 dark:text-white font-mono tracking-tight">
              Installation Fix Instructions
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              If macOS displays &ldquo;CppBook is damaged&rdquo; or blocks launch due to Gatekeeper quarantine:
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-mono font-bold">
          <AlertTriangle className="w-3 h-3" /> macOS Fix
        </span>
      </div>

      {/* Steps List */}
      <div className="space-y-3.5">
        {/* Step 1 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11131a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs font-mono border border-blue-500/30">
              1
            </div>
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              Enter the command in terminal:{' '}
              <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black/60 text-amber-600 dark:text-amber-300 font-mono font-bold border border-slate-200 dark:border-white/10 text-xs">
                xattr -cr
              </code>{' '}
              then after it space and then drop the application to the terminal and press Enter.
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('xattr -cr /Applications/CppBook.app', 'step1')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold transition-colors cursor-pointer ml-10 sm:ml-0"
          >
            {copiedKey === 'step1' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy command</span>
              </>
            )}
          </button>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#11131a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs font-mono border border-rose-500/30">
              2
            </div>
            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              Or you can disable gatekeeper globally by entering{' '}
              <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-black/60 text-rose-600 dark:text-rose-300 font-mono font-bold border border-slate-200 dark:border-white/10 text-xs">
                sudo spctl --master-disable
              </code>{' '}
              in terminal.
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('sudo spctl --master-disable', 'step2')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold transition-colors cursor-pointer ml-10 sm:ml-0"
          >
            {copiedKey === 'step2' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy command</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
