import type {
  AIActionResponse,
  AIChatResponse,
  AIScope,
  AITask,
  ToolchainInfo,
  ExecuteAllResponse,
  ExecutionResult,
  Notebook,
  NotebookSummary,
  ProjectFile,
} from '../types/notebook';

const API_BASE = window.codebook?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '/api';

export function interactiveExecutionUrl(): string {
  const base = API_BASE.startsWith('http')
    ? API_BASE
    : `${window.location.origin}${API_BASE.startsWith('/') ? API_BASE : `/${API_BASE}`}`;
  return `${base.replace(/^http/, 'ws')}/execute/interactive`;
}

async function parseResponse<T>(input: Response | Promise<Response>): Promise<T> {
  const response = await input;
  if (!response.ok) {
    let rawText = '';
    try {
      rawText = await response.text();
    } catch {
      rawText = `${response.status} ${response.statusText}`;
    }
    let detail = rawText;
    try {
      const payload = JSON.parse(rawText);
      detail = payload.detail || payload.message || payload.error || rawText;
      if (typeof detail === 'object') {
        detail = JSON.stringify(detail);
      }
    } catch {
      detail = rawText || `${response.status} ${response.statusText}`;
    }
    throw new Error(detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  async health(): Promise<{ status: string }> {
    return parseResponse(fetch(`${API_BASE}/health`));
  },

  async toolchain(language = 'cpp'): Promise<ToolchainInfo> {
    return parseResponse(fetch(`${API_BASE}/toolchain?language=${language}`));
  },

  async compiler(language = 'cpp'): Promise<ToolchainInfo> {
    return parseResponse(fetch(`${API_BASE}/toolchain?language=${language}`));
  },

  async toolchains(): Promise<Record<string, ToolchainInfo>> {
    return parseResponse(fetch(`${API_BASE}/toolchains`));
  },

  async startKernel(): Promise<{ status: string; mode?: string }> {
    return parseResponse(fetch(`${API_BASE}/kernel/start`, { method: 'POST' }));
  },

  async restartKernel(): Promise<{ status: string; message?: string }> {
    return parseResponse(fetch(`${API_BASE}/kernel/restart`, { method: 'POST' }));
  },

  async interruptKernel(): Promise<{ status: string }> {
    return parseResponse(fetch(`${API_BASE}/kernel/interrupt`, { method: 'POST' }));
  },

  async notebooks(): Promise<NotebookSummary[]> {
    return parseResponse(fetch(`${API_BASE}/notebooks`));
  },

  async notebook(id: string): Promise<Notebook> {
    return parseResponse(fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}`));
  },

  async createNotebook(notebook: Notebook): Promise<Notebook> {
    return parseResponse(
      fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notebook),
      }),
    );
  },

  async updateNotebook(id: string, notebook: Notebook): Promise<Notebook> {
    return parseResponse(
      fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notebook),
      }),
    );
  },

  async renameNotebook(id: string, name: string): Promise<Notebook> {
    return parseResponse(
      fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }),
    );
  },

  async importFile(file: File): Promise<Notebook> {
    const formData = new FormData();
    formData.append('file', file);
    return parseResponse(fetch(`${API_BASE}/notebooks/import`, { method: 'POST', body: formData }));
  },

  async exportCpp(id: string): Promise<string> {
    const response = await fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}/export`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.text();
  },

  async exportPdf(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}/export/pdf`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.blob();
  },

  async exportNotebookFile(id: string): Promise<string> {
    let response = await fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}/export/cbnb`);
    if (response.status === 404) {
      response = await fetch(`${API_BASE}/notebooks/${encodeURIComponent(id)}/export/cppnb`);
    }
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.text();
  },

  async execute(notebook: Notebook, cellId: string, signal?: AbortSignal, stdin = ''): Promise<ExecutionResult> {
    const cell = notebook.cells.find((item) => item.id === cellId);
    return parseResponse(
      fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          notebookId: notebook.id ?? 'unsaved',
          cellId,
          code: cell?.source ?? '',
          stdin,
          language: notebook.metadata?.language || 'cpp',
          executionMode: 'cell',
          cells: notebook.cells.map((item) => ({
            id: item.id,
            type: item.type,
            source: item.source,
            // Only previously successful cells are replayed as notebook state.
            // The target cell is always executed from its current source.
            committed: item.id !== cellId && item.status === 'success',
          })),
        }),
      }),
    );
  },

  async executeAll(notebook: Notebook, continueOnError: boolean, stdin = ''): Promise<ExecuteAllResponse> {
    return parseResponse(
      fetch(`${API_BASE}/execute/all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookId: notebook.id ?? 'unsaved',
          continueOnError,
          stdin,
          language: notebook.metadata?.language || 'cpp',
          cells: notebook.cells.map((item) => ({
            id: item.id,
            type: item.type,
            source: item.source,
            committed: item.status === 'success',
          })),
        }),
      }),
    );
  },

  async projectFiles(): Promise<ProjectFile[]> {
    return parseResponse(fetch(`${API_BASE}/project/files`));
  },

  async aiAction(payload: {
    notebookId: string;
    scope: AIScope;
    task: AITask;
    cellId?: string;
    source?: string;
    notebookSource?: string;
    stderr?: string;
    aiEnabled?: boolean;
    aiProvider?: 'groq';
    groqModel?: string;
    geminiModel?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
  }): Promise<AIActionResponse> {
    return parseResponse(
      fetch(`${API_BASE}/ai/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  },

  async aiChat(payload: {
    notebookId: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    notebookSource?: string;
    cellId?: string;
    aiEnabled?: boolean;
    aiProvider?: 'groq';
    groqModel?: string;
    geminiModel?: string;
    groqApiKey?: string;
    geminiApiKey?: string;
  }): Promise<AIChatResponse> {
    return parseResponse(
      fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  },

  async aiTestConnection(payload: {
    provider: 'groq' | 'gemini';
    apiKey: string;
    model?: string;
  }): Promise<{ status: 'connected' | 'limited' | 'invalid'; provider: 'groq' | 'gemini'; message: string }> {
    return parseResponse(
      fetch(`${API_BASE}/ai/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    );
  },
};
