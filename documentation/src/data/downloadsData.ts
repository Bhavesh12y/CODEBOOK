import { ReleaseAsset, PlatformSpec } from '../types/docs';

export const CURRENT_VERSION = 'v1.0.0';
export const RELEASE_DATE = 'August 2026';
export const GITHUB_REPO_URL = 'https://github.com/Bhavesh12y/cppbook';

export const DOWNLOAD_ASSETS: ReleaseAsset[] = [
  {
    platform: 'windows',
    platformName: 'Windows 64-bit',
    arch: 'x64',
    filename: 'CppBook.Setup.1.0.0.exe',
    size: '84.2 MB',
    fileType: 'NSIS Installer (.exe)',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook.Setup.1.0.0.exe',
    checksum: 'placeholder_sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isRecommendedFor: ['win32'],
    icon: 'windows',
  },
  {
    platform: 'macos',
    platformName: 'macOS Apple Silicon',
    arch: 'arm64 (M1/M2/M3/M4)',
    filename: 'CppBook-1.0.0-arm64.dmg',
    size: '89.4 MB',
    fileType: 'Apple Disk Image (.dmg)',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0-arm64.dmg',
    checksum: 'placeholder_sha256_7110eda4d09e062aa5e4a390b0a572ac0d2c0220',
    icon: 'apple',
  },
  {
    platform: 'macos',
    platformName: 'macOS Intel',
    arch: 'x64 (Intel Core)',
    filename: 'CppBook-1.0.0.dmg',
    size: '92.1 MB',
    fileType: 'Apple Disk Image (.dmg)',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0.dmg',
    checksum: 'placeholder_sha256_b2c45d37651a243a4e4d6a1b2c45d37651a243a4',
    icon: 'apple',
  },
  {
    platform: 'linux',
    platformName: 'Linux AppImage',
    arch: 'x64',
    filename: 'CppBook-1.0.0.AppImage',
    size: '87.6 MB',
    fileType: 'Universal Linux AppImage',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0.AppImage',
    checksum: 'placeholder_sha256_c3ab8ff13720e8ad9047dd39466b3c8974e592c2',
    isRecommendedFor: ['linux'],
    icon: 'linux',
  },
];

export const PLATFORM_SPECS: PlatformSpec[] = [
  {
    os: 'windows',
    name: 'Windows',
    supportedVersions: 'Windows 10, 11 (64-bit)',
    arch: ['x64'],
    compiler: 'MinGW-w64 GCC (auto-check provided) or MSVC',
    packageType: 'NSIS Installer (.exe)',
    installerFile: 'CppBook.Setup.1.0.0.exe',
    installCommand: 'CppBook.Setup.1.0.0.exe',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook.Setup.1.0.0.exe',
  },
  {
    os: 'macos',
    name: 'macOS',
    supportedVersions: 'macOS 12 Monterey or newer',
    arch: ['Apple Silicon (ARM64)', 'Intel (x64)'],
    compiler: 'Clang / Xcode Command Line Tools (xcode-select --install)',
    packageType: 'Apple Disk Image (.dmg)',
    installerFile: 'CppBook-1.0.0-arm64.dmg / CppBook-1.0.0.dmg',
    installCommand: 'Open .dmg and drag CppBook to Applications',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0-arm64.dmg',
  },
  {
    os: 'linux',
    name: 'Linux',
    supportedVersions: 'Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux',
    arch: ['x64'],
    compiler: 'g++ or clang++ via system package manager',
    packageType: 'AppImage',
    installerFile: 'CppBook-1.0.0.AppImage',
    installCommand: 'chmod +x CppBook-1.0.0.AppImage && ./CppBook-1.0.0.AppImage',
    downloadUrl: 'https://github.com/Bhavesh12y/cppbook/releases/download/v1.0.0/CppBook-1.0.0.AppImage',
  },
];

export function detectUserPlatform(): 'windows' | 'macos' | 'linux' {
  if (typeof window === 'undefined' || !window.navigator) return 'windows';
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('mac') || ua.includes('darwin')) return 'macos';
  if (ua.includes('linux') || ua.includes('x11')) return 'linux';
  return 'windows';
}
