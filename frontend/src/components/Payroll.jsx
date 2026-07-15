import { useEffect, useMemo, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Avatar, Spinner, ErrorBanner } from './ui.jsx';
import { money } from '../lib/format.js';
import { api } from '../lib/api.js';

const thisMonth = () => new Date().toISOString().slice(0, 7);

function shiftMonth(m, delta) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthTitle(m) {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}
function formatDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Payroll({ open, onClose }) {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [months, setMonths] = useState([]);
  const [error, setError] = useState('');

  async function load(m) {
    setData(null); setError('');
    try {
      // Current month is regenerated live on every view; past months load their
      // locked snapshot.
      const res = m === thisMonth() ? await api.generatePayroll(m) : await api.getPayroll(m);
      setData(res);
      api.payrollMonths().then(setMonths).catch(() => {});
    } catch (e) {
      setError(e.message);
      setData({ month: m, saved: false, rows: [] });
    }
  }

  // On open, jump to the current month.
  useEffect(() => { if (open) setMonth(thisMonth()); }, [open]);
  // Load whenever the panel is open and the month changes.
  useEffect(() => { if (open) load(month); /* eslint-disable-next-line */ }, [open, month]);

  const totals = useMemo(() => {
    const rows = data?.rows || [];
    return {
      count: rows.length,
      salary: rows.reduce((s, r) => s + (Number(r.salary) || 0), 0),
      leaves: rows.reduce((s, r) => s + (Number(r.leaves) || 0), 0),
      deduction: rows.reduce((s, r) => s + (Number(r.deduction) || 0), 0),
      net: rows.reduce((s, r) => s + (Number(r.net) || 0), 0),
    };
  }, [data]);

  const isCurrent = month === thisMonth();

  return (
    <SlidePanel open={open} title="Payroll" onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={error} />

        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <button className="icon-btn border border-slate-200" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
            <Icon name="chevron-left" size={18} />
          </button>
          <div className="relative text-center">
            <p className="text-base font-semibold text-slate-900">{monthTitle(month)}</p>
            <p className="text-xs text-slate-400">Tap to change</p>
            <input
              type="month" value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Pick month"
            />
          </div>
          <button className="icon-btn border border-slate-200" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
            <Icon name="chevron-right" size={18} />
          </button>
        </div>

        {data === null ? (
          <Spinner />
        ) : (
          <>
            {/* Grand total */}
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total net payable</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{money(totals.net)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-300">
                <span>{totals.count} teacher{totals.count === 1 ? '' : 's'}</span>
                <span>{totals.leaves} leave{totals.leaves === 1 ? '' : 's'}</span>
                <span>− {money(totals.deduction)}</span>
              </div>
            </div>

            {/* Status (only for past months) */}
            {!isCurrent && (
              <div className="flex items-center gap-2 text-xs">
                {data.saved ? (
                  <span className="badge-green"><Icon name="check" size={13} /> Saved {formatDate(data.generated_at)}</span>
                ) : (
                  <span className="badge-slate">No record saved for this month</span>
                )}
              </div>
            )}

            {/* Rows */}
            {totals.count === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
                No teachers to show for this month.
              </p>
            ) : (
              <div className="space-y-2">
                {data.rows.map((r) => (
                  <div key={r.teacher_id || r.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3">
                    <Avatar name={r.name} className="!h-9 !w-9 !text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{r.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {money(r.salary)}
                        {r.leaves > 0 && <> · {r.leaves} leave{r.leaves === 1 ? '' : 's'}</>}
                        {r.deduction > 0
                          ? <span className="text-rose-500"> · − {money(r.deduction)}</span>
                          : r.leaves > 0 && <span className="text-emerald-600"> · no cut</span>}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums text-slate-900">{money(r.net)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Saved months quick-jump */}
            {months.length > 0 && (
              <div>
                <p className="label">Saved months</p>
                <div className="flex flex-wrap gap-2">
                  {months.map((m) => (
                    <button key={m} onClick={() => setMonth(m)}
                      className={m === month ? 'badge-brand' : 'badge-slate'}>
                      {monthTitle(m)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400">
              The current month updates automatically each time you open Payroll. Past months are saved records and stay locked even if a salary changes later.
            </p>
          </>
        )}
      </div>
    </SlidePanel>
  );
}
