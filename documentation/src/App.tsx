import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { DocsLayout } from './components/layout/DocsLayout';
import { SearchModal } from './components/ui/SearchModal';
import { InteractiveBackground } from './components/ui/InteractiveBackground';
import { HomePage } from './pages/HomePage';
import { DocsOverviewPage } from './pages/DocsOverviewPage';
import { DocPage } from './pages/DocPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { ReleasesPage } from './pages/ReleasesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DOC_SECTIONS } from './data/docsContent';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      return hash.startsWith('/') ? hash : `/${hash}`;
    }
    return '/';
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Theme state: defaults to 'dark'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cppbook_docs_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('cppbook_docs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const cleanRoute = hash.startsWith('/') ? hash : `/${hash}`;
      setCurrentRoute(cleanRoute || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global keydown for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (route: string) => {
    let clean = route;
    if (clean.startsWith('#')) clean = clean.substring(1);
    if (!clean.startsWith('/')) clean = `/${clean}`;

    window.location.hash = clean;
    setCurrentRoute(clean);

    if (clean.includes('#')) {
      const parts = clean.split('#');
      const headingId = parts[1];
      setTimeout(() => {
        const el = document.getElementById(headingId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateSection = (sectionId: string) => {
    navigateTo(`/docs/${sectionId}`);
  };

  // Render active route
  const renderContent = () => {
    const basePath = currentRoute.split('#')[0].replace(/\/$/, '');

    if (basePath === '' || basePath === '/') {
      return <HomePage onNavigate={navigateTo} />;
    }

    if (basePath === '/downloads') {
      return <DownloadsPage onNavigateRoute={navigateTo} />;
    }

    if (basePath === '/releases') {
      return <ReleasesPage onNavigateRoute={navigateTo} />;
    }

    if (basePath === '/docs' || basePath === '/documentation') {
      return (
        <DocsOverviewPage
          onNavigateSection={handleNavigateSection}
          onNavigateRoute={navigateTo}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      );
    }

    if (basePath.startsWith('/docs/')) {
      const sectionId = basePath.replace('/docs/', '');
      const matchedSection = DOC_SECTIONS.find((s) => s.id === sectionId);

      if (matchedSection) {
        return (
          <DocsLayout
            currentSection={matchedSection}
            onNavigateSection={handleNavigateSection}
            onNavigateRoute={navigateTo}
          >
            <DocPage
              section={matchedSection}
              onNavigateSection={handleNavigateSection}
              onNavigateRoute={navigateTo}
            />
          </DocsLayout>
        );
      }
    }

    return <NotFoundPage onNavigateRoute={navigateTo} />;
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 relative">
      {/* Interactive Cursor Spotlight and Particle Mesh Background */}
      <InteractiveBackground theme={theme} />

      {/* Persistent 100% Transparent Header */}
      <Header
        currentRoute={currentRoute}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={navigateTo}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Top Dissolve Gradient Mask Overlay (Fades out scrolling content under the navbar) */}
      <div
        className="fixed top-0 left-0 right-0 h-24 z-30 pointer-events-none transition-colors"
        style={{
          background:
            theme === 'dark'
              ? 'linear-gradient(to bottom, rgba(8, 9, 13, 0.95) 0%, rgba(8, 9, 13, 0.75) 45%, rgba(8, 9, 13, 0) 100%)'
              : 'linear-gradient(to bottom, rgba(248, 250, 252, 0.95) 0%, rgba(248, 250, 252, 0.75) 45%, rgba(248, 250, 252, 0) 100%)',
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 pt-12 sm:pt-16">
        {renderContent()}
      </div>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Global Quick Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateTo}
      />
    </div>
  );
}

export default App;
