import { useEffect, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Field, Segmented, RowsSkeleton, ErrorBanner } from './ui.jsx';
import { money } from '../lib/format.js';
import { api } from '../lib/api.js';

const ADMISSION_FEE = 300;
const blankForm = () => ({ amount: '', paid_on: new Date().toISOString().slice(0, 10), note: '', method: 'cash' });

// Fee history + add/remove payments for one student, plus the ₹300 admission fee.
// full=false (coordinator): shows only the REMAINING amount, not total/paid.
export default function StudentFees({ student, full = true, onClose, onChanged }) {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [collecting, setCollecting] = useState(false);  // admission collect flow open
  const [admMethod, setAdmMethod] = useState('cash');
  const [remaining, setRemaining] = useState(undefined); // coordinator: number | null (not set) | undefined (loading)

  const open = !!student;

  async function load() {
    if (!student) return;
    setError('');
    try {
      setPayments(await api.listPayments(student.id));
      if (!full) {
        const s = await api.getStudent(student.id);
        setRemaining(s.fees_left == null ? null : Math.max(Number(s.fees_left) || 0, 0));
      }
    } catch (e) { setError(e.message); setPayments([]); }
  }

  useEffect(() => {
    setPayments(null); setRemaining(undefined);
    setForm(blankForm());
    setCollecting(false); setAdmMethod('cash');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  const list = payments || [];
  const total = Number(student?.total_fees) || 0;
  // Tuition only (admission fee is separate).
  const paid = list.filter((p) => p.category !== 'admission').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const left = Math.max(total - paid, 0);
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
  const admission = list.find((p) => p.category === 'admission');

  async function handleAdd(e) {
    e.preventDefault();
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setError('Enter an amount greater than 0');
    setBusy(true); setError('');
    try {
      await api.addPayment(student.id, { ...form, category: 'fee' });
      setForm(blankForm());
      await load(); onChanged?.();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function collectAdmission() {
    setBusy(true); setError('');
    try {
      await api.addPayment(student.id, {
        amount: ADMISSION_FEE, category: 'admission', method: admMethod,
        paid_on: new Date().toISOString().slice(0, 10), note: 'Admission form',
      });
      setCollecting(false);
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

          {/* Tuition summary — hidden for coordinators (no totals) */}
          {full && (
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
                {total > 0 ? (
                  <p className={`mt-1 font-semibold ${left > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {left > 0 ? money(left) : 'Paid'}
                  </p>
                ) : (
                  <p className="mt-1 font-semibold text-slate-300">—</p>
                )}
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${left > 0 ? 'bg-brand-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-right text-xs text-slate-400">{pct}% collected</p>
          </div>
          )}

          {/* Coordinator: remaining amount only */}
          {!full && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Remaining fees</p>
              {remaining === undefined ? (
                <p className="mt-1 text-xl font-semibold text-slate-300">…</p>
              ) : remaining === null ? (
                <p className="mt-1 text-sm font-medium text-slate-400">Fees not set yet</p>
              ) : remaining <= 0 ? (
                <p className="mt-1 text-xl font-semibold text-emerald-600">Paid</p>
              ) : (
                <p className="mt-1 text-xl font-semibold text-rose-600">{money(remaining)} left</p>
              )}
            </div>
          )}

          {/* Admission form fee — highlighted */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Icon name="wallet" size={16} className="text-amber-600" /> Admission form fee
                </p>
                <p className="text-xs text-amber-700/80">One-time charge · {money(ADMISSION_FEE)}</p>
              </div>
              {admission ? (
                <span className="badge-green shrink-0">Already paid ✓</span>
              ) : !collecting ? (
                <button type="button" className="btn-primary h-9 shrink-0 px-3 text-[13px]" onClick={() => setCollecting(true)}>
                  Collect {money(ADMISSION_FEE)}
                </button>
              ) : null}
            </div>

            {admission && (
              <p className="mt-2 text-xs text-slate-500">
                Collected on {admission.paid_on} · {admission.method === 'online' ? 'Online' : 'Cash'}
              </p>
            )}

            {!admission && collecting && (
              <div className="mt-3 space-y-2">
                <Segmented
                  options={[{ label: 'Cash', value: 'cash' }, { label: 'Online', value: 'online' }]}
                  value={admMethod} onChange={setAdmMethod}
                />
                <div className="flex gap-2">
                  <button type="button" className="btn-primary h-9 flex-1" disabled={busy} onClick={collectAdmission}>
                    {busy ? 'Saving…' : `Confirm ${money(ADMISSION_FEE)}`}
                  </button>
                  <button type="button" className="btn-ghost h-9" onClick={() => setCollecting(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Record a tuition payment */}
          <form onSubmit={handleAdd} className="rounded-2xl border border-slate-200/80 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Record a fee payment</p>
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
              <span className="label">Payment method</span>
              <Segmented
                options={[{ label: 'Cash', value: 'cash' }, { label: 'Online', value: 'online' }]}
                value={form.method} onChange={(v) => setForm({ ...form, method: v })}
              />
            </div>
            <div className="mt-3">
              <Field label="Note (optional)">
                <input className="input" value={form.note} placeholder="Term 1, cheque #…"
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
            ) : list.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No payments recorded yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {list.map((p) => {
                  const adm = p.category === 'admission';
                  return (
                    <li key={p.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${adm ? 'border-amber-300 bg-amber-50' : 'border-slate-200/80'}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${adm ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
                        <Icon name={adm ? 'wallet' : 'check'} size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold text-slate-900">
                          {money(p.amount)}
                          {p.method === 'online'
                            ? <span className="badge-brand">Online</span>
                            : <span className="badge-slate">Cash</span>}
                          {adm && <span className="badge-amber">Admission</span>}
                        </p>
                        <p className="truncate text-xs text-slate-500">{p.paid_on}{p.note ? ` · ${p.note}` : ''}</p>
                      </div>
                      <button className="icon-btn text-rose-500 hover:bg-rose-50" onClick={() => handleRemove(p)} aria-label="Remove">
                        <Icon name="trash" size={16} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
