/// <reference types="vite/client" />
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

import { CommandPalette, type PaletteCommand } from '../components/CommandPalette';
import { HomePage } from '../components/HomePage';
import { NewNotebookDialog } from '../components/NewNotebookDialog';
import { SettingsPanel, type CppBookSettings } from '../components/SettingsPanel';
import { AIChatPanel, type ChatMessage } from '../components/AIChatPanel';
import { NotebookCell } from '../components/NotebookCell';
import { Toolbar } from '../components/Toolbar';
import { VariableInspector } from '../components/VariableInspector';
import type { AppTheme, CellType, ExecutionDiagnostic, InteractiveTerminalState, TerminalLine } from '../types/notebook';
import { useNotebookController } from '../hooks/useNotebookController';
import { api, interactiveExecutionUrl } from '../services/api';

const variableInspectorEnabled = import.meta.env.VITE_ENABLE_VARIABLE_INSPECTOR === 'true';

const defaultSettings: CppBookSettings = {
  theme: 'midnight',
  aiEnabled: false,
  aiProvider: 'groq',
  groqModel: 'llama-3.3-70b-versatile',
  geminiModel: 'gemini-1.5-flash',
  groqApiKey: '',
  geminiApiKey: '',
  smoothCaret: true,
  toolbarCaptions: true,
  autosave: true,
  continueOnError: false,
  shortcuts: {
    save: 'Ctrl+S',
    saveAs: 'Ctrl+Shift+S',
    runCell: 'Shift+Enter',
    newCodeCell: 'Shift+N',
    newMarkdownCell: 'Shift+M',
  },
};

function loadSettings(): CppBookSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem('cppbook.settings') ?? '{}') as Partial<CppBookSettings> & {
      aiModel?: string;
      geminiApiKeys?: string[];
    };
    const legacyGeminiKey = parsed.geminiApiKey || parsed.geminiApiKeys?.find((key) => key?.trim()) || '';
    return {
      ...defaultSettings,
      ...parsed,
      aiProvider: 'groq',
      groqModel: 'llama-3.3-70b-versatile',
      geminiModel: 'gemini-1.5-flash',
      groqApiKey: parsed.groqApiKey ?? '',
      geminiApiKey: legacyGeminiKey,
      shortcuts: { ...defaultSettings.shortcuts, ...(parsed.shortcuts ?? {}) },
    };
  } catch {
    return defaultSettings;
  }
}

function monacoTheme(theme: AppTheme): string {
  return theme === 'daylight' ? 'cppbook-daylight' : `cppbook-${theme}`;
}

