import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  active?: boolean;
  showLabel?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}

export function IconButton({
  icon,
  label,
  active = false,
  showLabel = false,
  variant = 'default',
  className = '',
  ...props
}: IconButtonProps) {
  const base =
    variant === 'primary'
      ? 'text-indigo-400 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30'
      : variant === 'danger'
      ? 'text-rose-400 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30'
      : active
      ? 'text-[var(--text-primary)] bg-[var(--bg-surface-hover)] shadow-sm'
      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] active:opacity-75';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-all duration-150 backdrop-blur-sm ${base} disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      {...props}
    >
      {icon}
      {showLabel ? <span className="whitespace-nowrap tracking-wide">{label}</span> : null}
    </button>
  );
}
