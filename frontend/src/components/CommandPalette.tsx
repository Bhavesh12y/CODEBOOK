import { Command } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  run: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  open: boolean;
  commands: PaletteCommand[];
  onClose: () => void;
}

export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const visibleCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return commands.filter((command) =>
      normalized ? `${command.group} ${command.label}`.toLowerCase().includes(normalized) : true,
    );
  }, [commands, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/45 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        className="mx-auto max-w-2xl overflow-hidden rounded border border-work-700 bg-work-900 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-12 items-center gap-3 border-b border-work-700 px-3">
          <Command className="h-4 w-4 text-signal-blue" />
          <input
            ref={inputRef}
            className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'Enter' && visibleCommands[0] && !visibleCommands[0].disabled) {
                visibleCommands[0].run();
                onClose();
              }
            }}
            placeholder="Command"
          />
        </div>
        <div className="max-h-[55vh] overflow-auto py-2">
          {visibleCommands.map((command) => (
            <button
              key={command.id}
              type="button"
              className="grid h-10 w-full grid-cols-[1fr_auto] items-center gap-3 px-4 text-left text-sm text-slate-200 hover:bg-work-800 disabled:cursor-not-allowed disabled:text-slate-600"
              onClick={() => {
                command.run();
                onClose();
              }}
              disabled={command.disabled}
            >
              <span className="truncate">{command.label}</span>
              <span className="text-xs text-slate-500">{command.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

