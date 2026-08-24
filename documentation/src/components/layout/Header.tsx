import React, { useState } from 'react';
import { Download, Github, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { GITHUB_REPO_URL } from '../../data/downloadsData';

interface HeaderProps {
  currentRoute: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (route: string) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  theme,
  onToggleTheme,
  onNavigate,
  onOpenSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Documentation', route: '/docs' },
    { label: 'User Guide', route: '/docs/user-guide' },
    { label: 'Features', route: '/docs/features' },
    { label: 'Architecture', route: '/docs/architecture' },
    { label: 'Downloads', route: '/downloads' },
    { label: 'Releases', route: '/releases' },
  ];

  const handleNavClick = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent border-b border-transparent pointer-events-none">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-10 pointer-events-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-10">
          <button
            type="button"
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-mono font-bold text-xs shadow-md">
              C++
            </div>
            <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white drop-shadow-sm">
              CPP<span className="text-slate-500 dark:text-slate-400">book</span>
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route !== '/' && currentRoute.startsWith(link.route) && link.route !== '/docs');
              return (
                <button
                  key={link.route}
                  type="button"
                  onClick={() => handleNavClick(link.route)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'text-slate-950 dark:text-white font-bold bg-slate-200/50 dark:bg-white/10 shadow-sm backdrop-blur-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-300/80 dark:border-white/15 bg-white/40 dark:bg-black/30 backdrop-blur-md text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-white/30 transition-colors shadow-sm cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline font-medium">Search docs...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100/80 dark:bg-white/10 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
              Ctrl+K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-slate-300/80 dark:border-white/15 bg-white/40 dark:bg-black/30 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors shadow-sm cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Daylight' : 'Graphite'} theme`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* GitHub Repo */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center p-2 rounded-lg border border-slate-300/80 dark:border-white/15 bg-white/40 dark:bg-black/30 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors shadow-sm"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Download CTA Button */}
          <button
            type="button"
            onClick={() => handleNavClick('/downloads')}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-300 dark:border-[#272b36] bg-white/80 dark:bg-[#13151b]/80 backdrop-blur-md text-slate-700 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-[#272b36] bg-white/95 dark:bg-[#13151b]/95 backdrop-blur-xl px-6 py-4 space-y-3 shadow-xl pointer-events-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-[#272b36] bg-slate-50 dark:bg-[#181b22] text-xs text-slate-800 dark:text-slate-200 font-medium"
            >
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Search Docs</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-[#272b36] bg-slate-50 dark:bg-[#181b22] text-slate-700 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-[#272b36] bg-slate-50 dark:bg-[#181b22] text-xs text-slate-700 dark:text-slate-300 px-4"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-1 pt-1">
            {navLinks.map((link) => (
              <button
                key={link.route}
                type="button"
                onClick={() => handleNavClick(link.route)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentRoute === link.route
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-950 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#272b36]">
            <button
              type="button"
              onClick={() => handleNavClick('/downloads')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download CppBook</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
