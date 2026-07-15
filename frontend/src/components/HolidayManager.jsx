import { useMemo, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { ErrorBanner } from './ui.jsx';

function monthLabel(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (isNaN(d)) return 'Other';
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}
function dayLabel(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric' });
}

// Add / list / remove general school holidays, grouped by month.
export default function HolidayManager({ open, onClose, holidays, onAdd, onDelete, busy, error }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const groups = useMemo(() => {
    const map = new Map();
    for (const h of holidays || []) {
      const key = monthLabel(h.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(h);
    }
    return [...map.entries()];
  }, [holidays]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    const ok = await onAdd(name.trim(), date);
    if (ok !== false) { setName(''); setDate(''); }
  }

  return (
    <SlidePanel open={open} title="School holidays" onClose={onClose}>
      <div className="space-y-4">
        <ErrorBanner message={error} />
        <p className="text-sm text-slate-500">
          General holidays when the school is closed for everyone. These are separate from a teacher's personal leaves.
        </p>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200/80 p-4">
          <div>
            <span className="label">Holiday name</span>
            <input className="input" placeholder="e.g. Diwali" value={name} autoFocus
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <span className="label">Date</span>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            <Icon name="plus" size={16} /> Add holiday
          </button>
        </form>

        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            No holidays added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map(([month, list]) => (
              <div key={month}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{month}</p>
                <ul className="space-y-2">
                  {list.map((h) => (
                    <li key={h.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5">
                      <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Icon name="calendar" size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800">{h.name}</p>
                        <p className="text-xs text-slate-500">{dayLabel(h.date)}</p>
                      </div>
                      <button className="icon-btn text-rose-500 hover:bg-rose-50" onClick={() => onDelete(h)} aria-label="Delete holiday">
                        <Icon name="trash" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
