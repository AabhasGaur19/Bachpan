import { useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { ErrorBanner } from './ui.jsx';

// Add / list / remove class names. Controlled by the parent (owns the data).
export default function ClassManager({ open, onClose, classes, onAdd, onDelete, busy, error }) {
  const [name, setName] = useState('');

  async function submit(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    const ok = await onAdd(n);
    if (ok !== false) setName('');
  }

  return (
    <SlidePanel open={open} title="Manage classes" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={error} />
        <p className="text-sm text-slate-500">
          Add the classes in your school. They appear in the class dropdown when adding students and teachers.
        </p>

        <form onSubmit={submit} className="flex gap-2">
          <input className="input" placeholder="e.g. Sixth" value={name} autoFocus
            onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={busy}>
            <Icon name="plus" size={16} /> Add
          </button>
        </form>

        {!classes || classes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            No classes yet — add your first one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {classes.map((c, idx) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {idx + 1}
                </span>
                <span className="flex-1 font-medium text-slate-800">{c.name}</span>
                <button className="icon-btn text-rose-500 hover:bg-rose-50" onClick={() => onDelete(c)} aria-label="Delete class">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SlidePanel>
  );
}
