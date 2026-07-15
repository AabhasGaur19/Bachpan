import { useEffect, useMemo, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Field, Spinner, ErrorBanner } from './ui.jsx';
import { money, perDay } from '../lib/format.js';
import { api } from '../lib/api.js';

const FREE_PER_MONTH = 1;

function monthLabel(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Leave register for one teacher: add/remove leaves, see how many are charged.
export default function TeacherLeaves({ teacher, onClose, onChanged }) {
  const [leaves, setLeaves] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), reason: '' });

  const open = !!teacher;

  async function load() {
    if (!teacher) return;
    setError('');
    try { setLeaves(await api.listLeaves(teacher.id)); }
    catch (e) { setError(e.message); setLeaves([]); }
  }

  useEffect(() => {
    setLeaves(null);
    setForm({ date: new Date().toISOString().slice(0, 10), reason: '' });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id]);

  const stats = useMemo(() => {
    const list = leaves || [];
    const month = new Date().toISOString().slice(0, 7); // current month only
    const taken = list.filter((l) => String(l.date).slice(0, 7) === month).length;
    const chargeable = Math.max(taken - FREE_PER_MONTH, 0);
    const salary = Number(teacher?.salary) || 0;
    const deduction = Math.round(perDay(salary) * chargeable);
    return { taken, chargeable, free: taken - chargeable, deduction, net: Math.max(salary - deduction, 0) };
  }, [leaves, teacher]);

  const thisMonthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.date) return setError('Pick a date');
    setBusy(true); setError('');
    try {
      await api.addLeave(teacher.id, form);
      setForm({ date: new Date().toISOString().slice(0, 10), reason: '' });
      await load(); onChanged?.();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function handleRemove(l) {
    if (!confirm(`Remove leave on ${l.date}?`)) return;
    setError('');
    try { await api.removeLeave(teacher.id, l.id); await load(); onChanged?.(); }
    catch (e) { setError(e.message); }
  }

  return (
    <SlidePanel open={open} title={teacher ? `Leaves · ${teacher.name}` : 'Leaves'} onClose={onClose}>
      {teacher && (
        <div className="space-y-5">
          <ErrorBanner message={error} />

          {/* Summary — current month only */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {thisMonthLabel}
            </p>
            <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Taken</p>
                <p className="mt-1 font-semibold text-slate-900">{stats.taken}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Free</p>
                <p className="mt-1 font-semibold text-emerald-600">{stats.free}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Charged</p>
                <p className="mt-1 font-semibold text-rose-600">{stats.chargeable}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>Salary deduction</span>
                <span className="text-rose-600">− {money(stats.deduction)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Net payable</span>
                <span className="font-semibold text-emerald-600">{money(stats.net)}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              1 free leave per month; extra leaves are deducted. Resets automatically each month.
            </p>
          </div>

          {/* Add leave */}
          <form onSubmit={handleAdd} className="rounded-2xl border border-slate-200/80 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Record a leave</p>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Date">
                <input type="date" className="input" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Reason (optional)">
                <input className="input" value={form.reason} placeholder="Sick, personal…"
                  onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </Field>
            </div>
            <button type="submit" className="btn-primary mt-3 w-full" disabled={busy}>
              <Icon name="plus" size={16} /> {busy ? 'Adding…' : 'Add leave'}
            </button>
          </form>

          {/* History */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Leave history</p>
            {leaves === null ? (
              <Spinner />
            ) : leaves.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No leaves recorded yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {leaves.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon name="calendar" size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">{monthLabel(l.date)}</p>
                      {l.reason && <p className="truncate text-xs text-slate-500">{l.reason}</p>}
                    </div>
                    <button className="icon-btn text-rose-500 hover:bg-rose-50" onClick={() => handleRemove(l)} aria-label="Remove leave">
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
