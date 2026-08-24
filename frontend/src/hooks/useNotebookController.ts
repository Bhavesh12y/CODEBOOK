import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import { api } from '../services/api';
import type {
  CellOutput,
  CellStatus,
  CellType,
  ExecutionResult,
  KernelState,
  Notebook,
  NotebookCell,
  NotebookSummary,
  ProjectFile,
  VariableSnapshot,
  AppView,
  AppTheme,
} from '../types/notebook';
import { createCell, createNotebook, downloadText, ensureAtLeastOneCell, nextCellId, saveNotebookFile } from '../utils/notebook';

interface NotebookState {
  notebook: Notebook;
  view: AppView;
  theme: AppTheme;
  selectedCellId: string;
  kernel: KernelState;
  notebooks: NotebookSummary[];
  projectFiles: ProjectFile[];
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  paletteOpen: boolean;
  minimap: boolean;
  dirty: boolean;
  saving: boolean;
  runningCellId: string | null;
  runAllActive: boolean;
  continueOnError: boolean;
  stdin: string;
  statusText: string;
  recentNotebookIds: string[];
  variables: VariableSnapshot[];
}

type Action =
  | { type: 'SET_NOTEBOOK'; notebook: Notebook; selectedCellId?: string; dirty?: boolean }
  | { type: 'SET_VIEW'; view: AppView }
  | { type: 'SET_THEME'; theme: AppTheme }
  | { type: 'SET_NOTEBOOK_NAME'; name: string; id?: string | null }
  | { type: 'SET_CELL_SOURCE'; cellId: string; source: string }
  | { type: 'SET_CELL_TYPE'; cellId: string; cellType: CellType }
  | { type: 'ADD_CELL'; cellType: CellType; afterId?: string; source?: string }
  | { type: 'DELETE_CELL'; cellId: string }
  | { type: 'DUPLICATE_CELL'; cellId: string }
  | { type: 'MOVE_CELL'; cellId: string; direction: -1 | 1 }
  | { type: 'SELECT_CELL'; cellId: string }
  | { type: 'SET_CELL_STATUS'; cellId: string; status: CellStatus; executionTime?: number | null }
  | { type: 'SET_CELL_OUTPUT'; cellId: string; outputs: CellOutput[]; result?: ExecutionResult }
  | { type: 'CLEAR_OUTPUTS'; cellId?: string }
  | { type: 'SET_KERNEL'; kernel: Partial<KernelState> }
  | { type: 'SET_NOTEBOOKS'; notebooks: NotebookSummary[] }
  | { type: 'SET_PROJECT_FILES'; projectFiles: ProjectFile[] }
  | { type: 'SET_UI'; sidebarOpen?: boolean; inspectorOpen?: boolean; paletteOpen?: boolean; minimap?: boolean }
  | { type: 'SET_DIRTY'; dirty: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_RUNNING'; cellId: string | null; runAllActive?: boolean }
  | { type: 'SET_CONTINUE_ON_ERROR'; value: boolean }
  | { type: 'SET_STDIN'; value: string }
  | { type: 'SET_STATUS_TEXT'; text: string }
  | { type: 'SET_RECENT'; ids: string[] }
  | { type: 'SET_VARIABLES'; variables: VariableSnapshot[] };

const initialNotebook = createNotebook();

const initialState: NotebookState = {
  notebook: initialNotebook,
  view: 'home',
  theme: 'midnight',
  selectedCellId: initialNotebook.cells[0].id,
  kernel: { status: 'ready', compiler: null },
  notebooks: [],
  projectFiles: [],
  sidebarOpen: true,
  inspectorOpen: false,
  paletteOpen: false,
  minimap: false,
  dirty: true,
  saving: false,
  runningCellId: null,
  runAllActive: false,
  continueOnError: false,
  stdin: '',
  statusText: 'Ready',
  recentNotebookIds: [],
  variables: [],
};

function reducer(state: NotebookState, action: Action): NotebookState {
  switch (action.type) {
    case 'SET_NOTEBOOK': {
      const notebook = ensureAtLeastOneCell(action.notebook);
      return {
        ...state,
        notebook,
        view: 'notebook',
        selectedCellId: action.selectedCellId ?? notebook.cells[0].id,
        dirty: action.dirty ?? false,
        statusText: 'Ready',
      };
    }
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_NOTEBOOK_NAME':
      return {
        ...state,
        dirty: action.id === undefined ? true : false,
        notebook: {
          ...state.notebook,
          id: action.id === undefined ? state.notebook.id : action.id,
          metadata: { ...state.notebook.metadata, name: action.name },
        },
      };
    case 'SET_CELL_SOURCE':
      return {
        ...state,
        dirty: true,
        notebook: {
          ...state.notebook,
          cells: state.notebook.cells.map((cell) =>
            cell.id === action.cellId
              ? {
                  ...cell,
                  source: action.source,
                  // Editing invalidates committed notebook state for this cell.
                  status: cell.status === 'success' ? 'idle' : cell.status,
                  executionCount: cell.status === 'success' ? null : cell.executionCount,
                }
              : cell,
          ),
        },
      };
    case 'SET_CELL_TYPE':
      return {
        ...state,
        dirty: true,
        notebook: {
          ...state.notebook,
          cells: state.notebook.cells.map((cell) =>
            cell.id === action.cellId
              ? {
                  ...cell,
                  type: action.cellType,
                  outputs: [],
                  status: 'idle',
                  executionTime: null,
                }
              : cell,
          ),
        },
      };
    case 'ADD_CELL': {
      const cell = createCell(action.cellType, action.source ?? '');
      const index = action.afterId
        ? state.notebook.cells.findIndex((item) => item.id === action.afterId)
        : state.notebook.cells.length - 1;
      const cells = [...state.notebook.cells];
      cells.splice(Math.max(index + 1, 0), 0, cell);
      return { ...state, notebook: { ...state.notebook, cells }, selectedCellId: cell.id, dirty: true };
    }
    case 'DELETE_CELL': {
      if (state.notebook.cells.length === 1) {
        const replacement = createCell('code');
        return {
          ...state,
          notebook: { ...state.notebook, cells: [replacement] },
          selectedCellId: replacement.id,
          dirty: true,
        };
      }
      const index = state.notebook.cells.findIndex((cell) => cell.id === action.cellId);
      const cells = state.notebook.cells.filter((cell) => cell.id !== action.cellId);
      const selectedCellId =
        state.selectedCellId === action.cellId ? cells[Math.max(0, index - 1)]?.id ?? cells[0].id : state.selectedCellId;
      return { ...state, notebook: { ...state.notebook, cells }, selectedCellId, dirty: true };
    }
    case 'DUPLICATE_CELL': {
      const index = state.notebook.cells.findIndex((cell) => cell.id === action.cellId);
      if (index < 0) return state;
      const source = state.notebook.cells[index];
      const duplicate: NotebookCell = {
        ...source,
        id: `cell-${crypto.randomUUID()}`,
        outputs: [],
        executionCount: null,
        executionTime: null,
        status: 'idle',
      };
      const cells = [...state.notebook.cells];
      cells.splice(index + 1, 0, duplicate);
      return { ...state, notebook: { ...state.notebook, cells }, selectedCellId: duplicate.id, dirty: true };
    }
    case 'MOVE_CELL': {
      const index = state.notebook.cells.findIndex((cell) => cell.id === action.cellId);
      const target = index + action.direction;
      
      if (index < 0 || target < 0 || target >= state.notebook.cells.length) return state;
      
      const cells = [...state.notebook.cells];
      
      // Bulletproof array swap
      const temp = cells[index];
      cells[index] = cells[target];
      cells[target] = temp;
      
      return { 
        ...state, 
        notebook: { ...state.notebook, cells }, 
        dirty: true 
      };
    }
    case 'SELECT_CELL':
      return { ...state, selectedCellId: action.cellId };
    case 'SET_CELL_STATUS':
      return {
        ...state,
        notebook: {
          ...state.notebook,
          cells: state.notebook.cells.map((cell) =>
            cell.id === action.cellId
              ? { ...cell, status: action.status, executionTime: action.executionTime ?? cell.executionTime }
              : cell,
          ),
        },
      };
    case 'SET_CELL_OUTPUT':
      return {
        ...state,
        variables: action.result?.variables ?? state.variables,
        notebook: {
          ...state.notebook,
          cells: state.notebook.cells.map((cell) =>
            cell.id === action.cellId
              ? {
                  ...cell,
                  outputs: action.outputs,
                  status: action.result?.status ?? cell.status,
                  executionTime: action.result?.executionTime ?? cell.executionTime,
                  executionCount:
                    action.result?.status === 'success' ? (cell.executionCount ?? 0) + 1 : cell.executionCount,
                }
              : cell,
          ),
        },
      };
    case 'CLEAR_OUTPUTS':
      return {
        ...state,
        dirty: true,
        notebook: {
          ...state.notebook,
          cells: state.notebook.cells.map((cell) =>
            !action.cellId || cell.id === action.cellId
              ? { ...cell, outputs: [], status: 'idle', executionTime: null }
              : cell,
          ),
        },
      };
    case 'SET_KERNEL':
      return { ...state, kernel: { ...state.kernel, ...action.kernel } };
    case 'SET_NOTEBOOKS':
      return { ...state, notebooks: action.notebooks };
    case 'SET_PROJECT_FILES':
      return { ...state, projectFiles: action.projectFiles };
    case 'SET_UI': {
      const { type: _type, ...ui } = action;
      return { ...state, ...ui };
    }
    case 'SET_DIRTY':
      return { ...state, dirty: action.dirty };
    case 'SET_SAVING':
      return { ...state, saving: action.saving };
    case 'SET_RUNNING':
      return {
        ...state,
        runningCellId: action.cellId,
        runAllActive: action.runAllActive ?? state.runAllActive,
        kernel: { ...state.kernel, status: action.cellId ? 'running' : 'ready' },
      };
    case 'SET_CONTINUE_ON_ERROR':
      return { ...state, continueOnError: action.value };
    case 'SET_STDIN':
      return { ...state, stdin: action.value };
    case 'SET_STATUS_TEXT':
      return { ...state, statusText: action.text };
    case 'SET_RECENT':
      return { ...state, recentNotebookIds: action.ids };
    case 'SET_VARIABLES':
      return { ...state, variables: action.variables };
    default:
      return state;
  }
}

function outputsFromResult(result: ExecutionResult): CellOutput[] {
  const outputs: CellOutput[] = [];
  if (result.stdout) outputs.push({ type: 'stdout', text: result.stdout });
  if (result.stderr) {
    outputs.push({
      type: result.status === 'success' ? 'stderr' : 'error',
      text: result.stderr,
      diagnostics: result.diagnostics,
    });
  }
  if (!result.stdout && !result.stderr && result.message && result.status !== 'success') {
    outputs.push({ type: 'error', text: result.message, diagnostics: result.diagnostics });
  }
  return outputs;
}

export function useNotebookController() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const refreshProject = useCallback(async () => {
    const notebooks = await api.notebooks();
    dispatch({ type: 'SET_NOTEBOOKS', notebooks });
  }, []);

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('cppbook.recent') ?? '[]') as string[];
    const storedTheme = localStorage.getItem('cppbook.theme');
    dispatch({ type: 'SET_RECENT', ids: recent });
    if (storedTheme === 'midnight' || storedTheme === 'obsidian' || storedTheme === 'graphite' || storedTheme === 'matrix' || storedTheme === 'daylight') {
      dispatch({ type: 'SET_THEME', theme: storedTheme });
    }

    Promise.all([api.compiler(), api.startKernel(), refreshProject()])
      .then(([compiler]) => {
        dispatch({
          type: 'SET_KERNEL',
          kernel: {
            status: compiler.available ? 'ready' : 'error',
            compiler,
            message: compiler.available ? 'Ready' : compiler.error ?? 'Compiler unavailable',
          },
        });
      })
      .catch((error: Error) => {
        dispatch({ type: 'SET_STATUS_TEXT', text: error.message });
        dispatch({ type: 'SET_KERNEL', kernel: { status: 'error', message: error.message } });
      });
  }, [refreshProject]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem('cppbook.theme', state.theme);
  }, [state.theme]);

  const addRecent = useCallback((id: string | null | undefined) => {
    if (!id) return;
    const ids = [id, ...stateRef.current.recentNotebookIds.filter((item) => item !== id)].slice(0, 8);
    localStorage.setItem('cppbook.recent', JSON.stringify(ids));
    dispatch({ type: 'SET_RECENT', ids });
  }, []);

  const saveNotebook = useCallback(async () => {
    const current = stateRef.current.notebook;
    dispatch({ type: 'SET_SAVING', saving: true });
    try {
      const saved = current.id ? await api.updateNotebook(current.id, current) : await api.createNotebook(current);
      dispatch({ type: 'SET_NOTEBOOK', notebook: saved, selectedCellId: stateRef.current.selectedCellId, dirty: false });
      addRecent(saved.id);
      await refreshProject();
      dispatch({ type: 'SET_STATUS_TEXT', text: 'Saved' });
      return saved;
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }, [addRecent, refreshProject]);

  useEffect(() => {
    if (!state.dirty || !state.notebook.id || state.saving || state.runningCellId) {
      return;
    }
    const handle = window.setTimeout(() => {
      void saveNotebook();
    }, 1200);
    return () => window.clearTimeout(handle);
  }, [saveNotebook, state.dirty, state.notebook, state.saving, state.runningCellId]);

  const saveAsNotebook = useCallback(async () => {
    const name = window.prompt('Notebook name', stateRef.current.notebook.metadata.name);
    if (!name) return;
    const notebook = {
      ...stateRef.current.notebook,
      id: null,
      metadata: { ...stateRef.current.notebook.metadata, name },
    };
    dispatch({ type: 'SET_SAVING', saving: true });
    try {
      const saved = await api.createNotebook(notebook);
      dispatch({ type: 'SET_NOTEBOOK', notebook: saved, selectedCellId: stateRef.current.selectedCellId, dirty: false });
      addRecent(saved.id);
      await refreshProject();
      dispatch({ type: 'SET_STATUS_TEXT', text: 'Saved' });
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false });
    }
  }, [addRecent, refreshProject]);

  const openNotebook = useCallback(
    async (id: string) => {
      const notebook = await api.notebook(id);
      dispatch({ type: 'SET_NOTEBOOK', notebook, dirty: false });
      addRecent(notebook.id);
      dispatch({ type: 'SET_STATUS_TEXT', text: `Opened ${notebook.metadata.name}` });
    },
    [addRecent],
  );

  const newNotebook = useCallback((options?: { name?: string; description?: string }) => {
    const name = options?.name?.trim() || 'Untitled';
    const description = options?.description?.trim() ?? '';
    const notebook = createNotebook(name, description);
    dispatch({ type: 'SET_NOTEBOOK', notebook, selectedCellId: notebook.cells[0].id, dirty: true });
  }, []);

  const renameNotebook = useCallback(
    async (id?: string) => {
      const current = stateRef.current.notebook;
      const targetId = id ?? current.id ?? undefined;
      const currentName = id
        ? stateRef.current.notebooks.find((notebook) => notebook.id === id)?.name ?? current.metadata.name
        : current.metadata.name;
      const name = window.prompt('Notebook name', currentName)?.trim();
      if (!name) return;

      if (targetId) {
        const renamed = await api.renameNotebook(targetId, name);
        if (current.id === targetId) {
          dispatch({ type: 'SET_NOTEBOOK', notebook: renamed, selectedCellId: stateRef.current.selectedCellId, dirty: false });
        }
        addRecent(renamed.id);
        await refreshProject();
        dispatch({ type: 'SET_STATUS_TEXT', text: `Renamed to ${renamed.metadata.name}` });
      } else {
        dispatch({ type: 'SET_NOTEBOOK_NAME', name });
        dispatch({ type: 'SET_STATUS_TEXT', text: `Renamed to ${name}` });
      }
    },
    [addRecent, refreshProject],
  );

  const importFile = useCallback(
    async (file: File) => {
      const notebook = await api.importFile(file);
      dispatch({ type: 'SET_NOTEBOOK', notebook, dirty: false });
      addRecent(notebook.id);
      await refreshProject();
    },
    [addRecent, refreshProject],
  );

  const exportCpp = useCallback(async () => {
    const current = stateRef.current.notebook;
    const saved = current.id ? current : await saveNotebook();
    if (!saved?.id) return;
    const source = await api.exportCpp(saved.id);
    const filename = `${saved.metadata.name.replace(/[^A-Za-z0-9_-]+/g, '-') || saved.id}.cpp`;
    downloadText(filename, source, 'text/x-c++src');
  }, [saveNotebook]);

  const exportPdf = useCallback(async () => {
    const current = stateRef.current.notebook;
    const saved = current.id ? current : await saveNotebook();
    if (!saved?.id) return;
    const blob = await api.exportPdf(saved.id);
    const filename = `${saved.metadata.name.replace(/[^A-Za-z0-9_-]+/g, '-') || saved.id}.pdf`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [saveNotebook]);

  const exportNotebookFile = useCallback(async () => {
    const current = stateRef.current.notebook;
    const saved = current.id ? current : await saveNotebook();
    if (!saved?.id) return;
    const source = await api.exportNotebookFile(saved.id);
    const filename = `${saved.metadata.name.replace(/[^A-Za-z0-9_-]+/g, '-') || saved.id}.cppnb`;
    downloadText(filename, source, 'application/json');
  }, [saveNotebook]);

  const saveNotebookToLocal = useCallback(async () => {
    const current = stateRef.current.notebook;
    await saveNotebookFile(current);
    dispatch({ type: 'SET_STATUS_TEXT', text: 'Notebook saved to local file' });
  }, []);

  const runCell = useCallback(async (cellId: string, selectNext = false, insertBelow = false, stdinOverride?: string) => {
    const notebook = stateRef.current.notebook;
    const cell = notebook.cells.find((item) => item.id === cellId);
    if (!cell) {
      if (selectNext) {
        const next = nextCellId(notebook.cells, cellId);
        if (next) dispatch({ type: 'SELECT_CELL', cellId: next });
      }
      return null;
    }
    if (cell.type === 'markdown') {
      const now = performance.now();
      const result: ExecutionResult = {
        status: 'success',
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 0.001,
        diagnostics: [],
        variables: stateRef.current.variables,
        message: null,
      };
      dispatch({
        type: 'SET_CELL_OUTPUT',
        cellId,
        outputs: [{ type: 'markdown', text: cell.source }],
        result: { ...result, executionTime: Math.max(0.001, (performance.now() - now) / 1000) },
      });
      dispatch({ type: 'SET_STATUS_TEXT', text: 'Markdown rendered' });
      return result;
    }
    abortRef.current = new AbortController();
    dispatch({ type: 'SET_RUNNING', cellId });
    dispatch({ type: 'SET_CELL_STATUS', cellId, status: 'running' });
    dispatch({ type: 'SET_STATUS_TEXT', text: `Running cell ${notebook.cells.findIndex((item) => item.id === cellId) + 1}` });
    try {
      const result = await api.execute(notebook, cellId, abortRef.current.signal, stdinOverride ?? stateRef.current.stdin);
      dispatch({ type: 'SET_CELL_OUTPUT', cellId, outputs: outputsFromResult(result), result });
      dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
      dispatch({ type: 'SET_STATUS_TEXT', text: result.status === 'success' ? 'Ready' : result.message ?? result.status });
      if (insertBelow) {
        dispatch({ type: 'ADD_CELL', cellType: 'code', afterId: cellId });
      } else if (selectNext) {
        const next = nextCellId(stateRef.current.notebook.cells, cellId);
        if (next) dispatch({ type: 'SELECT_CELL', cellId: next });
      }
      return result;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const result: ExecutionResult = {
          status: 'error',
          stdout: '',
          stderr: (error as Error).message,
          exitCode: null,
          executionTime: 0,
          diagnostics: [],
          variables: [],
          message: 'Backend Error',
        };
        dispatch({ type: 'SET_CELL_OUTPUT', cellId, outputs: outputsFromResult(result), result });
        dispatch({ type: 'SET_STATUS_TEXT', text: (error as Error).message });
      }
      dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
      return null;
    } finally {
      abortRef.current = null;
    }
  }, []);

  const runAiAction = useCallback(async (task: 'explain' | 'fix' | 'optimize' | 'enhance', scope: 'cell' | 'notebook' = 'cell') => {
    const notebook = stateRef.current.notebook;
    const selected = notebook.cells.find((item) => item.id === stateRef.current.selectedCellId);
    if (!selected) return;
    const settings = JSON.parse(localStorage.getItem('cppbook.settings') ?? '{}') as {
      aiEnabled?: boolean;
      aiProvider?: 'groq';
      groqModel?: string;
      geminiModel?: string;
      groqApiKey?: string;
      geminiApiKey?: string;
      aiModel?: string;
      geminiApiKeys?: string[];
    };
    if (!settings.aiEnabled) {
      dispatch({ type: 'SET_STATUS_TEXT', text: 'AI agent is off. Enable it in Settings.' });
      return;
    }
    dispatch({ type: 'SET_STATUS_TEXT', text: `AI ${task} in progress...` });
    const latestError = selected.outputs.find((output) => output.type === 'error' || output.type === 'stderr')?.text ?? '';
    const response = await api.aiAction({
      notebookId: notebook.id ?? 'unsaved',
      scope,
      task,
      cellId: selected.id,
      source: selected.source,
      notebookSource: notebook.cells.map((cell, index) => `Cell ${index + 1} [${cell.type}]\n${cell.source}`).join('\n\n'),
      stderr: latestError,
      aiEnabled: settings.aiEnabled,
      aiProvider: 'groq',
      groqModel: settings.groqModel ?? 'openai/gpt-oss-20b',
      geminiModel:
        settings.geminiModel ??
        (settings.aiModel && !['gemini-1.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash'].includes(settings.aiModel)
          ? settings.aiModel
          : 'gemini-2.5-flash'),
      groqApiKey: (settings.groqApiKey ?? '').trim(),
      geminiApiKey: (settings.geminiApiKey ?? settings.geminiApiKeys?.find((key) => key.trim()) ?? '').trim(),
    });
    dispatch({
      type: 'SET_CELL_OUTPUT',
      cellId: selected.id,
      outputs: [{ type: response.status === 'ok' ? 'stdout' : 'error', text: response.suggestion }],
      result: {
        status: response.status === 'ok' ? 'success' : 'error',
        stdout: response.status === 'ok' ? response.suggestion : '',
        stderr: response.status === 'ok' ? '' : response.suggestion,
        exitCode: null,
        executionTime: 0,
        diagnostics: [],
        variables: stateRef.current.variables,
        message: response.status === 'ok' ? 'AI suggestion ready' : 'AI request failed',
      },
    });
    dispatch({ type: 'SET_STATUS_TEXT', text: response.status === 'ok' ? 'AI suggestion ready' : 'AI failed' });
  }, []);

  const runAll = useCallback(async (stdinOverride?: string) => {
    const notebook = stateRef.current.notebook;
    dispatch({ type: 'SET_RUNNING', cellId: 'all', runAllActive: true });
    dispatch({ type: 'SET_STATUS_TEXT', text: 'Running all cells' });
    try {
      const response = await api.executeAll(notebook, stateRef.current.continueOnError, stdinOverride ?? stateRef.current.stdin);
      for (const item of response.results) {
        dispatch({
          type: 'SET_CELL_OUTPUT',
          cellId: item.cellId,
          outputs: outputsFromResult(item.result),
          result: item.result,
        });
      }
      dispatch({ type: 'SET_STATUS_TEXT', text: response.status === 'success' ? 'Run all complete' : 'Run all stopped' });
    } catch (error) {
      dispatch({ type: 'SET_STATUS_TEXT', text: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
    }
  }, []);

  const interrupt = useCallback(async () => {
    await api.interruptKernel();
    abortRef.current?.abort();
    const running = stateRef.current.runningCellId;
    if (running && running !== 'all') {
      dispatch({ type: 'SET_CELL_STATUS', cellId: running, status: 'stopped' });
    }
    dispatch({ type: 'SET_RUNNING', cellId: null, runAllActive: false });
    dispatch({ type: 'SET_STATUS_TEXT', text: 'Stopped' });
  }, []);

  const restartKernel = useCallback(async () => {
    await api.restartKernel();
    dispatch({ type: 'CLEAR_OUTPUTS' });
    dispatch({ type: 'SET_VARIABLES', variables: [] });
    dispatch({ type: 'SET_KERNEL', kernel: { status: 'ready', message: 'Kernel restarted' } });
    dispatch({ type: 'SET_STATUS_TEXT', text: 'Kernel restarted — notebook state cleared' });
  }, []);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'SET_THEME', theme: stateRef.current.theme === 'daylight' ? 'midnight' : 'daylight' });
  }, []);

  const selectedCell = useMemo(
    () => state.notebook.cells.find((cell) => cell.id === state.selectedCellId) ?? state.notebook.cells[0],
    [state.notebook.cells, state.selectedCellId],
  );

  return {
    state,
    selectedCell,
    dispatch,
    actions: {
      newNotebook,
      saveNotebook,
      saveAsNotebook,
      openNotebook,
      importFile,
      exportCpp,
      exportPdf,
      exportNotebookFile,
      refreshProject,
      runCell,
      runAll,
      interrupt,
      restartKernel,
      renameNotebook,
      saveNotebookToLocal,
      toggleTheme,
      runAiAction,
    },
  };
}
