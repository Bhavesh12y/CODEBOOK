import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Keyboard, Loader2, Play, Square, Terminal, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import type { CellOutput, ExecutionDiagnostic, InteractiveTerminalState, TerminalLine } from '../types/notebook';

interface OutputPanelProps {
  outputs: CellOutput[];
  stdin?: string;
  readsStdin?: boolean;
  inputPrompt?: string;
  terminal?: InteractiveTerminalState;
  terminalInput?: string;
  onStdinChange?: (value: string) => void;
  onSubmitStdin?: () => void;
  onTerminalInputChange?: (value: string) => void;
  onTerminalInputSubmit?: () => void;
  onTerminalInterrupt?: () => void;
  onDiagnosticClick: (diagnostic: ExecutionDiagnostic) => void;
}

function TerminalOutput({ lines }: { lines: TerminalLine[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (lines.length === 0) return null;

  return (
    <div className="terminal-lines-container max-h-80 overflow-auto px-3 pb-2 font-mono text-[13px] leading-5">
      {lines.map((line, i) => {
        if (line.stream === 'system') {
          return (
            <span key={i} className="text-[var(--text-secondary)] italic">
              {line.text}
            </span>
          );
        }
        if (line.stream === 'stderr') {
          return (
            <span key={i} className="text-amber-500 dark:text-amber-400 whitespace-pre-wrap">
              {line.text}
            </span>
          );
        }
        if (line.stream === 'stdin') {
          return (
            <span key={i} className="text-sky-500 dark:text-sky-400 whitespace-pre-wrap font-medium">
              {'> '}{line.text}
            </span>
          );
        }
        // stdout
        return (
          <span key={i} className="text-[var(--text-primary)] whitespace-pre-wrap">
            {line.text}
          </span>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export function OutputPanel({
  outputs,
  stdin = '',
  readsStdin = false,
  inputPrompt = 'stdin>',
  terminal,
  terminalInput = '',
  onStdinChange,
  onSubmitStdin,
  onTerminalInputChange,
  onTerminalInputSubmit,
  onTerminalInterrupt,
  onDiagnosticClick,
}: OutputPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when process starts running
  useEffect(() => {
    if (terminal?.status === 'running') {
      inputRef.current?.focus();
    }
  }, [terminal?.status]);

  if (outputs.length === 0 && !terminal) return null;

  const isCompiling = terminal?.status === 'compiling';
  const isRunning = terminal?.status === 'running';
  const isFinished = terminal?.status === 'exited' || terminal?.status === 'error';

  const statusColor =
    terminal?.status === 'exited'
      ? 'text-emerald-500 dark:text-emerald-400'
      : terminal?.status === 'error'
      ? 'text-red-500 dark:text-red-400'
      : terminal?.status === 'running'
      ? 'text-sky-500 dark:text-sky-400'
      : 'text-amber-500 dark:text-amber-400';

  const statusLabel =
    terminal?.status === 'compiling'
      ? 'Compiling...'
      : terminal?.status === 'running'
      ? 'Running'
      : terminal?.status === 'exited'
      ? 'Exited'
      : 'Error';

  const batchInputPrompt = (prompt: string) => (
    <div className="output-input-request px-3 pb-3">
      <label className="terminal-input-line">
        <code>{prompt}</code>
        <textarea
          value={stdin}
          onChange={(event) => onStdinChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && stdin.trim()) {
              event.preventDefault();
              onSubmitStdin?.();
            }
          }}
          placeholder={'type stdin here; loops can use: 10 20 30 x'}
          rows={Math.max(1, Math.min(5, stdin.split('\n').length))}
          autoFocus
        />
      </label>
      <button type="button" onClick={onSubmitStdin} disabled={!stdin.trim()}>
        <Play className="h-3.5 w-3.5" />
        Run with input
      </button>
    </div>
  );

  return (
    <div className="output-panel-cool bg-transparent px-1">
      {/* Interactive Terminal */}
      {terminal ? (
        <section className="last:border-b-0">
          {/* Header bar */}
          <div className="flex h-8 items-center gap-2 px-3 text-xs uppercase tracking-wide text-[var(--text-secondary)] select-none">
            <Terminal className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
            <span className="font-medium">Interactive Console</span>

            {/* Status pill */}
            <span className={`ml-1 flex items-center gap-1 font-mono normal-case ${statusColor}`}>
              {isCompiling && <Loader2 className="h-3 w-3 animate-spin" />}
              {isRunning && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                </span>
              )}
              {isFinished && terminal.exitCode === 0 && <CheckCircle2 className="h-3 w-3" />}
              {isFinished && terminal.exitCode !== 0 && <XCircle className="h-3 w-3" />}
              {statusLabel}
              {isFinished && terminal.exitCode !== null && terminal.exitCode !== undefined && (
                <span className="text-[var(--text-secondary)] normal-case">
                  &nbsp;(code {terminal.exitCode}
                  {terminal.elapsed ? `, ${terminal.elapsed.toFixed(2)}s` : ''})
                </span>
              )}
            </span>

            {/* Interrupt button - only when running */}
            {isRunning && (
              <button
                type="button"
                title="Send interrupt (Ctrl+C)"
                onClick={onTerminalInterrupt}
                className="ml-auto flex items-center gap-1 rounded bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400 normal-case tracking-normal transition-colors"
              >
                <Square className="h-2.5 w-2.5" />
                Interrupt
              </button>
            )}
          </div>

          {/* Output area - interleaved stdout + stderr + stdin echo */}
          <TerminalOutput lines={terminal.lines} />

          {/* Input bar - visible while running or compiling */}
          {(isRunning || isCompiling) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-transparent">
              <span className="text-[var(--text-secondary)] font-mono text-[13px] select-none">$</span>
              <input
                ref={inputRef}
                type="text"
                value={terminalInput}
                onChange={(event) => onTerminalInputChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onTerminalInputSubmit?.();
                  }
                }}
                disabled={isCompiling}
                placeholder={isCompiling ? 'Compiling, please wait...' : 'Type input and press Enter'}
                className="flex-1 bg-transparent font-mono text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] disabled:opacity-40"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={onTerminalInputSubmit}
                disabled={isCompiling || !terminalInput.trim()}
                className="rounded bg-white/[0.05] hover:bg-white/[0.1] px-2 py-0.5 text-[11px] text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
              >
                Send
              </button>
            </div>
          )}
        </section>
      ) : null}

      {/* Batch Outputs (non-interactive cells) */}
      {outputs.map((output, index) => {
        const Icon =
          output.type === 'stdout'
            ? Terminal
            : output.type === 'stderr' || output.type === 'error'
            ? AlertTriangle
            : output.type === 'input'
            ? Keyboard
            : CheckCircle2;
        const tone =
          output.type === 'stdout'
            ? 'text-[var(--text-secondary)]'
            : output.type === 'stderr'
            ? 'text-amber-500 dark:text-signal-amber'
            : output.type === 'input'
            ? 'text-indigo-500 dark:text-signal-blue'
            : output.type === 'markdown'
            ? 'text-indigo-500 dark:text-signal-blue'
            : 'text-red-500 dark:text-signal-red';
        if (output.type === 'markdown') {
          return (
            <section key={`${output.type}-${index}`} className="last:border-b-0">
              <div className="markdown-preview max-h-72 overflow-auto px-4 py-2.5 text-sm">
                <ReactMarkdown>{output.text}</ReactMarkdown>
              </div>
            </section>
          );
        }

        return (
          <section key={`${output.type}-${index}`} className="last:border-b-0">
            <div className="flex h-7 items-center gap-2 px-3 text-xs uppercase tracking-wide text-slate-500 font-medium">
              <Icon className={`h-3.5 w-3.5 ${tone}`} />
              {output.type}
            </div>
            {output.type === 'input' ? (
              batchInputPrompt(output.text)
            ) : (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap px-3 pb-2 font-mono text-[13px] leading-5 text-[var(--text-primary)]">
                {output.text}
              </pre>
            )}
            {output.diagnostics && output.diagnostics.length > 0 ? (
              <div className="space-y-1 px-3 py-2">
                {output.diagnostics.map((diagnostic) => (
                  <button
                    key={`${diagnostic.cellId}-${diagnostic.line}-${diagnostic.column}-${diagnostic.message}`}
                    type="button"
                    className="block w-full truncate rounded bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-left text-xs text-amber-300 transition"
                    onClick={() => onDiagnosticClick(diagnostic)}
                  >
                    {diagnostic.cellId ?? 'main'}:{diagnostic.line ?? '?'} {diagnostic.message}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}