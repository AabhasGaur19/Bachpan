import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';

const CARDS = [
  {
    to: 'students', icon: 'graduation-cap', title: 'Students',
    desc: 'Enrollment, classes, guardians & fees',
    accent: 'bg-brand-50 text-brand-600',
  },
  {
    to: 'teachers', icon: 'book-open', title: 'Teachers',
    desc: 'Staff records, classes & salary',
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    to: 'inventory', icon: 'package', title: 'Inventory',
    desc: 'Stock levels, suppliers & reordering',
    accent: 'bg-amber-50 text-amber-600',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [students, teachers, inventory] = await Promise.all([
          api.list('students'), api.list('teachers'), api.list('inventory'),
        ]);
        setCounts({ students: students.length, teachers: teachers.length, inventory: inventory.length });
        setLowStock(inventory.filter((i) => i.quantity <= i.reorder_level).length);
      } catch { /* backend may not be up yet */ }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-10 sm:py-16">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon name="building" size={18} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Bachpan</span>
        </div>

        {/* Hero */}
        <div className="mt-14 sm:mt-20">
          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            School management,<br />
            <span className="text-slate-400">made simple.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-500">
            Choose a section to get started. Everything you need to run the school, in one calm place.
          </p>
        </div>

        {/* Sections */}
        <div className="mt-10 flex flex-col gap-3">
          {CARDS.map((c) => (
            <button
              key={c.to}
              onClick={() => navigate(`/${c.to}`)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-card transition-all duration-200 hover:border-slate-300 hover:shadow-pop active:scale-[0.995]"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.accent}`}>
                <Icon name={c.icon} size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-slate-900">{c.title}</h2>
                  {c.to === 'inventory' && lowStock > 0 && (
                    <span className="badge-amber">{lowStock} low</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">{c.desc}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-lg font-semibold tabular-nums text-slate-900">
                  {counts[c.to] ?? '—'}
                </span>
                <span className="text-slate-300 transition-transform group-hover:translate-x-0.5">
                  <Icon name="chevron-right" size={20} />
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-auto pt-12 text-xs text-slate-400">
          Data is stored locally until Supabase is connected.
        </p>
      </div>
    </div>
  );
}
