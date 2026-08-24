import React, { useEffect, useState } from 'react';
import { AlignLeft, ArrowUpRight, Github, MessageSquare, Download } from 'lucide-react';
import { DocHeading } from '../../types/docs';
import { GITHUB_REPO_URL } from '../../data/downloadsData';

interface DocsTOCProps {
  headings: DocHeading[];
  onNavigate: (route: string) => void;
}

export const DocsTOC: React.FC<DocsTOCProps> = ({ headings, onNavigate }) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveHeadingId(visibleEntries[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveHeadingId(id);
    }
  };

  if (!headings || headings.length === 0) return null;

  return (
    <div className="w-full text-xs space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
          <AlignLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>On this page</span>
        </div>

        <nav className="space-y-1.5 border-l border-slate-200 dark:border-white/10 pl-3.5">
          {headings.map((heading) => {
            const isActive = activeHeadingId === heading.id;
            return (
              <button
                key={heading.id}
                type="button"
                onClick={() => scrollToHeading(heading.id)}
                className={`block w-full text-left py-1 transition-all truncate ${
                  isActive
                    ? 'text-slate-950 dark:text-white font-bold translate-x-1 -ml-3.5 pl-3.5 border-l-2 border-slate-900 dark:border-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                } ${heading.level === 3 ? 'pl-3 text-[11px]' : 'text-xs'}`}
              >
                {heading.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Action Links */}
      <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Github className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white" />
            <span>Edit on GitHub</span>
          </span>
          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-950 dark:group-hover:text-slate-200" />
        </a>

        <button
          type="button"
          onClick={() => onNavigate('/docs/troubleshooting')}
          className="flex items-center justify-between w-full text-left text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white" />
            <span>Troubleshooting</span>
          </span>
          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-950 dark:group-hover:text-slate-200" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/downloads')}
          className="flex items-center justify-between w-full text-left text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors group"
        >
          <span className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-950 dark:group-hover:text-white" />
            <span>Download Release</span>
          </span>
          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-950 dark:group-hover:text-slate-200" />
        </button>
      </div>
    </div>
  );
};
