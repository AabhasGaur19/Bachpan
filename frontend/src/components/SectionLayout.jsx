import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

// Shared top app bar + page shell for Students / Teachers / Inventory.
export default function SectionLayout({
  iconName, title, count, accent = 'bg-brand-50 text-brand-600',
  search, onSearch, onAdd, addLabel, children,
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f6f7f9]/85 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3">
            <Link to="/" className="icon-btn -ml-2" aria-label="Back to home">
              <Icon name="arrow-left" size={20} />
            </Link>
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
              <Icon name={iconName} size={18} />
            </span>
            <div className="mr-auto min-w-0">
              <h1 className="truncate text-[15px] font-semibold leading-tight text-slate-900">{title}</h1>
              <p className="text-xs text-slate-400">
                {count === null || count === undefined ? 'Loading…' : `${count} ${count === 1 ? 'record' : 'records'}`}
              </p>
            </div>
            <button className="btn-primary h-10 px-3 sm:px-4" onClick={onAdd}>
              <Icon name="plus" size={18} />
              <span className="hidden sm:inline">{addLabel}</span>
            </button>
          </div>

          <div className="pb-3">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <Icon name="search" size={18} />
              </span>
              <input
                className="input pl-10"
                placeholder="Search…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">{children}</main>
    </div>
  );
}
