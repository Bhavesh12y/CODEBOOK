import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, ChevronRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { SEARCH_INDEX } from '../../data/searchIndex';
import { SearchResultItem } from '../../types/docs';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or shortcut
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();
  const results = normalizedQuery
    ? SEARCH_INDEX.filter((item) => {
        return (
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.excerpt.toLowerCase().includes(normalizedQuery) ||
          item.category.toLowerCase().includes(normalizedQuery) ||
          item.keywords?.some((k) => k.toLowerCase().includes(normalizedQuery))
        );
      })
    : SEARCH_INDEX.slice(0, 6);

  const handleSelect = (item: SearchResultItem) => {
    onNavigate(item.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl border border-indigo-500/20 bg-[#0d111d] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#0f1422] gap-3">
          <Search className="w-5 h-5 text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation, guides, APIs, compilers..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1 divide-y divide-white/5">
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-brand-500/15 border border-brand-500/30 text-white'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-brand-500/20 text-brand-300' : 'bg-white/5 text-slate-400'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 font-semibold uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center text-slate-500">
                    {isSelected ? (
                      <CornerDownLeft className="w-4 h-4 text-brand-400 animate-pulse" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for &quot;compiler&quot;, &quot;shortcuts&quot;, &quot;macOS&quot;, or &quot;architecture&quot;</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#0a0d16] border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">↵</kbd> to select</span>
          </div>
          <span>CppBook Documentation Search</span>
        </div>
      </div>
    </div>
  );
};
