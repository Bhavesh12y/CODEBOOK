import React, { useState } from 'react';
import { Monitor, Apple, Terminal } from 'lucide-react';

interface TabItem {
  id: 'windows' | 'macos' | 'linux';
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface PlatformTabsProps {
  windowsContent: React.ReactNode;
  macContent: React.ReactNode;
  linuxContent: React.ReactNode;
  defaultTab?: 'windows' | 'macos' | 'linux';
}

export const PlatformTabs: React.FC<PlatformTabsProps> = ({
  windowsContent,
  macContent,
  linuxContent,
  defaultTab = 'windows',
}) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'macos' | 'linux'>(defaultTab);

  const tabs: TabItem[] = [
    {
      id: 'windows',
      label: 'Windows (MinGW/GCC)',
      icon: <Monitor className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
      content: windowsContent,
    },
    {
      id: 'macos',
      label: 'macOS (Clang/Xcode)',
      icon: <Apple className="w-4 h-4 text-slate-700 dark:text-slate-200" />,
      content: macContent,
    },
    {
      id: 'linux',
      label: 'Linux (GCC/Clang)',
      icon: <Terminal className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
      content: linuxContent,
    },
  ];

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1118] shadow-md overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#141722] px-2 pt-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-[#0f1118] text-slate-950 dark:text-white border-slate-900 dark:border-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5 border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6 text-slate-800 dark:text-slate-200">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
