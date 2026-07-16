import { useEffect, useMemo, useState } from 'react';
import SlidePanel from './SlidePanel.jsx';
import { Skeleton, RowsSkeleton, EmptyState, ErrorBanner } from './ui.jsx';
import { money } from '../lib/format.js';
import { api } from '../lib/api.js';

function monthName(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// Month-wise fee collection summary across all students (admin/fees only).
export default function FeesSummary({ open, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setRows(null); setError('');
    api.feesSummary().then(setRows).catch((e) => { setError(e.message); setRows([]); });
  }, [open]);

  const totals = useMemo(() => {
    const list = rows || [];
    return {
      total: list.reduce((s, r) => s + r.total, 0),
      online: list.reduce((s, r) => s + r.online, 0),
      cash: list.reduce((s, r) => s + r.cash, 0),
      count: list.reduce((s, r) => s + r.count, 0),
    };
  }, [rows]);

  return (
    <SlidePanel open={open} title="Fees summary" onClose={onClose}>
      <div className="space-y-5">
        <ErrorBanner message={error} />

        {rows === null ? (
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

            {/* Month rows */}
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.month} className="rounded-xl border border-slate-200/80 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{monthName(r.month)}</p>
                    <p className="font-semibold tabular-nums text-slate-900">{money(r.total)}</p>
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
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SlidePanel>
  );
}
