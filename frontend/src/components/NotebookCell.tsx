import { useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';

import type { CellStatus, ExecutionDiagnostic, InteractiveTerminalState, NotebookCell as NotebookCellType } from '../types/notebook';
import { configureMonaco } from '../utils/monaco';
import { CellActionButton } from './CellActionButton';
import { OutputPanel } from './OutputPanel';
import { StatusPill } from './StatusPill';

interface NotebookCellProps {
  cell: NotebookCellType;
  index: number;
  selected: boolean;
  minimap: boolean;
  theme: string;
  running: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  aiEnabled?: boolean;
  smoothCaret?: boolean;
  stdin: string;
  readsStdin?: boolean;
  inputPrompt?: string;
  terminal?: InteractiveTerminalState;
  terminalInput?: string;
  onSelect: () => void;
  onChange: (source: string) => void;
  onStdinChange: (value: string) => void;
  onSubmitStdin: () => void;
  onTerminalInputChange?: (value: string) => void;
  onTerminalInputSubmit?: () => void;
  onTerminalInterrupt?: () => void;
  onRun: () => void;
  onAddCode: () => void;
  onAddMarkdown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClearOutput: () => void;
  onToggleType: () => void;
  onEnhanceWithAi: () => void;
  onEditMarkdown: () => void;
  onDiagnosticClick: (diagnostic: ExecutionDiagnostic) => void;
}

function statusLabel(status: CellStatus): string {
  if (status === 'idle') return 'Idle';
  return status[0].toUpperCase() + status.slice(1);
}

function stopClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export function NotebookCell(props: NotebookCellProps) {
  const isMarkdownRendered =
    props.cell.type === 'markdown' && props.cell.outputs.some((output) => output.type === 'markdown');
  const editorHeight = Math.min(
    520,
    Math.max(props.cell.type === 'markdown' ? 130 : 150, props.cell.source.split('\n').length * 22 + 48),
  );
  const language = props.cell.type === 'markdown' ? 'markdown' : 'cpp';

  const onRunRef = useRef(props.onRun);
  onRunRef.current = props.onRun;
  const onSelectRef = useRef(props.onSelect);
  onSelectRef.current = props.onSelect;

  const handleMount: OnMount = (editor, monaco) => {
    configureMonaco(monaco);
    editor.addAction({
      id: 'run-current-cell',
      label: 'Run Cell',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => {
        onSelectRef.current();
        onRunRef.current();
      },
    });
    editor.onDidFocusEditorWidget(() => {
      onSelectRef.current();
    });
    editor.onDidFocusEditorText(() => {
      onSelectRef.current();
    });
    editor.onMouseDown(() => {
      onSelectRef.current();
    });
    editor.onDidChangeCursorPosition(() => {
      onSelectRef.current();
    });
  };

  return (
    <article
      className={`relative flex flex-col rounded-2xl transition-all duration-200 overflow-hidden ${
        props.selected
          ? 'border border-[var(--border-strong)] shadow-[0_8px_32px_rgba(0,0,0,0.36)] bg-[var(--bg-surface)] backdrop-blur-2xl z-10'
          : 'border border-[var(--border-subtle)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)] backdrop-blur-xl z-0'
      }`}
      onClick={props.onSelect}
      onMouseDown={props.onSelect}
      onFocus={props.onSelect}
    >
      {/* Seamless header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-transparent px-4 pt-3 pb-1.5">
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-white/[0.05] px-1.5 font-mono text-[11px] text-[var(--text-primary)]">
            {props.cell.executionCount ? props.cell.executionCount : props.index + 1}
          </span>
          <span className="font-semibold uppercase text-[10px] tracking-wider text-[var(--text-secondary)]">
            {props.cell.type === 'code' ? 'C++ Cell' : 'Markdown'}
          </span>
          <StatusPill status={props.cell.status} label={statusLabel(props.cell.status)} />
          <span className="text-[11px] font-mono text-[var(--text-secondary)] opacity-80">
            {props.cell.executionTime ? `${props.cell.executionTime.toFixed(3)}s` : statusLabel(props.cell.status)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1">
          <CellActionButton
            icon={props.cell.type === 'code' ? <Play className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            label={props.cell.type === 'code' ? 'Run cell (Shift+Enter)' : 'Render markdown'}
            onClick={props.onRun}
            disabled={props.running}
          />
          {isMarkdownRendered ? (
            <CellActionButton icon={<Pencil className="h-3.5 w-3.5" />} label="Edit markdown" onClick={props.onEditMarkdown} />
          ) : null}
          <CellActionButton
            icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
            label={props.cell.type === 'code' ? 'Convert to Markdown' : 'Convert to C++ Code'}
            onClick={props.onToggleType}
          />
          <span className="mx-1 h-3.5 w-px bg-white/10" />
          <CellActionButton icon={<ChevronUp className="h-3.5 w-3.5" />} label="Move cell up" onClick={props.onMoveUp} disabled={!props.canMoveUp} />
          <CellActionButton icon={<ChevronDown className="h-3.5 w-3.5" />} label="Move cell down" onClick={props.onMoveDown} disabled={!props.canMoveDown} />
          <span className="mx-1 h-3.5 w-px bg-white/10" />
          <CellActionButton icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate cell" onClick={props.onDuplicate} />
          <CellActionButton icon={<XCircle className="h-3.5 w-3.5" />} label="Clear output" onClick={props.onClearOutput} />
          <CellActionButton icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete cell" onClick={props.onDelete} />
          <span className="mx-1 h-3.5 w-px bg-white/10" />
          <CellActionButton
            label="Enhance"
            variant="ai"
            onClick={props.onEnhanceWithAi}
            disabled={props.running || !props.aiEnabled}
          />
        </div>
      </div>

      <div className="grid gap-0 bg-transparent">
        {!isMarkdownRendered ? (
          <Editor
            key={props.cell.id}
            height={editorHeight}
            language={language}
            theme={props.theme}
            value={props.cell.source}
            beforeMount={configureMonaco}
            onMount={handleMount}
            onChange={(value) => props.onChange(value ?? '')}
            options={{
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              folding: true,
              fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
              fontSize: 13,
              lineHeight: 22,
              lineNumbers: 'on',
              minimap: { enabled: props.minimap },
              padding: { top: 10, bottom: 10 },
              scrollBeyondLastLine: false,
              scrollbar: {
                alwaysConsumeMouseWheel: false,
              },
              tabSize: 4,
              wordWrap: 'on',
              renderLineHighlight: 'all',
              cursorSmoothCaretAnimation: props.smoothCaret ? 'on' : 'off',
            }}
          />
        ) : null}
      </div>

      <OutputPanel
        outputs={props.cell.outputs}
        stdin={props.stdin}
        readsStdin={props.readsStdin}
        inputPrompt={props.inputPrompt}
        terminal={props.terminal}
        terminalInput={props.terminalInput}
        onStdinChange={props.onStdinChange}
        onSubmitStdin={props.onSubmitStdin}
        onTerminalInputChange={props.onTerminalInputChange}
        onTerminalInputSubmit={props.onTerminalInputSubmit}
        onTerminalInterrupt={props.onTerminalInterrupt}
        onDiagnosticClick={props.onDiagnosticClick}
      />

      <div className="flex items-center justify-center gap-2 bg-transparent px-4 pb-2.5 pt-1 transition-opacity">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase bg-white/[0.03] hover:bg-white/[0.08] hover:text-white rounded-md transition-all"
          onClick={(event) => {
            stopClick(event);
            props.onAddCode();
          }}
        >
          <Plus className="h-3 w-3" />
          Code
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase bg-white/[0.03] hover:bg-white/[0.08] hover:text-white rounded-md transition-all"
          onClick={(event) => {
            stopClick(event);
            props.onAddMarkdown();
          }}
        >
          <Plus className="h-3 w-3" />
          Markdown
        </button>
      </div>
    </article>
  );
}
