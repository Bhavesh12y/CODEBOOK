import React from 'react';
import { GITHUB_REPO_URL, CURRENT_VERSION } from '../../data/downloadsData';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-[#232732] bg-slate-100 dark:bg-[#08090d] text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 dark:bg-white font-mono font-bold text-white dark:text-slate-950 text-xs shadow-sm">
                C++
              </div>
              <span className="text-base font-black text-slate-950 dark:text-white">
                CPPbook
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-sm">
              An interactive Jupyter-like notebook IDE designed for C++. Open-source, local-first, and zero cloud lock-in.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-500">
                Release {CURRENT_VERSION}
              </span>
              <span className="text-slate-400">&middot;</span>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors font-medium"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Documentation */}
          <div className="space-y-2.5">
            <div className="font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 text-[11px]">
              Documentation
            </div>
            <ul className="space-y-1.5 font-medium">
              <li>
                <button type="button" onClick={() => onNavigate('/docs/get-started')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Getting Started
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/installation')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Installation
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/user-guide')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  User Guide
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/features')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Features
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture */}
          <div className="space-y-2.5">
            <div className="font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 text-[11px]">
              Architecture
            </div>
            <ul className="space-y-1.5 font-medium">
              <li>
                <button type="button" onClick={() => onNavigate('/docs/architecture')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Engine Design
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/developer-guide')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Developer Guide
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/troubleshooting')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Troubleshooting
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/faq')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Downloads & Legal */}
          <div className="space-y-2.5">
            <div className="font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 text-[11px]">
              Releases
            </div>
            <ul className="space-y-1.5 font-medium">
              <li>
                <button type="button" onClick={() => onNavigate('/downloads')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Downloads
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/releases')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Changelog
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/security')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  Security
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('/docs/license')} className="hover:text-slate-950 dark:hover:text-white transition-colors">
                  License
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-[#232732] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} CppBook Contributors. MIT License.
          </div>
          <div className="flex items-center gap-4">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium">
              Source Repository
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
