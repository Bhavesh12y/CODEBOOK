import React from 'react';
import {
  Clock3,
  Edit3,
  FilePlus2,
  FolderOpen,
  HardDriveDownload,
  NotebookTabs,
  Play,
  Search,
  Settings,
} from 'lucide-react';

import type { ToolchainInfo, Notebook, NotebookSummary } from '../types/notebook';
import { IconButton } from './IconButton';
import { InteractiveBackground } from './InteractiveBackground';

interface HomePageProps {
  notebooks: NotebookSummary[];
  recentNotebookIds: string[];
  currentNotebook: Notebook;
  toolchain?: ToolchainInfo | null;
  compiler?: ToolchainInfo | null;
  onNew: () => void;
  onOpenLocal: () => void;
  onOpenNotebook: (id: string) => void;
  onRenameNotebook: (id: string) => void;
  onSaveCurrentLocal: () => void;
  onContinueCurrent: () => void;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}

function formatUpdated(value?: string | null): string {
  if (!value) return 'No timestamp';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function HomePage(props: HomePageProps) {
  const recent = props.recentNotebookIds
    .map((id) => props.notebooks.find((notebook) => notebook.id === id))
    .filter(Boolean) as NotebookSummary[];
  const primaryList = recent.length > 0 ? recent : props.notebooks.slice(0, 5);

  return (
    <main className="home-page relative flex flex-col h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] font-sans">
      {/* Custom Keyframe Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-in {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-1 { animation-delay: 0.08s; }
        .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; }
        .delay-4 { animation-delay: 0.32s; }
        
        .home-action-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .home-action-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent-base);
          background-color: var(--bg-surface-hover);
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
        }
      `}</style>

      {/* Interactive Responsive Background */}
      <InteractiveBackground />

      {/* Top Right Header with Transparent Settings Icon */}
      <header
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end h-12 px-6 pr-[140px] select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <button
          type="button"
          className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer"
          onClick={props.onOpenSettings}
          title="Settings"
          aria-label="Settings"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Full-width scrollable container */}
      <div className="flex-1 overflow-y-auto relative z-10 pt-4">
        <div className="mx-auto flex flex-col w-full max-w-4xl gap-8 px-6 py-12">
          {/* Hero Section */}
          <header className="flex flex-col items-center text-center gap-4 anim-fade-in pt-2">
            <div className="flex flex-col items-center">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] drop-shadow-sm">
                CODEBOOK
              </h1>
            
            </div>
            
            {/* Opaque Search Bar */}
            <button 
              type="button" 
              className="group flex items-center gap-3 w-full max-w-xl px-5 py-3.5 mt-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-indigo-500/50 rounded-xl transition-all shadow-md cursor-pointer" 
              onClick={props.onOpenPalette}
            >
              <Search className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-indigo-500 transition-colors" />
              <span className="text-[var(--text-secondary)] text-left flex-1 text-sm font-medium">Search notebooks, commands, or files...</span>
              <kbd className="flex items-center gap-1 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 text-xs font-mono text-[var(--text-secondary)]">
                Shift+K
              </kbd>
            </button>
          </header>

          {/* Action Grid (Sleek Glassy Elevated Cards) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            <button
              type="button"
              className="home-action-card flex flex-col items-center justify-center min-h-[136px] p-5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-indigo-500/50 rounded-2xl text-center anim-fade-in delay-1 group shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={props.onNew}
            >
              <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-indigo-500/15 group-hover:scale-105 text-[var(--text-secondary)] group-hover:text-indigo-400 transition-all duration-200">
                <FilePlus2 className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">New Notebook</span>
                <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5">Start fresh scratchpad</span>
              </div>
            </button>

            <button
              type="button"
              className="home-action-card flex flex-col items-center justify-center min-h-[136px] p-5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-purple-500/50 rounded-2xl text-center anim-fade-in delay-2 group shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={props.onOpenLocal}
            >
              <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-purple-500/15 group-hover:scale-105 text-[var(--text-secondary)] group-hover:text-purple-400 transition-all duration-200">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">Open Local</span>
                <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5">Load .cpp or .cppnb</span>
              </div>
            </button>

            <button
              type="button"
              className="home-action-card flex flex-col items-center justify-center min-h-[136px] p-5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-emerald-500/50 rounded-2xl text-center anim-fade-in delay-3 group shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={props.onContinueCurrent}
            >
              <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/15 group-hover:scale-105 text-[var(--text-secondary)] group-hover:text-emerald-400 transition-all duration-200">
                <Play className="h-5 w-5 ml-0.5" />
              </div>
              <div className="mt-3">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">Continue</span>
                <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5 truncate max-w-[150px]">
                  {props.currentNotebook.metadata.name}
                </span>
              </div>
            </button>

            <button
              type="button"
              className="home-action-card flex flex-col items-center justify-center min-h-[136px] p-5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-rose-500/50 rounded-2xl text-center anim-fade-in delay-4 group shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={props.onSaveCurrentLocal}
            >
              <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-white/[0.04] group-hover:bg-rose-500/15 group-hover:scale-105 text-[var(--text-secondary)] group-hover:text-rose-400 transition-all duration-200">
                <HardDriveDownload className="h-5 w-5" />
              </div>
              <div className="mt-3">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">Export</span>
                <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5">Save copy to disk</span>
              </div>
            </button>
          </section>

          {/* Recent Notebooks Section (Opaque Elevated Cards) */}
          <section className="mt-4 anim-fade-in delay-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border-subtle)]">
              <h2 className="text-xs font-bold tracking-wider text-[var(--text-secondary)] uppercase">
                {recent.length > 0 ? 'Recent Workspaces' : 'Saved Workspaces'}
              </h2>
            </div>

            {primaryList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-secondary)] shadow-md">
                No saved notebooks yet. Click <strong>New Notebook</strong> above to start coding!
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {primaryList.map((notebook) => (
                  <div
                    key={notebook.id}
                    className="group flex items-center justify-between p-3 pl-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-indigo-500/50 hover:bg-[var(--bg-surface-hover)] transition-all relative overflow-hidden shadow-md"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3.5 text-left cursor-pointer"
                      onClick={() => props.onOpenNotebook(notebook.id)}
                    >
                      <div className="p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] group-hover:border-indigo-500/30 transition-colors">
                        <NotebookTabs className="h-4 w-4 text-[var(--text-secondary)] group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <span className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between pr-4">
                        <span className="truncate text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          {notebook.name}
                          {notebook.language && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                              {notebook.language === 'cpp' ? 'C++' : notebook.language}
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] mt-1 sm:mt-0">
                          <Clock3 className="h-3 w-3" />
                          {formatUpdated(notebook.updatedAt)}
                        </span>
                      </span>
                    </button>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pr-2">
                      <IconButton
                        icon={<Play className="h-3.5 w-3.5" />}
                        label={`Open ${notebook.name}`}
                        onClick={() => props.onOpenNotebook(notebook.id)}
                      />
                      <IconButton
                        icon={<Edit3 className="h-3.5 w-3.5" />}
                        label={`Rename ${notebook.name}`}
                        onClick={() => props.onRenameNotebook(notebook.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
