import {
  Bot,
  Braces,
  ChevronDown,
  Download,
  FileInput,
  FilePlus2,
  FolderOpen,
  Home,
  HardDriveDownload,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  SaveAll,
  Settings,
  Square,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { AppTheme, KernelState } from '../types/notebook';
import { IconButton } from './IconButton';

interface ToolbarProps {
  notebookName: string;
  notebookLanguage?: string;
  kernel: KernelState;
  dirty: boolean;
  saving: boolean;
  running: boolean;
  minimap: boolean;
  theme: AppTheme;
  variableInspectorEnabled: boolean;
  inspectorOpen: boolean;
  expanded: boolean;
  fullscreen: boolean;
  onNew: () => void;
  onHome: () => void;
  onOpenPalette: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSaveLocal: () => void;
  onRename?: () => void;
  onImport: (file: File) => void;
  onExportCpp: () => void;
  onExportPdf: () => void;
  onExportNotebook: () => void;
  onRunCell?: () => void;
  onRunAll: () => void;
  onStop: () => void;
  onRestart: () => void;
  onClearOutputs: () => void;
  onToggleMinimap: () => void;
  onToggleInspector: () => void;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const newRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const toolchainLabel = props.kernel.toolchain?.available
    ? `${props.kernel.toolchain.name ?? 'Compiler'} ${props.kernel.toolchain.version ?? ''}`.trim()
    : props.kernel.toolchain?.error ?? 'Compiler unavailable';

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!newRef.current?.contains(event.target as Node)) {
        setNewOpen(false);
      }
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
      if (!exportRef.current?.contains(event.target as Node)) {
        setExportOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const menuAction = (action: () => void) => {
    setNewOpen(false);
    setMoreOpen(false);
    setExportOpen(false);
    action();
  };

  return (
    <header className="toolbar-shell toolbar-glass toolbar-expanded">
      {/* Left side: Classy tool actions */}
      <div className="toolbar-actions flex items-center gap-1 shrink-0">
        <IconButton icon={<Home className="h-4 w-4" />} label="Home" onClick={props.onHome} />
        <span className="mx-1 h-4 w-px bg-white/10" />
        
        {/* New with hover/click options including Open Local */}
        <div
          ref={newRef}
          className="toolbar-more"
          onMouseEnter={() => setNewOpen(true)}
          onMouseLeave={() => setNewOpen(false)}
        >
          <IconButton
            icon={<FilePlus2 className="h-4 w-4" />}
            label="New"
            active={newOpen}
            onClick={props.onNew}
            showLabel
          />
          {newOpen ? (
            <div className="toolbar-menu">
              <button type="button" onClick={() => menuAction(props.onNew)}>
                <FilePlus2 className="h-4 w-4" />
                New notebook
              </button>
              <button type="button" onClick={() => menuAction(() => fileInputRef.current?.click())}>
                <FolderOpen className="h-4 w-4" />
                Open local file
              </button>
            </div>
          ) : null}
        </div>

        <IconButton icon={<Save className="h-4 w-4" />} label="Save" onClick={props.onSave} disabled={props.saving} showLabel />
        
        <div ref={exportRef} className="toolbar-more">
          <IconButton
            icon={<Download className="h-4 w-4" />}
            label="Export"
            active={exportOpen}
            onMouseEnter={() => setExportOpen(true)}
            onClick={() => setExportOpen((open) => !open)}
            showLabel
          />
          {exportOpen ? (
            <div className="toolbar-menu">
              <button type="button" onClick={() => menuAction(props.onExportCpp)}>
                <Download className="h-4 w-4" />
                C++ source
              </button>
              <button type="button" onClick={() => menuAction(props.onExportNotebook)}>
                <Download className="h-4 w-4" />
                Notebook .cppnb
              </button>
              <button type="button" onClick={() => menuAction(props.onExportPdf)}>
                <Download className="h-4 w-4" />
                PDF with outputs
              </button>
            </div>
          ) : null}
        </div>

        <span className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />
        <IconButton icon={<Settings className="h-4 w-4" />} label="Settings" onClick={props.onOpenSettings} showLabel />
        
        <div ref={moreRef} className="toolbar-more">
          <IconButton
            icon={<ChevronDown className="h-4 w-4" />}
            label="More"
            active={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
            showLabel
          />
          {moreOpen ? (
            <div className="toolbar-menu">
              <button type="button" onClick={() => menuAction(props.onOpenPalette)}>
                <FileInput className="h-4 w-4" />
                Open saved notebook
              </button>
              <button type="button" onClick={() => menuAction(() => props.onSaveAs())}>
                <SaveAll className="h-4 w-4" />
                Save as
              </button>
              <button type="button" onClick={() => menuAction(props.onSaveLocal)}>
                <HardDriveDownload className="h-4 w-4" />
                Save local copy
              </button>
              <button type="button" onClick={() => menuAction(props.onRestart)}>
                <RotateCcw className="h-4 w-4" />
                Restart kernel
              </button>
              <button type="button" onClick={() => menuAction(props.onClearOutputs)}>
                <Trash2 className="h-4 w-4" />
                Clear outputs
              </button>
              <button type="button" disabled={!props.variableInspectorEnabled} onClick={() => menuAction(props.onToggleInspector)}>
                <Bot className="h-4 w-4" />
                {props.inspectorOpen ? 'Hide inspector' : 'Variable inspector'}
              </button>
              <button type="button" onClick={() => menuAction(props.onToggleMinimap)}>
                <Braces className="h-4 w-4" />
                {props.minimap ? 'Hide minimap' : 'Show minimap'}
              </button>
              <button type="button" onClick={() => menuAction(props.onToggleFullscreen)}>
                {props.fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                {props.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Center: Clean text-only CODEBOOK brand */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <button
          type="button"
          className="group transition-opacity hover:opacity-80 focus:outline-none cursor-pointer"
          onClick={props.onOpenPalette}
          title="Command Palette (Shift+K / CODEBOOK)"
        >
          <span className="text-[13px] font-bold tracking-[0.25em] text-[var(--text-primary)] select-none">
            CODEBOOK
          </span>
        </button>
      </div>

      {/* Right side: Execution actions and compiler info */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <IconButton icon={<Braces className="h-4 w-4 text-signal-blue" />} label="Run all" onClick={props.onRunAll} disabled={props.running} showLabel />
        <IconButton icon={<Square className="h-4 w-4 text-rose-400" />} label="Stop" onClick={props.onStop} disabled={!props.running} showLabel />
        <span className="mx-1 h-4 w-px bg-[var(--border-subtle)]" />
        
        {props.notebookLanguage && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            {props.notebookLanguage === 'cpp' ? 'C++' : props.notebookLanguage}
          </span>
        )}

        <div className="hidden max-w-48 truncate text-xs text-[var(--text-secondary)] select-none xl:block" title={toolchainLabel}>
          {toolchainLabel}
        </div>
      </div>

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept=".cpp,.cc,.cxx,.hpp,.h,.cppnb"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) props.onImport(file);
          event.target.value = '';
        }}
      />
    </header>
  );
}
