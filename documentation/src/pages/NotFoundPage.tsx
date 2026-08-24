import React from 'react';
import { FileQuestion, Home, BookOpen, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateRoute: (route: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateRoute }) => {
  return (
    <div className="bg-[#05070c] text-slate-100 min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest">
            Error 404
          </span>
          <h1 className="text-3xl font-black text-white">Documentation Page Not Found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The documentation topic or section you requested does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateRoute('/')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateRoute('/docs')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-[#0a0d16] hover:bg-[#0f1422] text-slate-200 font-semibold text-xs transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explore Documentation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
