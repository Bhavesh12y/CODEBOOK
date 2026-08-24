import { useState, useEffect } from 'react';
import { Bot, Check, Eye, Keyboard, Palette, Save, Settings, Sparkles, X, Zap } from 'lucide-react';

import { api } from '../services/api';
import type { AppTheme } from '../types/notebook';

export interface CppBookSettings {
  theme: AppTheme;
  aiEnabled: boolean;
  aiProvider: 'groq';
  groqModel: string;
  geminiModel: string;
  groqApiKey: string;
  geminiApiKey: string;
  smoothCaret: boolean;
  toolbarCaptions: boolean;
  autosave: boolean;
  continueOnError: boolean;
  shortcuts: {
    save: string;
    saveAs: string;
    runCell: string;
    newCodeCell: string;
    newMarkdownCell: string;
  };
}

interface SettingsPanelProps {
  open: boolean;
  settings: CppBookSettings;
  onClose: () => void;
  onChange: (settings: CppBookSettings) => void;
}

const themes: Array<{ id: AppTheme; name: string; note: string }> = [
  { id: 'midnight', name: 'Midnight', note: 'Default deep indigo workspace' },
  { id: 'obsidian', name: 'Obsidian', note: 'Pure dark, high contrast' },
  { id: 'dracula', name: 'Dracula', note: 'Vibrant purple & pink vampire aesthetic' },
  { id: 'onedark', name: 'One Dark Pro', note: 'Iconic Atom & VS Code dark theme' },
  { id: 'tokyonight', name: 'Tokyo Night', note: 'Deep neon Tokyo twilight' },
  { id: 'nord', name: 'Nord', note: 'Arctic, north-bluish clean palette' },
  { id: 'graphite', name: 'Graphite', note: 'Neutral charcoal dark slate' },
  { id: 'mac', name: 'macOS Dark', note: 'Refined Apple dark glass aesthetic' },
  { id: 'matrix', name: 'Matrix', note: 'Cyberpunk emerald hacker terminal' },
  { id: 'daylight', name: 'Daylight', note: 'Crisp, clean high-contrast light mode' },
];

type ProviderStatus = 'idle' | 'testing' | 'connected' | 'limited' | 'invalid';

