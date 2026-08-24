import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Apple,
  Terminal,
  Copy,
  Check,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import {
  DOWNLOAD_ASSETS,
  detectUserPlatform,
} from '../data/downloadsData';
import { MacOSInstallInstructions } from '../components/ui/MacOSInstallInstructions';
import { WindowsInstallInstructions } from '../components/ui/WindowsInstallInstructions';

interface DownloadsPageProps {
  onNavigateRoute: (route: string) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ onNavigateRoute }) => {
  const userPlatform = detectUserPlatform();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyChecksum = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getRecommendedFile = () => {
    if (userPlatform === 'windows') {
      return {
        name: 'CppBook for Windows (64-bit)',
        filename: 'CppBook.Setup.1.0.0.exe',
        type: 'NSIS Installer (.exe)',
        arch: 'x64 (64-bit Intel/AMD)',
        size: '84.2 MB',
        downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook.Setup.1.0.0.exe',
        icon: <Monitor className="w-7 h-7 text-blue-500 dark:text-blue-400" />,
        platform: 'windows',
      };
    }
    if (userPlatform === 'macos') {
      return {
        name: 'CppBook for macOS (Apple Silicon)',
        filename: 'CppBook-1.0.0-arm64.dmg',
        type: 'Apple Disk Image (.dmg)',
        arch: 'ARM64 (Apple M1/M2/M3/M4)',
        size: '89.4 MB',
        downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0-arm64.dmg',
        icon: <Apple className="w-7 h-7 text-slate-700 dark:text-slate-200" />,
        platform: 'macos',
      };
    }
    return {
      name: 'CppBook for Linux',
      filename: 'CppBook-1.0.0.AppImage',
      type: 'Universal AppImage',
      arch: 'x64 (64-bit)',
      size: '87.6 MB',
      downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0.AppImage',
      icon: <Terminal className="w-7 h-7 text-amber-500 dark:text-amber-400" />,
      platform: 'linux',
    };
  };

  const rec = getRecommendedFile();

  return (
    <div className="min-h-screen relative">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-16 space-y-12">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
            Download CppBook
          </h1>
          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
            Standalone native packages for Windows, macOS, and Linux. Built with embedded runtime dependencies and native C++ compiler execution.
          </p>
        </div>

        {/* Recommended OS Hero Card */}
        <div className="doc-card rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-start sm:items-center gap-6">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0">
                {rec.icon}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/15">
                    Detected System
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{rec.size}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                  {rec.name}
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 max-w-xl leading-relaxed">
                  Standalone desktop application with embedded local FastAPI engine, Monaco Editor, and automatic workspace manager.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
                  <span>File: <strong className="text-slate-950 dark:text-slate-200">{rec.filename}</strong></span>
                  <span>&bull;</span>
                  <span>Format: <strong className="text-slate-950 dark:text-slate-200">{rec.type}</strong></span>
                  <span>&bull;</span>
                  <span>Arch: <strong className="text-slate-950 dark:text-slate-200">{rec.arch}</strong></span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
              <a
                href={rec.downloadUrl}
                className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Download {rec.filename}</span>
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                100% Free &amp; Open Source &middot; Zero Cloud Lock-in
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Platform-Specific Instructions based strictly on Detected OS */}
        <div className="space-y-4">
          {rec.platform === 'macos' && <MacOSInstallInstructions />}
          {rec.platform === 'windows' && <WindowsInstallInstructions />}
        </div>

        {/* All Platform Installers Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">All Platform Installers</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Download specific architectures or portable bundles for other operating systems.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateRoute('/releases')}
              className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-300 hover:underline flex items-center gap-1 font-mono cursor-pointer"
            >
              <span>Release Archive</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DOWNLOAD_ASSETS.map((asset, idx) => (
              <div
                key={idx}
                className="doc-card rounded-2xl p-7 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-950 dark:text-white">
                        {asset.platform === 'windows' ? (
                          <Monitor className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        ) : asset.platform === 'macos' ? (
                          <Apple className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                        ) : (
                          <Terminal className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-950 dark:text-white text-lg">{asset.platformName}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{asset.arch}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-900 dark:text-white px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 font-bold">
                      {asset.size}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-[#090b10] p-4 rounded-xl border border-slate-200 dark:border-white/5 leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Binary File:</span>
                      <span className="text-slate-950 dark:text-slate-100 font-bold truncate max-w-[240px]">{asset.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Package Format:</span>
                      <span className="text-slate-800 dark:text-slate-300">{asset.fileType}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">SHA-256 Checksum:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyChecksum(asset.checksum || '', idx)}
                        className="text-slate-900 dark:text-slate-300 hover:underline flex items-center gap-1.5 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy SHA-256</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <a
                  href={asset.downloadUrl}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 border border-slate-900 dark:border-white/10 font-bold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {asset.filename}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Toolchain Requirements Grid */}
        <div className="doc-card rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              C++ Compiler Toolchain Prerequisites
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl font-medium">
              CppBook compiles and executes your code locally using standard C++ compiler toolchains. Ensure one is accessible on your system PATH:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#090b10] border border-slate-200 dark:border-white/5 space-y-2">
              <div className="font-bold text-slate-950 dark:text-white text-base">Windows Toolchain</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Install <strong>MinGW-w64 GCC</strong> via MSYS2 UCRT64 terminal:
              </p>
              <code className="block p-2 rounded bg-slate-900 text-slate-100 text-[11px] font-mono">
                pacman -S --needed mingw-w64-ucrt-x86_64-gcc
              </code>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#090b10] border border-slate-200 dark:border-white/5 space-y-2">
              <div className="font-bold text-slate-950 dark:text-white text-base">macOS Toolchain</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Install <strong>Apple Clang</strong> with Xcode Command Line Tools:
              </p>
              <code className="block p-2 rounded bg-slate-900 text-slate-100 text-[11px] font-mono">
                xcode-select --install
              </code>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#090b10] border border-slate-200 dark:border-white/5 space-y-2">
              <div className="font-bold text-slate-950 dark:text-white text-base">Linux Toolchain</div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Install <strong>GCC</strong> with your standard package manager:
              </p>
              <code className="block p-2 rounded bg-slate-900 text-slate-100 text-[11px] font-mono">
                sudo apt install g++ build-essential
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
