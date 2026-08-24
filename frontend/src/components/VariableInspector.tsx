import { FlaskConical } from 'lucide-react';

import type { VariableSnapshot } from '../types/notebook';

interface VariableInspectorProps {
  variables: VariableSnapshot[];
}

export function VariableInspector({ variables }: VariableInspectorProps) {
  return (
    <aside className="grid h-full grid-rows-[auto_1fr] border-l border-work-700 bg-work-900">
      <div className="flex h-10 items-center gap-2 border-b border-work-700 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <FlaskConical className="h-3.5 w-3.5 text-signal-amber" />
        Variables
      </div>
      <div className="overflow-auto p-3">
        {variables.length === 0 ? (
          <div className="rounded border border-dashed border-work-700 p-3 text-xs leading-5 text-slate-500">
            Experimental inspector is enabled, but no supported variables were reported by the kernel.
          </div>
        ) : (
          <div className="space-y-2">
            {variables.map((variable) => (
              <div key={variable.name} className="rounded border border-work-700 bg-work-850 p-2">
                <div className="truncate font-mono text-xs text-white">{variable.name}</div>
                <div className="truncate text-[11px] text-slate-500">{variable.type}</div>
                <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-300">{variable.value}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

