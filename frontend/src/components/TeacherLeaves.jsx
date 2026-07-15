import { useEffect, useMemo, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Field, Spinner, ErrorBanner } from './ui.jsx';
import { money, perDay, leaveMonthStats, unusedPaidLeaves, monthName } from '../lib/format.js';
import { api } from '../lib/api.js';

const todayStr = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value} type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition ${
            value === o.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TeacherLeaves({ teacher, onClose, onChanged }) {
  const [leaves, setLeaves] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('single');   // 'single' | 'range'
  const [type, setType] = useState('full');      // 'full' | 'half'
  const [date, setDate] = useState(todayStr());
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [reason, setReason] = useState('');

  const open = !!teacher;

  async function load() {
    if (!teacher) return;
    setError('');
    try { setLeaves(await api.listLeaves(teacher.id)); }
    catch (e) { setError(e.message); setLeaves([]); }
  }

  useEffect(() => {
    setLeaves(null);
    setMode('single'); setType('full'); setReason('');
    setDate(todayStr()); setFrom(todayStr()); setTo(todayStr());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id]);

  const salary = Number(teacher?.salary) || 0;

  const stats = useMemo(() => {
    const s = leaveMonthStats(leaves || [], thisMonth());
    const deduction = Math.round(perDay(salary) * s.chargeableDays);
    return { ...s, deduction, net: Math.max(salary - deduction, 0) };
  }, [leaves, salary]);

  const carry = useMemo(
    () => unusedPaidLeaves(leaves || [], teacher?.join_date),
    [leaves, teacher]
  );
  const carryValue = Math.round(perDay(salary) * carry.count);
  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (mode === 'range') {
        if (!from || !to) throw new Error('Pick both dates');
        await api.addLeaveRange(teacher.id, { from, to, reason });
      } else {
        if (!date) throw new Error('Pick a date');
        await api.addLeave(teacher.id, { date, type, reason });
      }
      setReason('');
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

          {/* This month */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{monthLabel}</p>
            <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Full</p>
                <p className="mt-1 font-semibold text-slate-900">{stats.full}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Half</p>
                <p className="mt-1 font-semibold text-slate-900">{stats.half}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Charged</p>
                <p className="mt-1 font-semibold text-rose-600">{stats.chargeableDays} d</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>Paid leave used</span>
                <span className="text-emerald-600">{stats.paidUsed} of 1</span>
              </div>
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
              1 paid full-day leave per month. Half-days are charged 0.5 day and are never free.
            </p>
          </div>

          {/* Carry-over / encashment */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Unused paid leaves</p>
                <p className="text-xs text-slate-500">Encashable at session end</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-emerald-700">{carry.count}</p>
                <p className="text-xs text-emerald-600">≈ {money(carryValue)}</p>
              </div>
            </div>
            {carry.months.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {carry.months.map((m) => <span key={m} className="badge-green">{monthName(m)}</span>)}
              </div>
            )}
          </div>

          {/* Add leave */}
          <form onSubmit={handleAdd} className="rounded-2xl border border-slate-200/80 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Record a leave</p>

            <Segmented
              options={[{ label: 'Single day', value: 'single' }, { label: 'Date range', value: 'range' }]}
              value={mode} onChange={setMode}
            />

            {mode === 'single' ? (
              <div className="mt-3 space-y-3">
                <Field label="Date">
                  <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                </Field>
                <div>
                  <span className="label">Leave type</span>
                  <Segmented
                    options={[{ label: 'Full day', value: 'full' }, { label: 'Half day', value: 'half' }]}
                    value={type} onChange={setType}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="From">
                  <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
                </Field>
                <Field label="To">
                  <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
                </Field>
                <p className="col-span-2 -mt-1 text-xs text-slate-400">Adds a full-day leave for each date in the range.</p>
              </div>
            )}

            <div className="mt-3">
              <Field label="Reason (optional)">
                <input className="input" value={reason} placeholder="Sick, personal…"
                  onChange={(e) => setReason(e.target.value)} />
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
                      <p className="flex items-center gap-2 font-medium text-slate-800">
                        {l.date}
                        {l.type === 'half'
                          ? <span className="badge-amber">Half</span>
                          : <span className="badge-slate">Full</span>}
                      </p>
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
