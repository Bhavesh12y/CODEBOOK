import { ChevronRight, FileCode2, FileText, Folder, NotebookTabs, RefreshCcw } from 'lucide-react';

import type { NotebookSummary, ProjectFile } from '../types/notebook';
import { IconButton } from './IconButton';

interface SidebarProps {
  files: ProjectFile[];
  notebooks: NotebookSummary[];
  recentNotebookIds: string[];
  onOpenNotebook: (id: string) => void;
  onRefresh: () => void;
}

function FileNode({ file, onOpenNotebook }: { file: ProjectFile; onOpenNotebook: (id: string) => void }) {
  const isNotebook = file.name.endsWith('.cppnb');
  const id = isNotebook ? file.name.replace(/\.cppnb$/, '') : null;
  const Icon = file.type === 'directory' ? Folder : isNotebook ? NotebookTabs : file.name.endsWith('.cpp') ? FileCode2 : FileText;

  return (
    <div>
      <button
        type="button"
        className="flex h-7 w-full min-w-0 items-center gap-2 rounded px-2 text-left text-xs text-slate-300 hover:bg-work-800 disabled:hover:bg-transparent"
        onClick={() => id && onOpenNotebook(id)}
        disabled={!id}
        title={file.path}
      >
        {file.type === 'directory' ? <ChevronRight className="h-3 w-3 text-slate-500" /> : <span className="w-3" />}
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        <span className="truncate">{file.name}</span>
      </button>
      {file.children.length > 0 ? (
        <div className="ml-3 border-l border-work-800 pl-1">
          {file.children.map((child) => (
            <FileNode key={child.path} file={child} onOpenNotebook={onOpenNotebook} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar({ files, notebooks, recentNotebookIds, onOpenNotebook, onRefresh }: SidebarProps) {
  const recent = recentNotebookIds
    .map((id) => notebooks.find((notebook) => notebook.id === id))
    .filter(Boolean) as NotebookSummary[];

  return (
    <aside className="grid h-full grid-rows-[auto_1fr] border-r border-work-700 bg-work-900">
      <div className="flex h-10 items-center justify-between border-b border-work-700 px-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Project</div>
        <IconButton icon={<RefreshCcw className="h-3.5 w-3.5" />} label="Refresh project" onClick={onRefresh} />
      </div>
      <div className="overflow-auto px-2 py-3">
        {recent.length > 0 ? (
          <section className="mb-4">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recent</div>
            {recent.map((notebook) => (
              <button
                key={notebook.id}
                type="button"
                className="flex h-8 w-full min-w-0 items-center gap-2 rounded px-2 text-left text-xs text-slate-300 hover:bg-work-800"
                onClick={() => onOpenNotebook(notebook.id)}
              >
                <NotebookTabs className="h-3.5 w-3.5 shrink-0 text-signal-blue" />
                <span className="truncate">{notebook.name}</span>
              </button>
            ))}
          </section>
        ) : null}

        <section>
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Files</div>
          {files.map((file) => (
            <FileNode key={file.path} file={file} onOpenNotebook={onOpenNotebook} />
          ))}
        </section>
      </div>
    </aside>
  );
}

