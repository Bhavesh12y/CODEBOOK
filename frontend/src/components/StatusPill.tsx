import { Circle, Loader2 } from 'lucide-react';

import type { CellStatus, KernelState } from '../types/notebook';

export function StatusPill({ status, label }: { status: CellStatus | KernelState['status']; label?: string }) {
  const color =
    status === 'success' || status === 'ready'
      ? 'text-emerald-400'
      : status === 'running'
        ? 'text-sky-400'
        : status === 'error'
          ? 'text-rose-400'
          : status === 'stopped'
            ? 'text-amber-400'
            : 'text-slate-500';

  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 select-none">
      {status === 'running' ? (
        <Loader2 className={`h-2.5 w-2.5 animate-spin ${color}`} aria-hidden="true" />
      ) : (
        <Circle className={`h-1.5 w-1.5 fill-current ${color}`} aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">{label ?? status}</span>
    </span>
  );
}

