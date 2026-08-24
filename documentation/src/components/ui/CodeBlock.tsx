import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'cpp',
  filename,
  showLineNumbers = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="my-5 rounded-xl border border-white/10 bg-[#0a0d16] shadow-xl overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f1422] border-b border-white/5 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2 font-mono">
          <Terminal className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-slate-200 font-medium">{filename || language.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono uppercase">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-medium"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="p-4 overflow-x-auto text-sm code-font leading-relaxed">
        <pre className="text-slate-200">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                {showLineNumbers && (
                  <span className="table-cell pr-4 text-right select-none text-slate-600 text-xs w-8">
                    {idx + 1}
                  </span>
                )}
                <span className="table-cell whitespace-pre">{line}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
