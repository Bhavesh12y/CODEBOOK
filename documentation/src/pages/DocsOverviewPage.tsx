import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { DOC_SECTIONS } from '../data/docsContent';

interface DocsOverviewPageProps {
  onNavigateSection: (sectionId: string) => void;
  onNavigateRoute: (route: string) => void;
  onOpenSearch: () => void;
}

export const DocsOverviewPage: React.FC<DocsOverviewPageProps> = ({
  onNavigateSection,
  onNavigateRoute,
  onOpenSearch,
}) => {
  return (
    <div className="min-h-screen py-16 px-6 lg:px-12 relative">
      <div className="mx-auto max-w-[1400px] space-y-12">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            Documentation Overview
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            In-depth guides, compiler toolchain setup, execution architecture, and developer references for CppBook.
          </p>

          {/* Quick Search */}
          <div className="pt-2 max-w-lg">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0b0f19] hover:border-slate-400 dark:hover:border-white/20 text-xs sm:text-sm text-slate-600 dark:text-slate-400 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="font-medium">Search all documentation topics...</span>
              </div>
              <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                Ctrl+K
              </kbd>
            </button>
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DOC_SECTIONS.map((section) => (
            <div
              key={section.id}
              onClick={() => onNavigateSection(section.id)}
              className="doc-card rounded-2xl p-7 cursor-pointer flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="uppercase text-slate-900 dark:text-white font-bold">{section.category}</span>
                  <span>{section.readTime}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-950 dark:text-white transition-colors">
                  {section.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {section.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-950 dark:text-white">
                <span>Read topic</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}

          {/* Releases Card */}
          <div
            onClick={() => onNavigateRoute('/releases')}
            className="doc-card rounded-2xl p-7 cursor-pointer flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="uppercase text-slate-900 dark:text-white font-bold">CHANGELOG</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">v1.0.0</span>
              </div>

              <h3 className="text-xl font-bold text-slate-950 dark:text-white transition-colors">
                Releases &amp; Changelogs
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 leading-relaxed">
                Review version history, new features, performance updates, and download standalone binaries.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-950 dark:text-white">
              <span>View changelogs</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
