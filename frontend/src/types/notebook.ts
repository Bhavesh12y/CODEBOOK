export type CellType = 'code' | 'markdown';
export type CellStatus = 'idle' | 'running' | 'success' | 'error' | 'stopped';
export type OutputType = 'stdout' | 'stderr' | 'error' | 'markdown' | 'input';

export interface ExecutionDiagnostic {
  cellId?: string | null;
  line?: number | null;
  column?: number | null;
  severity: string;
  message: string;
  raw?: string | null;
}

export interface CellOutput {
  type: OutputType;
  text: string;
  diagnostics?: ExecutionDiagnostic[];
}

export interface TerminalLine {
  stream: 'stdout' | 'stderr' | 'stdin' | 'system';
  text: string;
}

export interface InteractiveTerminalState {
  status: 'compiling' | 'running' | 'exited' | 'error';
  /** Interleaved output lines for the terminal display */
  lines: TerminalLine[];
  /** Legacy flat strings kept for compatibility */
  stdout: string;
  stderr: string;
  exitCode?: number | null;
  elapsed?: number | null;
}

export interface NotebookCell {
  id: string;
  type: CellType;
  source: string;
  outputs: CellOutput[];
  executionCount?: number | null;
  status: CellStatus;
  executionTime?: number | null;
}

export interface NotebookMetadata {
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Notebook {
  version: number;
  id?: string | null;
  metadata: NotebookMetadata;
  cells: NotebookCell[];
}

export interface NotebookSummary {
  id: string;
  name: string;
  path: string;
  updatedAt?: string | null;
  cellCount: number;
}

export interface CompilerInfo {
  available: boolean;
  compiler?: string | null;
  path?: string | null;
  version?: string | null;
  error?: string | null;
}

export interface VariableSnapshot {
  name: string;
  type: string;
  value: string;
}

export interface ExecutionResult {
  status: 'success' | 'error' | 'stopped';
  stdout: string;
  stderr: string;
  exitCode?: number | null;
  executionTime: number;
  diagnostics: ExecutionDiagnostic[];
  variables: VariableSnapshot[];
  message?: string | null;
}

export interface ExecuteAllResponse {
  status: 'success' | 'error' | 'stopped';
  results: Array<{ cellId: string; result: ExecutionResult }>;
  executionTime: number;
}

export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children: ProjectFile[];
}

export type AIScope = 'cell' | 'notebook';
export type AITask = 'explain' | 'fix' | 'optimize' | 'enhance';

export interface AIActionResponse {
  status: 'ok' | 'error';
  suggestion: string;
}

export interface AIChatResponse {
  status: 'ok' | 'error';
  message: string;
}

export interface KernelState {
  status: 'ready' | 'running' | 'error' | 'stopped';
  compiler?: CompilerInfo | null;
  message?: string;
}

export type AppTheme =
  | 'midnight'
  | 'obsidian'
  | 'graphite'
  | 'dracula'
  | 'onedark'
  | 'tokyonight'
  | 'nord'
  | 'matrix'
  | 'mac'
  | 'daylight';

export interface AIClientSettings {
  enabled: boolean;
  provider: 'groq';
  groqModel: string;
  geminiModel: string;
  groqApiKey: string;
  geminiApiKey: string;
}

export interface UserSettings {
  theme: AppTheme;
  ai: AIClientSettings;
  smoothCaret: boolean;
  toolbarCaptions: boolean;
  autosave: boolean;
  continueOnError: boolean;
}

declare global {
  interface Window {
    cppbook?: {
      apiBaseUrl?: string;
      desktop?: boolean;
      platform?: string;
    };
  }
}
