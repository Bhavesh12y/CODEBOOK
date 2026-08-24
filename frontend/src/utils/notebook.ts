import type { CellType, InteractiveTerminalState, Notebook, NotebookCell, NotebookLanguage } from '../types/notebook';

export function createCell(type: CellType = 'code', source = ''): NotebookCell {
  return {
    id: `cell-${crypto.randomUUID()}`,
    type,
    source,
    outputs: [],
    executionCount: null,
    status: 'idle',
    executionTime: null,
  };
}

export function cellAiRuntimeSnapshot(
  cell: NotebookCell,
  terminal?: InteractiveTerminalState | null,
): {
  stdout: string;
  stderr: string;
  status: string;
  exitCode: number | null;
  executionTime: number | null;
  message: string | null;
} {
  const stdoutFromOutputs = cell.outputs
    .filter((output) => output.type === 'stdout')
    .map((output) => output.text)
    .join('\n');
  const stderrFromOutputs = cell.outputs
    .filter((output) => output.type === 'stderr' || output.type === 'error')
    .map((output) => output.text)
    .join('\n');
  const stdout = (terminal?.stdout || stdoutFromOutputs).trim();
  const stderr = (terminal?.stderr || stderrFromOutputs).trim();
  const exitCode = terminal?.exitCode ?? null;
  const status =
    terminal?.status === 'error'
      ? 'error'
      : terminal?.status === 'exited'
        ? exitCode === 0
          ? 'success'
          : 'error'
        : terminal?.status === 'compiling' || terminal?.status === 'running'
          ? terminal.status
          : cell.status;
  return {
    stdout,
    stderr,
    status,
    exitCode,
    executionTime: cell.executionTime ?? terminal?.elapsed ?? null,
    message: cell.status === 'error' ? 'Cell execution failed' : cell.status === 'stopped' ? 'Execution stopped' : null,
  };
}

export function createNotebook(name = 'Untitled', language: NotebookLanguage = 'cpp', description = ''): Notebook {
  let defaultCode = '';
  switch (language) {
    case 'c':
      defaultCode = '#include <stdio.h>\n\nprintf("Hello from CodeBook!\\n");';
      break;
    case 'python':
      defaultCode = 'print("Hello from CodeBook!")';
      break;
    case 'java':
      defaultCode = 'System.out.println("Hello from CodeBook!");';
      break;
    case 'cpp':
    default:
      defaultCode = '#include <iostream>\nusing namespace std;\n\ncout << "Hello from CodeBook!" << endl;';
      break;
  }

  return {
    version: 1,
    id: null,
    metadata: {
      name,
      description,
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    cells: [createCell('code', defaultCode)],
  };
}

export function ensureAtLeastOneCell(notebook: Notebook): Notebook {
  if (notebook.cells.length > 0) {
    return notebook;
  }
  return { ...notebook, cells: [createCell('code')] };
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function notebookFilename(notebook: Notebook): string {
  const base = notebook.metadata.name.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || notebook.id || 'notebook';
  return `${base}.cbnb`;
}

export async function saveNotebookFile(notebook: Notebook): Promise<void> {
  const text = JSON.stringify(notebook, null, 2);
  const filename = notebookFilename(notebook);
  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'CodeBook Notebook', accept: { 'application/json': ['.cbnb'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
    return;
  }
  downloadText(filename, text, 'application/json');
}

export function notebookFromCppSource(filename: string, source: string): Notebook {
  const name = filename.replace(/\.[^.]+$/, '') || 'Imported C++';
  return {
    version: 1,
    id: null,
    metadata: {
      name,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    cells: [createCell('code', source)],
  };
}

export function nextCellId(cells: NotebookCell[], currentId: string): string | null {
  const index = cells.findIndex((cell) => cell.id === currentId);
  return cells[index + 1]?.id ?? null;
}
