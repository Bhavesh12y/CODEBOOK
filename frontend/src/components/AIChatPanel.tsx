import { Bot, Copy, Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  open: boolean;
  busy: boolean;
  messages: ChatMessage[];
  draft?: string;
  onDraftChange?: (value: string) => void;
  width?: number;
  onWidthChange?: (width: number) => void;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function AIChatPanel({
  open,
  busy,
  messages,
  draft: externalDraft,
  onDraftChange,
  width: externalWidth,
  onWidthChange,
  onClose,
  onSend,
}: AIChatPanelProps) {
  const [internalDraft, setInternalDraft] = useState('');
  const draft = externalDraft !== undefined ? externalDraft : internalDraft;
  const setDraft = onDraftChange ?? setInternalDraft;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [internalWidth, setInternalWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('cppbook.ai_panel_width'));
      if (saved && saved >= 280 && saved <= 1200) return saved;
    } catch {
      // ignore
    }
    return 380;
  });
  const panelWidth = externalWidth ?? internalWidth;
  const setPanelWidth = onWidthChange ?? setInternalWidth;

  const isResizingRef = useRef(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startX - moveEvent.clientX;
      const maxAllowed = Math.max(400, Math.floor(window.innerWidth * 0.75));
      const newWidth = Math.max(280, Math.min(startWidth + deltaX, maxAllowed));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      try {
        localStorage.setItem('cppbook.ai_panel_width', String(panelWidth));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const nextHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 56), 280);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [draft, open]);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [open, externalDraft]);

  if (!open) return null;

  const renderMessage = (content: string) => {
    const parts = content.split(/```([\s\S]*?)```/g);
    return parts.map((part, index) => {
      if (index % 2 === 0) {
        return <pre key={index} className="whitespace-pre-wrap font-sans">{part}</pre>;
      }
      const code = part.replace(/^[A-Za-z0-9_+-]+\n/, '');
      return (
        <div key={index} className="ai-code-box">
          <button type="button" onClick={() => void navigator.clipboard.writeText(code)}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <pre>{code}</pre>
        </div>
      );
    });
  };

  return (
    <aside className="relative flex h-full w-full min-h-0 min-w-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {/* Left Resizer Drag Handle */}
      <div
        className="absolute top-0 bottom-0 -left-1.5 w-3 cursor-col-resize z-20 group hover:bg-indigo-500/20 active:bg-indigo-500/40 transition-colors flex items-center justify-center select-none"
        onMouseDown={startResizing}
        title="Drag to resize AI window"
      >
        <div className="w-0.5 h-8 rounded-full bg-[var(--border-subtle)] group-hover:bg-indigo-400 transition-colors" />
      </div>

      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">AI Assistant</h2>
          <p className="text-[11px] text-[var(--text-secondary)]">Ask about cells, errors, or the full notebook</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] shadow-sm transition cursor-pointer"
          onClick={onClose}
          aria-label="Close AI chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
            Try: &quot;Fix the error in cell 2&quot; or &quot;Explain this notebook&quot;
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border px-3 py-2 text-sm leading-relaxed shadow-sm ${
              message.role === 'user'
                ? 'ml-6 border-indigo-500/30 bg-indigo-500/10 text-[var(--text-primary)]'
                : 'mr-6 border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]'
            }`}
          >
            <div className="mb-1 text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-semibold">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </div>
            {renderMessage(message.content)}
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            Thinking...
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const text = draft.trim();
          if (!text || busy) return;
          onSend(text);
          setDraft('');
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500/50 placeholder:text-[var(--text-secondary)] shadow-sm font-mono leading-relaxed"
            placeholder="Ask the AI assistant (Shift+Enter for newline)..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const text = draft.trim();
                if (!text || busy) return;
                onSend(text);
                setDraft('');
              }
            }}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-600 dark:bg-indigo-500/20 px-3 text-xs font-semibold uppercase tracking-wide text-white dark:text-indigo-200 hover:bg-indigo-700 dark:hover:bg-indigo-500/30 disabled:opacity-45 shadow-sm transition cursor-pointer shrink-0"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
