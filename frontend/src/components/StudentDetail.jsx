import SlidePanel from './SlidePanel.jsx';
import Icon from './Icon.jsx';
import { Avatar, KV } from './ui.jsx';
import { money, feesLeft } from '../lib/format.js';

// Full detail view for one student, opened by tapping a card.
export default function StudentDetail({ student, showFees = true, onClose, onEdit, onFees, onDelete }) {
  const s = student;
  const total = Number(s?.total_fees) || 0;
  const paid = Number(s?.paid_fees) || 0;
  const left = s ? feesLeft(s) : 0;
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

  return (
    <SlidePanel open={!!s} title="Student details" onClose={onClose}>
      {s && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <Avatar name={s.name} className="!h-20 !w-20 !text-2xl" />
            <h2 className="mt-3 text-xl font-semibold text-slate-900">{s.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {s.class ? `Class ${s.class}${s.section ? ' · ' + s.section : ''}` : 'No class'}
              {s.registration_number ? ` · ${s.registration_number}` : ''}
            </p>
          </div>

          {/* Fees — only for users with the 'fees' feature */}
          {showFees && (
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
            <button className="btn-secondary mt-4 w-full" onClick={onFees}>
              <Icon name="wallet" size={16} /> Payments & history
            </button>
          </div>
          )}

          {/* Details */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            <KV label="Father's name" value={s.father_name} />
            <KV label="Phone" value={s.phone} />
            <KV label="Date of birth" value={s.dob} />
            <KV label="Aadhaar" value={s.adhar_number} />
            <div className="col-span-2"><KV label="Address" value={s.address} /></div>
          </dl>

          {/* Actions */}
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button className="btn-secondary flex-1" onClick={onEdit}>
              <Icon name="pencil" size={15} /> Edit
            </button>
            <button className="btn-danger border border-rose-200 px-4" onClick={onDelete}>
              <Icon name="trash" size={16} /> Delete
            </button>
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
