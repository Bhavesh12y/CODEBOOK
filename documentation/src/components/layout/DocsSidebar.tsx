import React, { useState } from 'react';
import { DOC_SECTIONS, DOC_CATEGORIES } from '../../data/docsContent';

interface DocsSidebarProps {
  currentSectionId: string;
  onSelectSection: (sectionId: string) => void;
  onCloseMobile?: () => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  currentSectionId,
  onSelectSection,
  onCloseMobile,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSections = filterQuery
    ? DOC_SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : DOC_SECTIONS;

  const handleItemClick = (sectionId: string) => {
    onSelectSection(sectionId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-full flex flex-col h-full bg-transparent text-sm">
      {/* Sidebar Search Filter */}
      <div className="pb-5 pt-1">
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter topics..."
          className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#13161f] px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 outline-none focus:border-slate-500 dark:focus:border-white/30 transition-colors"
        />
      </div>

      {/* Categories & Sections */}
      <div className="flex-1 overflow-y-auto space-y-7 pr-2">
        {DOC_CATEGORIES.map((category) => {
          const categorySections = filteredSections.filter((s) => s.category === category);
          if (categorySections.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">
                {category}
              </div>

              <div className="space-y-1">
                {categorySections.map((section) => {
                  const isActive = currentSectionId === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleItemClick(section.id)}
                      className={`w-full text-left py-2 px-3.5 rounded-xl text-xs sm:text-sm transition-all block truncate font-medium ${
                        isActive
                          ? 'text-slate-950 dark:text-white bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/15 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                      }`}
                    >
                      {section.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
