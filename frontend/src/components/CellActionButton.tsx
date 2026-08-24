import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface CellActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  label: string;
  showLabel?: boolean;
  variant?: 'default' | 'ai';
}

export function CellActionButton({
  icon,
  label,
  showLabel = false,
  variant = 'default',
  className = '',
  onClick,
  ...props
}: CellActionButtonProps) {
  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = (event) => {
    event.stopPropagation();
    onClick?.(event);
  };

  const base =
    variant === 'ai'
      ? 'px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-md shadow-sm tracking-wide'
      : 'p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-md transition';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium transition ${base} disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {icon}
      {showLabel || !icon ? <span className="whitespace-nowrap">{label}</span> : null}
    </button>
  );
}