export function SettingsPanel({ open, settings, onClose, onChange }: SettingsPanelProps) {
  const [draft, setDraft] = useState<CppBookSettings>(settings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Record<'groq' | 'gemini', { status: ProviderStatus; message: string }>>({
    groq: { status: 'idle', message: settings.groqApiKey ? 'Saved locally' : 'Not configured' },
    gemini: { status: 'idle', message: settings.geminiApiKey ? 'Saved locally' : 'Not configured' },
  });

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setSavedNotice(false);
    }
  }, [open, settings]);

  if (!open) return null;

  const update = (patch: Partial<CppBookSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    // Live apply non-destructive preferences like theme
    if (patch.theme) {
      onChange({ ...draft, ...patch });
    }
  };

  const handleSave = () => {
    onChange(draft);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
    }, 2500);
  };

  const updateShortcut = (name: keyof CppBookSettings['shortcuts'], value: string) =>
    update({ shortcuts: { ...draft.shortcuts, [name]: value } });

  const testProvider = async (provider: 'groq' | 'gemini') => {
    const apiKey = (provider === 'groq' ? draft.groqApiKey : draft.geminiApiKey).trim();
    if (!apiKey) {
      setProviderStatus((current) => ({
        ...current,
        [provider]: { status: 'invalid', message: `Paste a ${provider === 'groq' ? 'Groq' : 'Gemini'} API key first.` },
      }));
      return;
    }
    setProviderStatus((current) => ({
      ...current,
      [provider]: { status: 'testing', message: 'Testing...' },
    }));
    try {
      const result = await api.aiTestConnection({ provider, apiKey });
      setProviderStatus((current) => ({
        ...current,
        [provider]: { status: result.status, message: result.message },
      }));
    } catch (error) {
      setProviderStatus((current) => ({
        ...current,
        [provider]: { status: 'invalid', message: (error as Error).message },
      }));
    }
  };
  const statusLabel = (provider: 'groq' | 'gemini') => {
    const status = providerStatus[provider];
    if (status.status === 'connected') return 'Connected';
    if (status.status === 'limited') return 'Key valid, model blocked';
    if (status.status === 'invalid') return 'Invalid';
    if (status.status === 'testing') return 'Testing';
    return (provider === 'groq' ? draft.groqApiKey : draft.geminiApiKey) ? 'Configured' : 'Missing';
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="settings-header">
          <div className="flex items-center gap-3">
            <div className="dialog-icon">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2>Settings</h2>
              <p>Theme, editor feel, shortcuts, and AI agent setup.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition shadow-sm cursor-pointer"
              title="Save settings"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button type="button" className="icon-plain" aria-label="Close settings" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="settings-scroll">
          <section className="settings-section">
            <div className="settings-section-title">
              <Palette className="h-4 w-4" />
              <span>Theme</span>
            </div>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-choice theme-choice-${theme.id} ${draft.theme === theme.id ? 'active' : ''}`}
                  onClick={() => update({ theme: theme.id })}
                >
                  <span className="theme-swatch" />
                  <strong>{theme.name}</strong>
                  <small>{theme.note}</small>
                  {draft.theme === theme.id ? <Check className="h-4 w-4" /> : null}
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <Bot className="h-4 w-4" />
              <span>AI Provider</span>
            </div>
            <label className="settings-toggle">
              <span>
                <strong>Enable AI assistant</strong>
                <small>Use Groq (Llama 3.3 70B) for lightning-fast answers, with automatic Gemini fallback.</small>
              </span>
              <input
                type="checkbox"
                checked={draft.aiEnabled}
                onChange={(event) => update({ aiEnabled: event.target.checked })}
              />
            </label>
            <div className="settings-help-card">
              <div className="settings-link-row">
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                  Create Groq key
                </a>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                  Create Gemini key
                </a>
              </div>
              <ol>
                <li>Paste your Groq and/or Gemini API keys below.</li>
                <li>Click <strong>Test Connection</strong> to verify each key.</li>
                <li>Keys are stored securely in local settings on your machine.</li>
              </ol>
            </div>
            <div className="ai-provider-list">
              <div className="ai-provider-card">
                <div>
                  <strong>Groq API Key</strong>
                  <small>{statusLabel('groq')} · Primary fast provider</small>
                </div>
                <div className="ai-key-row">
                  <input
                    type="password"
                    value={draft.groqApiKey}
                    onChange={(event) => {
                      update({ groqApiKey: event.target.value, aiProvider: 'groq' });
                      setProviderStatus((current) => ({ ...current, groq: { status: 'idle', message: 'Saved locally' } }));
                    }}
                    placeholder="gsk_..."
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => void testProvider('groq')}>
                    Test Connection
                  </button>
                </div>
                <p className={`provider-status provider-status-${providerStatus.groq.status}`}>
                  {providerStatus.groq.message}
                </p>
              </div>
              <div className="ai-provider-card">
                <div>
                  <strong>Gemini API Key</strong>
                  <small>{statusLabel('gemini')} · Fallback provider</small>
                </div>
                <div className="ai-key-row">
                  <input
                    type="password"
                    value={draft.geminiApiKey}
                    onChange={(event) => {
                      update({ geminiApiKey: event.target.value, aiProvider: 'groq' });
                      setProviderStatus((current) => ({ ...current, gemini: { status: 'idle', message: 'Saved locally' } }));
                    }}
                    placeholder="AIza..."
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => void testProvider('gemini')}>
                    Test Connection
                  </button>
                </div>
                <p className={`provider-status provider-status-${providerStatus.gemini.status}`}>
                  {providerStatus.gemini.message}
                </p>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <Eye className="h-4 w-4" />
              <span>Editor</span>
            </div>
            <label className="settings-toggle">
              <span>
                <strong>Smooth caret animation</strong>
                <small>Gives the cursor a softer movement inside code and markdown cells.</small>
              </span>
              <input
                type="checkbox"
                checked={draft.smoothCaret}
                onChange={(event) => update({ smoothCaret: event.target.checked })}
              />
            </label>
            <label className="settings-toggle">
              <span>
                <strong>Autosave saved notebooks</strong>
                <small>Automatically save after edits once a notebook has a saved ID.</small>
              </span>
              <input
                type="checkbox"
                checked={draft.autosave}
                onChange={(event) => update({ autosave: event.target.checked })}
              />
            </label>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">
              <Keyboard className="h-4 w-4" />
              <span>Shortcuts</span>
            </div>
            <div className="shortcut-list">
              <label>
                <span>Save notebook</span>
                <input value={draft.shortcuts.save} onChange={(event) => updateShortcut('save', event.target.value)} />
              </label>
              <label>
                <span>Save as</span>
                <input value={draft.shortcuts.saveAs} onChange={(event) => updateShortcut('saveAs', event.target.value)} />
              </label>
              <label>
                <span>Run selected cell</span>
                <input value={draft.shortcuts.runCell} onChange={(event) => updateShortcut('runCell', event.target.value)} />
              </label>
              <label>
                <span>New code cell below</span>
                <input value={draft.shortcuts.newCodeCell} onChange={(event) => updateShortcut('newCodeCell', event.target.value)} />
              </label>
              <label>
                <span>New markdown below</span>
                <input value={draft.shortcuts.newMarkdownCell} onChange={(event) => updateShortcut('newMarkdownCell', event.target.value)} />
              </label>
            </div>
            <p className="settings-note-text">Defaults: Ctrl+S, Ctrl+Shift+S, Shift+Enter, Shift+N, Shift+M. Type combinations in the same style.</p>
          </section>

          <section className="settings-section settings-note">
            <Sparkles className="h-4 w-4" />
            <p>CppBook never prints API keys in status text or error messages. The desktop build should move these local settings into the OS credential vault before public release.</p>
          </section>
        </div>

        <footer className="settings-footer flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-5 py-3">
          <div className="flex items-center gap-2">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 animate-in fade-in">
                <Check className="h-4 w-4" /> Settings saved successfully!
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-md transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-md transition shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
