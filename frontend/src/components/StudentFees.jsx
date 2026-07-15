import { useEffect, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Field, RowsSkeleton, ErrorBanner } from './ui.jsx';
import { money } from '../lib/format.js';
import { api } from '../lib/api.js';

// Fee history + add/remove payments for one student.
export default function StudentFees({ student, onClose, onChanged }) {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '' });

  const open = !!student;

  async function load() {
    if (!student) return;
    setError('');
    try { setPayments(await api.listPayments(student.id)); }
    catch (e) { setError(e.message); setPayments([]); }
  }

  useEffect(() => {
    setPayments(null);
    setForm({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '' });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  const total = Number(student?.total_fees) || 0;
  const paid = (payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const left = Math.max(total - paid, 0);
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

  async function handleAdd(e) {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setError('Enter an amount greater than 0');
    setBusy(true); setError('');
    try {
      await api.addPayment(student.id, form);
      setForm({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '' });
      await load(); onChanged?.();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function handleRemove(p) {
    if (!confirm(`Remove payment of ${money(p.amount)}?`)) return;
    setError('');
    try { await api.removePayment(student.id, p.id); await load(); onChanged?.(); }
    catch (e) { setError(e.message); }
  }

  return (
    <SlidePanel open={open} title={student ? `Fees · ${student.name}` : 'Fees'} onClose={onClose}>
      {student && (
        <div className="space-y-5">
          <ErrorBanner message={error} />

          {/* Summary */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 font-semibold text-slate-900">{money(total)}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Paid</p>
                <p className="mt-1 font-semibold text-emerald-600">{money(paid)}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Left</p>
                <p className={`mt-1 font-semibold ${left > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {left > 0 ? money(left) : 'Paid'}
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${left > 0 ? 'bg-brand-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-right text-xs text-slate-400">{pct}% collected</p>
          </div>

          {/* Add payment */}
          <form onSubmit={handleAdd} className="rounded-2xl border border-slate-200/80 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Record a payment</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)">
                <input type="number" min="1" className="input" value={form.amount} autoFocus placeholder="10000"
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Date">
                <input type="date" className="input" value={form.paid_on}
                  onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Note (optional)">
                <input className="input" value={form.note} placeholder="Term 1, cash, cheque #…"
                  onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </Field>
            </div>
            <button type="submit" className="btn-primary mt-3 w-full" disabled={busy}>
              <Icon name="plus" size={16} /> {busy ? 'Adding…' : 'Add payment'}
            </button>
          </form>

          {/* History */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment history</p>
            {payments === null ? (
              <RowsSkeleton />
            ) : payments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No payments recorded yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {payments.map((p, idx) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{money(p.amount)}</p>
                      <p className="truncate text-xs text-slate-500">{p.paid_on}{p.note ? ` · ${p.note}` : ''}</p>
                    </div>
                    <button className="icon-btn text-rose-500 hover:bg-rose-50" onClick={() => handleRemove(p)} aria-label="Remove">
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
