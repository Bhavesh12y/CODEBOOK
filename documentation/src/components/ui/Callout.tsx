import React from 'react';
import { Info, AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'architecture';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({
  type = 'note',
  title,
  children,
}) => {
  const configs = {
    note: {
      border: 'border-l-4 border-l-blue-500 border-slate-300 dark:border-white/10',
      bg: 'bg-blue-50 dark:bg-[#0e1422]',
      titleColor: 'text-blue-600 dark:text-blue-400',
      icon: Info,
      defaultTitle: 'Note',
    },
    tip: {
      border: 'border-l-4 border-l-emerald-500 border-slate-300 dark:border-white/10',
      bg: 'bg-emerald-50 dark:bg-[#0b161c]',
      titleColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Lightbulb,
      defaultTitle: 'Tip',
    },
    important: {
      border: 'border-l-4 border-l-indigo-500 border-slate-300 dark:border-white/10',
      bg: 'bg-indigo-50 dark:bg-[#0f1424]',
      titleColor: 'text-indigo-600 dark:text-indigo-400',
      icon: AlertCircle,
      defaultTitle: 'Important',
    },
    warning: {
      border: 'border-l-4 border-l-amber-500 border-slate-300 dark:border-white/10',
      bg: 'bg-amber-50 dark:bg-[#161414]',
      titleColor: 'text-amber-600 dark:text-amber-400',
      icon: AlertTriangle,
      defaultTitle: 'Warning',
    },
    caution: {
      border: 'border-l-4 border-l-rose-500 border-slate-300 dark:border-white/10',
      bg: 'bg-rose-50 dark:bg-[#181116]',
      titleColor: 'text-rose-600 dark:text-rose-400',
      icon: AlertTriangle,
      defaultTitle: 'Caution',
    },
    architecture: {
      border: 'border-l-4 border-l-slate-500 border-slate-300 dark:border-white/10',
      bg: 'bg-slate-100 dark:bg-[#0d1320]',
      titleColor: 'text-slate-800 dark:text-slate-300',
      icon: Info,
      defaultTitle: 'Architecture Note',
    },
  };

  const current = configs[type] || configs.note;
  const Icon = current.icon;

  return (
    <div className={`my-6 rounded-r-xl border ${current.border} ${current.bg} p-4 text-sm`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 ${current.titleColor} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0 text-slate-800 dark:text-slate-200 leading-relaxed">
          <div className={`font-bold text-xs uppercase tracking-wider ${current.titleColor} mb-1`}>
            {title || current.defaultTitle}
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">{children}</div>
        </div>
      </div>
    </div>
  );
};
