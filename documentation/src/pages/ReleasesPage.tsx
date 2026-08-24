import React from 'react';
import { Download, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import { RELEASES } from '../data/releasesData';

interface ReleasesPageProps {
  onNavigateRoute: (route: string) => void;
}

export const ReleasesPage: React.FC<ReleasesPageProps> = () => {
  return (
    <div className="min-h-screen relative">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-white/10 text-xs font-mono text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Version History &amp; Changelogs</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            CppBook Releases
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
            Detailed changelogs, new capabilities, stability improvements, and official download binaries for every CppBook release.
          </p>
        </div>

        {/* Releases List (Transparent Boxes) */}
        <div className="space-y-12">
          {RELEASES.map((rel) => (
            <article
              key={rel.version}
              className="rounded-3xl border border-slate-300/80 dark:border-white/15 bg-transparent p-8 sm:p-12 space-y-10 shadow-sm"
            >
              {/* Release Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-300/60 dark:border-white/10 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3.5">
                    <h2 className="text-3xl font-black text-slate-950 dark:text-white">
                      Version {rel.version}
                    </h2>
                    {rel.isLatest && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                        Latest Stable
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {rel.releaseDate}
                    </span>
                    <span>&bull;</span>
                    <span>Tag: {rel.tag}</span>
                  </div>
                </div>

                {rel.githubUrl && (
                  <a
                    href={rel.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-transparent hover:bg-slate-100/50 dark:hover:bg-white/5 text-xs font-mono font-bold text-slate-900 dark:text-slate-200 transition-colors"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Release Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Summary
                </h3>
                <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {rel.summary}
                </p>
              </div>

              {/* Highlights (Transparent Cards) */}
              {rel.highlights && rel.highlights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Key Highlights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {rel.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-300/60 dark:border-white/10 bg-transparent text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                      >
                        <span className="text-slate-500 font-bold">&bull;</span>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Changelog Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-300/60 dark:border-white/10">
                {/* What's New */}
                {rel.whatsNew && rel.whatsNew.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      New Features
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-300 font-medium">
                      {rel.whatsNew.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold mt-0.5">+</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements & Fixes */}
                <div className="space-y-6">
                  {rel.improvements && rel.improvements.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Improvements &amp; Optimizations
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-300 font-medium">
                        {rel.improvements.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold mt-0.5">&bull;</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rel.bugFixes && rel.bugFixes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Bug Fixes
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-300 font-medium">
                        {rel.bugFixes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 font-bold mt-0.5">&bull;</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Release Binaries (Transparent Asset Cards) */}
              {rel.assets && rel.assets.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-300/60 dark:border-white/10">
                  <h3 className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Release Assets &amp; Binaries
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {rel.assets.map((asset, idx) => (
                      <a
                        key={idx}
                        href={asset.downloadUrl}
                        className="p-4 rounded-xl border border-slate-300/80 dark:border-white/15 bg-transparent hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1 truncate pr-2">
                          <div className="font-bold text-slate-950 dark:text-white truncate">{asset.filename}</div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{asset.size}</div>
                        </div>
                        <Download className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
