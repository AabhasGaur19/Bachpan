import { useEffect, useMemo, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Skeleton, RowsSkeleton, EmptyState, ErrorBanner } from './ui.jsx';
import { money } from '../lib/format.js';
import { api } from '../lib/api.js';

function monthName(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// Month-wise fee collection summary; tap a month to see each payment.
export default function FeesSummary({ open, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [openMonth, setOpenMonth] = useState(null);  // 'YYYY-MM' when drilled in
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!open) return;
    setOpenMonth(null); setDetail(null);
    setRows(null); setError('');
    api.feesSummary().then(setRows).catch((e) => { setError(e.message); setRows([]); });
  }, [open]);

  function drillInto(ym) {
    setOpenMonth(ym); setDetail(null); setError('');
    api.paymentsByMonth(ym).then(setDetail).catch((e) => { setError(e.message); setDetail([]); });
  }

  const totals = useMemo(() => {
    const list = rows || [];
    return {
      total: list.reduce((s, r) => s + r.total, 0),
      online: list.reduce((s, r) => s + r.online, 0),
      cash: list.reduce((s, r) => s + r.cash, 0),
      count: list.reduce((s, r) => s + r.count, 0),
    };
  }, [rows]);

  const title = openMonth ? `Fees · ${monthName(openMonth)}` : 'Fees summary';

  return (
    <SlidePanel open={open} title={title} onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={error} />

        {/* ---- Drill-in: one month's individual payments ---- */}
        {openMonth ? (
          <>
            <button className="btn-secondary h-9 px-3 text-[13px]" onClick={() => setOpenMonth(null)}>
              <Icon name="arrow-left" size={16} /> All months
            </button>

            {detail === null ? (
              <RowsSkeleton count={5} />
            ) : detail.length === 0 ? (
              <EmptyState icon="wallet" message="No payments in this month." />
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  {detail.length} payment{detail.length === 1 ? '' : 's'} ·{' '}
                  <span className="font-semibold text-slate-800">
                    {money(detail.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </p>
                <ul className="space-y-2">
                  {detail.map((p) => (
                    <li key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 ${p.category === 'admission' ? 'border-amber-300 bg-amber-50' : 'border-slate-200/80'}`}>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate font-medium text-slate-900">
                          {p.student_name}
                          {p.category === 'admission' && <span className="badge-amber">Admission</span>}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          {p.paid_on}
                          {p.method === 'online'
                            ? <span className="badge-brand">Online</span>
                            : <span className="badge-slate">Cash</span>}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-slate-900">{money(p.amount)}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : rows === null ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <RowsSkeleton count={4} />
          </>
        ) : rows.length === 0 ? (
          <EmptyState icon="wallet" message="No fee payments recorded yet." />
        ) : (
          <>
            {/* Grand total */}
            <div className="rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Total collected</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{money(totals.total)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-300">
                <span>Online {money(totals.online)}</span>
                <span>Cash {money(totals.cash)}</span>
                <span>{totals.count} payment{totals.count === 1 ? '' : 's'}</span>
              </div>
            </div>

            {/* Month rows (tap to drill in) */}
            <div className="space-y-2">
              {rows.map((r) => (
                <button
                  key={r.month}
                  onClick={() => drillInto(r.month)}
                  className="w-full rounded-xl border border-slate-200/80 p-3.5 text-left transition hover:border-slate-300 hover:shadow-pop active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{monthName(r.month)}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold tabular-nums text-slate-900">{money(r.total)}</p>
                      <span className="text-slate-300"><Icon name="chevron-right" size={16} /></span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-brand-500" /> Online {money(r.online)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-slate-400" /> Cash {money(r.cash)}
                    </span>
                    <span className="text-slate-400">· {r.count} payment{r.count === 1 ? '' : 's'}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </SlidePanel>
  );
}
