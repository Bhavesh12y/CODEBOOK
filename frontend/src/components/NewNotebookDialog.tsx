import { FilePlus2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

interface NewNotebookDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: { name: string; description: string }) => void;
}

export function NewNotebookDialog({ open, onClose, onCreate }: NewNotebookDialogProps) {
  const [name, setName] = useState('Untitled');
  const [description, setDescription] = useState('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('Untitled');
    setDescription('');
    window.setTimeout(() => nameInputRef.current?.select(), 0);
  }, [open]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onCreate({ name: name.trim() || 'Untitled', description: description.trim() });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="new-notebook-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="dialog-icon">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create New C++ Notebook</h2>
              <p className="mt-1 text-xs text-slate-400">Name it first so recent notebooks stay readable.</p>
            </div>
          </div>
          <button type="button" className="icon-plain" aria-label="Close dialog" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="dialog-field">
          <span>Name</span>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Data structures practice"
          />
        </label>

        <label className="dialog-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this notebook for?"
            rows={3}
          />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" className="home-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="home-primary-button">
            <FilePlus2 className="h-4 w-4" />
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