function sourceReadsStdin(source: string): boolean {
  return /\b(?:std::)?cin\b|\b(?:std::)?getline\s*\(|\bscanf\s*\(|\bfgets\s*\(|\bgetchar\s*\(/.test(source);
}

function promptFromSource(source: string): string {
  const promptMatch = source.match(/(?:std::)?cout\s*<<\s*["'`]([^"'`]{1,120})["'`]/);
  return promptMatch?.[1]?.trim() || 'stdin>';
}

function normalizeShortcut(value: string): string {
  return value
    .split('+')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => (part === 'control' ? 'ctrl' : part === 'return' ? 'enter' : part))
    .sort((a, b) => {
      const order = ['ctrl', 'shift', 'alt', 'meta'];
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    })
    .join('+');
}

function eventShortcut(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  if (!['control', 'shift', 'alt', 'meta'].includes(key)) parts.push(key === 'return' ? 'enter' : key);
  return normalizeShortcut(parts.join('+'));
}

export function App() {
  const { state, selectedCell, dispatch, actions } = useNotebookController();
  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const actionsRef = useRef(actions);
  const selectedCellIdRef = useRef(state.selectedCellId);
  const paletteOpenRef = useRef(state.paletteOpen);
  const cellInputsRef = useRef<Record<string, string>>({});
  const notebookCellsRef = useRef(state.notebook.cells);
  const [newNotebookOpen, setNewNotebookOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettingsState] = useState<CppBookSettings>(() => loadSettings());
  const [cellInputs, setCellInputs] = useState<Record<string, string>>({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiDraft, setAiDraft] = useState('');
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('cppbook.ai_panel_width'));
      if (saved && saved >= 280 && saved <= 1200) return saved;
    } catch {
      // ignore
    }
    return 380;
  });
  const [terminalInputs, setTerminalInputs] = useState<Record<string, string>>({});
  const [terminals, setTerminals] = useState<Record<string, InteractiveTerminalState>>({});
  const terminalSocketsRef = useRef<Record<string, WebSocket>>({});
  const terminalBuffersRef = useRef<Record<string, { lines: TerminalLine[]; timer: number | null }>>({});

  const selectedCellId = state.selectedCellId;
  const running = Boolean(state.runningCellId);

  const setSettings = (next: CppBookSettings) => {
    setSettingsState(next);
    localStorage.setItem('cppbook.settings', JSON.stringify(next));
    dispatch({ type: 'SET_THEME', theme: next.theme });
    dispatch({ type: 'SET_CONTINUE_ON_ERROR', value: next.continueOnError });
    document.documentElement.dataset.smoothCaret = next.smoothCaret ? 'true' : 'false';
    document.documentElement.dataset.theme = next.theme;
  };

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    if (settings.theme === 'daylight') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings.theme]);

  const requestInputForCell = (cellId: string) => {
    dispatch({
      type: 'SET_CELL_OUTPUT',
      cellId,
      outputs: [
        {
          type: 'input',
          text: promptFromSource(state.notebook.cells.find((cell) => cell.id === cellId)?.source ?? ''),
        },
      ],
    });
    dispatch({ type: 'SET_CELL_STATUS', cellId, status: 'idle', executionTime: null });
    dispatch({ type: 'SELECT_CELL', cellId });
    dispatch({ type: 'SET_STATUS_TEXT', text: 'Waiting for input' });
  };

  const appendTerminalText = (cellId: string, stream: 'stdout' | 'stderr' | 'stdin', text: string) => {
    const buffer = terminalBuffersRef.current[cellId] ?? { lines: [], timer: null };
    buffer.lines.push({ stream, text });
    terminalBuffersRef.current[cellId] = buffer;
    if (buffer.timer !== null) return;
    buffer.timer = window.setTimeout(() => {
      const pending = terminalBuffersRef.current[cellId];
      if (!pending) return;
      const newLines = pending.lines.slice();
      pending.lines = [];
      pending.timer = null;
      if (newLines.length === 0) return;
      setTerminals((current) => {
        const previous = current[cellId] ?? { status: 'running', lines: [], stdout: '', stderr: '' };
        // Cap to last 2000 lines to prevent memory issues
        const combined = [...previous.lines, ...newLines];
        const capped = combined.length > 2000 ? combined.slice(-2000) : combined;
        return {
          ...current,
          [cellId]: {
            ...previous,
            status: previous.status === 'compiling' ? 'running' : previous.status,
            lines: capped,
          },
        };
      });
    }, 30);
  };

  const flushTerminalText = (cellId: string) => {
    const pending = terminalBuffersRef.current[cellId];
    if (!pending) return;
    if (pending.timer !== null) {
      window.clearTimeout(pending.timer);
      pending.timer = null;
    }
    const newLines = pending.lines.slice();
    pending.lines = [];
    if (newLines.length === 0) return;
    setTerminals((current) => {
      const previous = current[cellId] ?? { status: 'running', lines: [], stdout: '', stderr: '' };
      const combined = [...previous.lines, ...newLines];
      const capped = combined.length > 2000 ? combined.slice(-2000) : combined;
      return {
        ...current,
        [cellId]: {
          ...previous,
          status: previous.status === 'compiling' ? 'running' : previous.status,
          lines: capped,
        },
      };
    });
  };

  const startInteractiveCell = (cellId: string) => {
    const cell = state.notebook.cells.find((item) => item.id === cellId);
    if (!cell) return;
    terminalSocketsRef.current[cellId]?.close();
    dispatch({ type: 'SELECT_CELL', cellId });
    dispatch({ type: 'SET_CELL_STATUS', cellId, status: 'running' });
    dispatch({ type: 'SET_RUNNING', cellId });
    dispatch({ type: 'SET_STATUS_TEXT', text: `Running interactive cell ${state.notebook.cells.findIndex((item) => item.id === cellId) + 1}` });
    // Clear any stale batch outputs from previous runs so only the terminal is shown
    dispatch({ type: 'CLEAR_OUTPUTS', cellId });
    // Reset terminal state with empty lines array
    setTerminals((current) => ({
      ...current,
      [cellId]: { status: 'compiling', lines: [], stdout: '', stderr: '', exitCode: null, elapsed: null },
    }));
    // Reset buffer
    terminalBuffersRef.current[cellId] = { lines: [], timer: null };
    const socket = new WebSocket(interactiveExecutionUrl());
    terminalSocketsRef.current[cellId] = socket;
    const openTimeout = window.setTimeout(() => {
      if (socket.readyState === WebSocket.CONNECTING) {
        appendTerminalText(cellId, 'stderr', 'Interactive terminal could not connect to the backend.\n');
        socket.close();
        dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
        dispatch({ type: 'SET_CELL_STATUS', cellId, status: 'error' });
        setTerminals((current) => ({
          ...current,
          [cellId]: { ...(current[cellId] ?? { lines: [], stdout: '', stderr: '' }), status: 'error' },
        }));
      }
    }, 4000);
    socket.addEventListener('open', () => {
      window.clearTimeout(openTimeout);
      socket.send(
        JSON.stringify({
          notebookId: state.notebook.id ?? 'unsaved',
          cellId,
          code: cell.source,
          cells: state.notebook.cells.map((item) => ({ id: item.id, type: item.type, source: item.source })),
        }),
      );
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data) as {
        type: 'status' | 'stdout' | 'stderr' | 'error' | 'exit';
        status?: InteractiveTerminalState['status'];
        text?: string;
        code?: number | null;
        elapsed?: number | null;
      };
      if (message.type === 'status') {
        setTerminals((current) => ({
          ...current,
          [cellId]: { ...(current[cellId] ?? { lines: [], stdout: '', stderr: '' }), status: message.status ?? 'running' },
        }));
      } else if (message.type === 'stdout' || message.type === 'stderr') {
        appendTerminalText(cellId, message.type, message.text ?? '');
      } else if (message.type === 'error') {
        appendTerminalText(cellId, 'stderr', message.text ?? 'Interactive execution failed.');
        setTerminals((current) => ({
          ...current,
          [cellId]: { ...(current[cellId] ?? { lines: [], stdout: '', stderr: '' }), status: 'error' },
        }));
      } else if (message.type === 'exit') {
        flushTerminalText(cellId);
        setTerminals((current) => ({
          ...current,
          [cellId]: {
            ...(current[cellId] ?? { lines: [], stdout: '', stderr: '' }),
            status: message.code === 0 ? 'exited' : 'error',
            exitCode: message.code ?? null,
            elapsed: message.elapsed ?? null,
          },
        }));
        dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
        dispatch({ type: 'SET_CELL_STATUS', cellId, status: message.code === 0 ? 'success' : 'error', executionTime: message.elapsed ?? null });
        dispatch({ type: 'SET_STATUS_TEXT', text: message.code === 0 ? 'Ready' : `Interactive cell exited with ${message.code ?? 'error'}` });
        terminalSocketsRef.current[cellId]?.close();
        delete terminalSocketsRef.current[cellId];
        delete terminalBuffersRef.current[cellId];
      }
    });
    socket.addEventListener('error', () => {
      window.clearTimeout(openTimeout);
      appendTerminalText(cellId, 'stderr', 'Interactive terminal connection failed.\n');
      dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
      dispatch({ type: 'SET_CELL_STATUS', cellId, status: 'error' });
      setTerminals((current) => ({
        ...current,
        [cellId]: { ...(current[cellId] ?? { lines: [], stdout: '', stderr: '' }), status: 'error' },
      }));
    });
  };

  const interruptCell = (cellId: string) => {
    const socket = terminalSocketsRef.current[cellId];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'interrupt' }));
    }
  };

  const sendTerminalInput = (cellId: string, value?: string) => {
    const text = (value ?? terminalInputs[cellId] ?? '').trimEnd();
    const socket = terminalSocketsRef.current[cellId];
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'stdin', text }));
    // Echo what the user typed so it's visible in the terminal with distinct stdin styling
    appendTerminalText(cellId, 'stdin', text + '\n');
    setTerminalInputs((current) => ({ ...current, [cellId]: '' }));
  };

  const runCellFromUi = (cellId: string, selectNext = false, insertBelow = false) => {
    const cell = state.notebook.cells.find((item) => item.id === cellId);
    const input = cellInputs[cellId] ?? '';
    if (cell?.type === 'code' && sourceReadsStdin(cell.source)) {
      startInteractiveCell(cellId);
      return;
    }
    void actions.runCell(cellId, selectNext, insertBelow, input);
  };

  const runAllFromUi = () => {
    const input = stdinForAll();
    const waitingCell = state.notebook.cells.find(
      (cell) => cell.type === 'code' && sourceReadsStdin(cell.source),
    );
    if (waitingCell) {
      startInteractiveCell(waitingCell.id);
      return;
    }
    void actions.runAll(input);
  };

  const stopExecution = () => {
    Object.values(terminalSocketsRef.current).forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'interrupt' }));
      }
      socket.close();
    });
    terminalSocketsRef.current = {};
    void actions.interrupt();
  };

  useEffect(() => {
    actionsRef.current = actions;
    selectedCellIdRef.current = state.selectedCellId;
    paletteOpenRef.current = state.paletteOpen;
    cellInputsRef.current = cellInputs;
    notebookCellsRef.current = state.notebook.cells;
  });

  useEffect(() => {
    dispatch({ type: 'SET_THEME', theme: settings.theme });
    dispatch({ type: 'SET_CONTINUE_ON_ERROR', value: settings.continueOnError });
    document.documentElement.dataset.smoothCaret = settings.smoothCaret ? 'true' : 'false';
    document.documentElement.dataset.platform = window.cppbook?.platform || 'web';
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;
      const shortcut = eventShortcut(event);
      if (shortcut === normalizeShortcut(settings.shortcuts.saveAs)) {
        event.preventDefault();
        void actionsRef.current.saveAsNotebook();
        return;
      }
      if (shortcut === normalizeShortcut(settings.shortcuts.save)) {
        event.preventDefault();
        void actionsRef.current.saveNotebook();
        return;
      }
      if (shortcut === normalizeShortcut(settings.shortcuts.runCell)) {
        event.preventDefault();
        const cellId = selectedCellIdRef.current;
        if (!cellId) return;
        runCellFromUi(cellId);
        return;
      }
      if (!isTextInput && shortcut === normalizeShortcut(settings.shortcuts.newCodeCell)) {
        event.preventDefault();
        dispatch({ type: 'ADD_CELL', cellType: 'code', afterId: selectedCellIdRef.current });
        return;
      }
      if (!isTextInput && shortcut === normalizeShortcut(settings.shortcuts.newMarkdownCell)) {
        event.preventDefault();
        dispatch({ type: 'ADD_CELL', cellType: 'markdown', afterId: selectedCellIdRef.current });
        return;
      }
      if (!isTextInput && (shortcut === 'shift+k' || shortcut === 'ctrl+k')) {
        event.preventDefault();
        dispatch({ type: 'SET_UI', paletteOpen: !paletteOpenRef.current });
        return;
      }
      if (event.key === 'Escape' && paletteOpenRef.current) {
        dispatch({ type: 'SET_UI', paletteOpen: false });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, settings.shortcuts]);

  useEffect(() => {
    const handler = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const addCell = (cellType: CellType, afterId = selectedCellId, source = '') => {
    dispatch({ type: 'ADD_CELL', cellType, afterId, source });
  };

  const notebookSource = () =>
    state.notebook.cells.map((cell, index) => `Cell ${index + 1} [${cell.type}]\n${cell.source}`).join('\n\n');

  const sendAiChat = async (message: string) => {
    if (!settings.aiEnabled) {
      setSettingsOpen(true);
      return;
    }
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message };
    const nextMessages = [...aiMessages, userMessage];
    setAiMessages(nextMessages);
    setAiOpen(true);
    setAiBusy(true);
    try {
      const response = await api.aiChat({
        notebookId: state.notebook.id ?? 'unsaved',
        cellId: selectedCellId,
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        notebookSource: notebookSource(),
        aiEnabled: settings.aiEnabled,
        aiProvider: settings.aiProvider,
        groqModel: settings.groqModel,
        geminiModel: settings.geminiModel,
        groqApiKey: settings.groqApiKey.trim(),
        geminiApiKey: settings.geminiApiKey.trim(),
      });
      setAiMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: response.message },
      ]);
      dispatch({ type: 'SET_STATUS_TEXT', text: response.status === 'ok' ? 'AI reply ready' : 'AI request failed' });
    } catch (error) {
      setAiMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: (error as Error).message },
      ]);
      dispatch({ type: 'SET_STATUS_TEXT', text: (error as Error).message });
    } finally {
      setAiBusy(false);
    }
  };

  const openEnhanceChat = (cellId: string) => {
    const cell = state.notebook.cells.find((item) => item.id === cellId);
    if (!settings.aiEnabled) {
      setSettingsOpen(true);
      return;
    }
    setAiOpen(true);
    setAiDraft(cell?.source ? `\`\`\`cpp\n${cell.source}\n\`\`\`\n` : '');
  };

  const onDiagnosticClick = (diagnostic: ExecutionDiagnostic) => {
    if (diagnostic.cellId) {
      dispatch({ type: 'SELECT_CELL', cellId: diagnostic.cellId });
      window.setTimeout(() => document.getElementById(diagnostic.cellId ?? '')?.scrollIntoView({ block: 'center' }), 0);
    }
  };

  const stdinForAll = () =>
    state.notebook.cells
      .filter((cell) => cell.type === 'code')
      .map((cell) => cellInputs[cell.id] ?? '')
      .filter((value) => value.length > 0)
      .join('\n');

  const commands: PaletteCommand[] = useMemo(
    () => [
      { id: 'run-cell', label: 'Run Cell', group: 'Run', run: () => runCellFromUi(selectedCellId), disabled: running },
      { id: 'run-all', label: 'Run All', group: 'Run', run: runAllFromUi, disabled: running },
      { id: 'stop', label: 'Stop Execution', group: 'Kernel', run: () => void actions.interrupt(), disabled: !running },
      { id: 'restart', label: 'Restart Kernel', group: 'Kernel', run: () => void actions.restartKernel() },
      { id: 'home', label: 'Go Home', group: 'View', run: () => dispatch({ type: 'SET_VIEW', view: 'home' }) },
      { id: 'new-notebook', label: 'New Notebook', group: 'File', run: () => setNewNotebookOpen(true) },
      { id: 'settings', label: 'Open Settings', group: 'View', run: () => setSettingsOpen(true) },
      { id: 'add-code', label: 'Add Code Cell', group: 'Edit', run: () => addCell('code') },
      { id: 'add-markdown', label: 'Add Markdown Cell', group: 'Edit', run: () => addCell('markdown') },
      { id: 'delete', label: 'Delete Cell', group: 'Edit', run: () => dispatch({ type: 'DELETE_CELL', cellId: selectedCellId }) },
      { id: 'move-up', label: 'Move Cell Up', group: 'Edit', run: () => dispatch({ type: 'MOVE_CELL', cellId: selectedCellId, direction: -1 }) },
      { id: 'move-down', label: 'Move Cell Down', group: 'Edit', run: () => dispatch({ type: 'MOVE_CELL', cellId: selectedCellId, direction: 1 }) },
      { id: 'save', label: 'Save Notebook', group: 'File', run: () => void actions.saveNotebook() },
      { id: 'save-as', label: 'Save As', group: 'File', run: () => void actions.saveAsNotebook() },
      { id: 'save-local', label: 'Save Notebook To Local File', group: 'File', run: () => void actions.saveNotebookToLocal() },
      { id: 'open-local', label: 'Open Local File', group: 'File', run: () => localFileInputRef.current?.click() },
      { id: 'rename', label: 'Rename Notebook', group: 'File', run: () => void actions.renameNotebook() },
      { id: 'export', label: 'Export C++', group: 'File', run: () => void actions.exportCpp() },
      { id: 'export-pdf', label: 'Export PDF', group: 'File', run: () => void actions.exportPdf() },
      { id: 'export-cppnb', label: 'Export Notebook (.cppnb)', group: 'File', run: () => void actions.exportNotebookFile() },
      { id: 'clear', label: 'Clear Outputs', group: 'Edit', run: () => dispatch({ type: 'CLEAR_OUTPUTS' }) },
      { id: 'cell-to-code', label: 'Convert Cell To Code', group: 'Edit', run: () => dispatch({ type: 'SET_CELL_TYPE', cellId: selectedCellId, cellType: 'code' }) },
      { id: 'cell-to-markdown', label: 'Convert Cell To Markdown', group: 'Edit', run: () => dispatch({ type: 'SET_CELL_TYPE', cellId: selectedCellId, cellType: 'markdown' }) },
      { id: 'ai-explain-cell', label: 'AI Explain Cell', group: 'AI', run: () => void actions.runAiAction('explain', 'cell'), disabled: !settings.aiEnabled },
      { id: 'ai-fix-cell', label: 'AI Fix Cell Error', group: 'AI', run: () => void actions.runAiAction('fix', 'cell'), disabled: !settings.aiEnabled },
      { id: 'ai-optimize-cell', label: 'AI Optimize Cell', group: 'AI', run: () => void actions.runAiAction('optimize', 'cell'), disabled: !settings.aiEnabled },
      { id: 'ai-scan-notebook', label: 'AI Scan Full Notebook', group: 'AI', run: () => void actions.runAiAction('fix', 'notebook'), disabled: !settings.aiEnabled },
      {
        id: 'inspector',
        label: 'Toggle Variable Inspector',
        group: 'View',
        run: () => dispatch({ type: 'SET_UI', inspectorOpen: !state.inspectorOpen }),
        disabled: !variableInspectorEnabled,
      },
      ...state.notebooks.map((notebook) => ({
        id: `open-${notebook.id}`,
        label: `Open ${notebook.name}`,
        group: 'File',
        run: () => void actions.openNotebook(notebook.id),
      })),
    ],
    [actions, cellInputs, running, selectedCellId, settings.aiEnabled, state.inspectorOpen, state.notebook.cells, state.notebooks],
  );

  const shellColumns =
    state.view === 'notebook'
      ? `minmax(0, 1fr)${aiOpen ? ` ${aiPanelWidth}px` : ''}${state.inspectorOpen && variableInspectorEnabled ? ' 280px' : ''}`
      : 'minmax(0, 1fr)';
  const autosaveLabel = state.saving ? 'Autosaving...' : state.dirty ? 'Autosave pending' : 'Autosaved';
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  };
  const openNewNotebookDialog = () => setNewNotebookOpen(true);

  return (
    <div className="app-root">
      {state.view === 'notebook' ? (
        <Toolbar
          notebookName={state.notebook.metadata.name}
          kernel={state.kernel}
          dirty={state.dirty}
          saving={state.saving}
          running={running}
          minimap={state.minimap}
          theme={state.theme}
          variableInspectorEnabled={variableInspectorEnabled}
          inspectorOpen={state.inspectorOpen}
          expanded
          fullscreen={fullscreen}
          onNew={openNewNotebookDialog}
          onHome={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          onOpenPalette={() => dispatch({ type: 'SET_UI', paletteOpen: true })}
          onSave={() => void actions.saveNotebook()}
          onSaveAs={() => void actions.saveAsNotebook()}
          onSaveLocal={() => void actions.saveNotebookToLocal()}
          onRename={() => void actions.renameNotebook()}
          onImport={(file) => void actions.importFile(file)}
          onExportCpp={() => void actions.exportCpp()}
          onExportPdf={() => void actions.exportPdf()}
          onExportNotebook={() => void actions.exportNotebookFile()}
          onRunCell={() => runCellFromUi(selectedCellId)}
          onRunAll={runAllFromUi}
          onStop={stopExecution}
          onRestart={() => void actions.restartKernel()}
          onClearOutputs={() => dispatch({ type: 'CLEAR_OUTPUTS' })}
          onToggleMinimap={() => dispatch({ type: 'SET_UI', minimap: !state.minimap })}
          onToggleInspector={() => dispatch({ type: 'SET_UI', inspectorOpen: !state.inspectorOpen })}
          onToggleFullscreen={toggleFullscreen}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : null}

      <div className="min-h-0 flex-1" style={{ display: 'grid', gridTemplateColumns: shellColumns }}>
        {state.view === 'home' ? (
          <HomePage
            notebooks={state.notebooks}
            recentNotebookIds={state.recentNotebookIds}
            currentNotebook={state.notebook}
            compiler={state.kernel.compiler}
            onNew={openNewNotebookDialog}
            onOpenLocal={() => localFileInputRef.current?.click()}
            onOpenNotebook={(id) => void actions.openNotebook(id)}
            onRenameNotebook={(id) => void actions.renameNotebook(id)}
            onSaveCurrentLocal={() => void actions.saveNotebookToLocal()}
            onContinueCurrent={() => dispatch({ type: 'SET_VIEW', view: 'notebook' })}
            onOpenPalette={() => dispatch({ type: 'SET_UI', paletteOpen: true })}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <main className="min-w-0 overflow-auto bg-[var(--bg-base)] text-[var(--text-primary)]">
            <div className="mx-auto flex max-w-[1360px] flex-col gap-4 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 group">
                    <h1 className="truncate text-base font-semibold text-[var(--text-primary)]">{state.notebook.metadata.name}</h1>
                    <button
                      type="button"
                      onClick={() => void actions.renameNotebook()}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
                      title="Rename notebook"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    {state.notebook.metadata.description || state.statusText}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-0.5">
                  <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      className="accent-indigo-500 rounded cursor-pointer"
                      checked={state.continueOnError}
                      onChange={(event) => dispatch({ type: 'SET_CONTINUE_ON_ERROR', value: event.target.checked })}
                    />
                    Continue on error
                  </label>
                  <span className="text-[11px] text-[var(--text-secondary)] opacity-80 font-medium select-none">
                    {autosaveLabel}
                  </span>
                </div>
              </div>

              {state.notebook.cells.map((cell, index) => (
                <div id={cell.id} key={`${cell.id}-${index}`}>
                  <NotebookCell
                    cell={cell}
                    index={index}
                    selected={cell.id === selectedCell?.id}
                    minimap={state.minimap}
                    theme={monacoTheme(state.theme)}
                    running={running}
                    onSelect={() => dispatch({ type: 'SELECT_CELL', cellId: cell.id })}
                    onChange={(source) => dispatch({ type: 'SET_CELL_SOURCE', cellId: cell.id, source })}
                    stdin={cellInputs[cell.id] ?? ''}
                    readsStdin={cell.type === 'code' && sourceReadsStdin(cell.source)}
                    inputPrompt={promptFromSource(cell.source)}
                    terminal={terminals[cell.id]}
                    terminalInput={terminalInputs[cell.id] ?? ''}
                    onStdinChange={(value) => setCellInputs((current) => ({ ...current, [cell.id]: value }))}
                    onRun={() => runCellFromUi(cell.id)}
                    onSubmitStdin={() => void actions.runCell(cell.id, false, false, cellInputs[cell.id] ?? '')}
                    onTerminalInputChange={(value) => setTerminalInputs((current) => ({ ...current, [cell.id]: value }))}
                    onTerminalInputSubmit={() => sendTerminalInput(cell.id)}
                    onTerminalInterrupt={() => interruptCell(cell.id)}
                    onAddCode={() => addCell('code', cell.id)}
                    onAddMarkdown={() => addCell('markdown', cell.id)}
                    onDelete={() => dispatch({ type: 'DELETE_CELL', cellId: cell.id })}
                    onDuplicate={() => dispatch({ type: 'DUPLICATE_CELL', cellId: cell.id })}
                    onMoveUp={() => dispatch({ type: 'MOVE_CELL', cellId: cell.id, direction: -1 })}
                    canMoveUp={index > 0}
                    onMoveDown={() => dispatch({ type: 'MOVE_CELL', cellId: cell.id, direction: 1 })}
                    canMoveDown={index < state.notebook.cells.length - 1}
                    onClearOutput={() => dispatch({ type: 'CLEAR_OUTPUTS', cellId: cell.id })}
                    onToggleType={() =>
                      dispatch({
                        type: 'SET_CELL_TYPE',
                        cellId: cell.id,
                        cellType: cell.type === 'code' ? 'markdown' : 'code',
                      })
                    }
                    onEnhanceWithAi={() => openEnhanceChat(cell.id)}
                    aiEnabled={settings.aiEnabled}
                    smoothCaret={settings.smoothCaret}
                    onEditMarkdown={() => dispatch({ type: 'SET_CELL_TYPE', cellId: cell.id, cellType: 'code' })}
                    onDiagnosticClick={onDiagnosticClick}
                  />
                </div>
              ))}
            </div>
          </main>
        )}

        {state.view === 'notebook' && aiOpen ? (
          <AIChatPanel
            open={aiOpen}
            busy={aiBusy}
            messages={aiMessages}
            draft={aiDraft}
            onDraftChange={setAiDraft}
            width={aiPanelWidth}
            onWidthChange={setAiPanelWidth}
            onClose={() => setAiOpen(false)}
            onSend={(message) => {
              setAiDraft('');
              void sendAiChat(message);
            }}
          />
        ) : null}

        {state.view === 'notebook' && state.inspectorOpen && variableInspectorEnabled ? (
          <VariableInspector variables={state.variables} />
        ) : null}
      </div>

      <input
        ref={localFileInputRef}
        className="hidden"
        type="file"
        accept=".cpp,.cc,.cxx,.hpp,.h,.cppnb"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void actions.importFile(file);
          event.target.value = '';
        }}
      />

      <CommandPalette
        open={state.paletteOpen}
        commands={commands}
        onClose={() => dispatch({ type: 'SET_UI', paletteOpen: false })}
      />

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={setSettings}
      />

      <NewNotebookDialog
        open={newNotebookOpen}
        onClose={() => setNewNotebookOpen(false)}
        onCreate={(values) => {
          actions.newNotebook(values);
          setNewNotebookOpen(false);
        }}
      />
    </div>
  );
}
