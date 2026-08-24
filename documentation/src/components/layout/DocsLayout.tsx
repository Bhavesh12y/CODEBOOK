import React, { useState } from 'react';
import { ChevronRight, Home, ArrowLeft, ArrowRight, Menu, X, Clock } from 'lucide-react';
import { DocsSidebar } from './DocsSidebar';
import { DocsTOC } from './DocsTOC';
import { DOC_SECTIONS } from '../../data/docsContent';
import { DocSection } from '../../types/docs';

interface DocsLayoutProps {
  currentSection: DocSection;
  onNavigateSection: (sectionId: string) => void;
  onNavigateRoute: (route: string) => void;
  children: React.ReactNode;
}

export const DocsLayout: React.FC<DocsLayoutProps> = ({
  currentSection,
  onNavigateSection,
  onNavigateRoute,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Find previous and next sections
  const currentIndex = DOC_SECTIONS.findIndex((s) => s.id === currentSection.id);
  const prevSection = currentIndex > 0 ? DOC_SECTIONS[currentIndex - 1] : null;
  const nextSection = currentIndex < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[currentIndex + 1] : null;

  const handleSelectSection = (id: string) => {
    onNavigateSection(id);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#08090d] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Flyout */}
      <div
        className={`fixed top-16 bottom-0 left-0 z-50 w-72 bg-white dark:bg-[#13151b] border-r border-slate-200 dark:border-[#272b36] transition-transform duration-300 lg:hidden shadow-2xl ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#272b36]">
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-300">
            Documentation Index
          </span>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
          <DocsSidebar
            currentSectionId={currentSection.id}
            onSelectSection={handleSelectSection}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Wide Fluid Container */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 px-6 sm:px-8 lg:px-12">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block w-72 shrink-0 py-10 border-r border-slate-200 dark:border-[#232732] sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto pr-6">
          <DocsSidebar
            currentSectionId={currentSection.id}
            onSelectSection={handleSelectSection}
          />
        </div>

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 py-10 lg:px-12 xl:px-16 max-w-5xl">
          {/* Breadcrumb Trail & Mobile Trigger */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-[#232732] mb-10">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onNavigateRoute('/')}
                className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <button
                type="button"
                onClick={() => onNavigateRoute('/docs')}
                className="hover:text-slate-950 dark:hover:text-white transition-colors font-medium"
              >
                Docs
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <span className="text-slate-500">{currentSection.category}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
              <span className="text-slate-950 dark:text-white font-bold">{currentSection.title}</span>
            </div>

            {/* Mobile Sidebar Trigger */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#272b36] bg-white dark:bg-[#13151b] text-xs font-semibold text-slate-800 dark:text-slate-300"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
          </div>

          {/* Document Section Header */}
          <header className="mb-12 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-300 text-xs font-mono font-semibold">
                {currentSection.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" /> {currentSection.readTime}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
              {currentSection.title}
            </h1>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl font-medium">
              {currentSection.description}
            </p>
          </header>

          {/* Article Body Content */}
          <div className="space-y-12">
            {children}
          </div>

          {/* Bottom Pagination Links */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-[#232732] grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevSection ? (
              <button
                type="button"
                onClick={() => handleSelectSection(prevSection.id)}
                className="group flex flex-col items-start p-5 rounded-2xl doc-card text-left"
              >
                <span className="flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white mb-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous Topic
                </span>
                <span className="font-bold text-slate-950 dark:text-white text-sm sm:text-base">
                  {prevSection.title}
                </span>
              </button>
            ) : <div />}

            {nextSection ? (
              <button
                type="button"
                onClick={() => handleSelectSection(nextSection.id)}
                className="group flex flex-col items-end p-5 rounded-2xl doc-card text-right ml-auto w-full"
              >
                <span className="flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white mb-1.5">
                  Next Topic <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-950 dark:text-white text-sm sm:text-base">
                  {nextSection.title}
                </span>
              </button>
            ) : <div />}
          </div>
        </main>

        {/* Right "On This Page" Table of Contents */}
        <div className="hidden xl:block w-64 shrink-0 pl-8 py-10 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <DocsTOC
            headings={currentSection.headings}
            onNavigate={onNavigateRoute}
          />
        </div>
      </div>
    </div>
  );
};
