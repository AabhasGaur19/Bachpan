import { useMemo, useState } from 'react';
import SectionLayout from '../components/SectionLayout.jsx';
import SlidePanel from '../components/SlidePanel.jsx';
import ClassManager from '../components/ClassManager.jsx';
import Icon from '../components/Icon.jsx';
import { Field, Avatar, EmptyState, Spinner, ErrorBanner, KV } from '../components/ui.jsx';
import { useCollection } from '../lib/useCollection.js';
import { money, perDay, payDays, leaveDeduction, netSalary, daysInMonth } from '../lib/format.js';

const BLANK = {
  id: '', name: '', class: '', email: '', phone_1: '', phone_2: '',
  join_date: '', adhar_number: '', salary: 0, leave_days: 0,
  days_in_month: daysInMonth(), photo: '',
};

const UNASSIGNED = '__unassigned__';

export default function Teachers() {
  const { items, error, saving, save, remove, setError } = useCollection('teachers');
  const classesCol = useCollection('classes');
  const classes = classesCol.items || [];

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showClasses, setShowClasses] = useState(false);

  const searching = search.trim() !== '';
  const assignedNames = useMemo(() => new Set(classes.map((c) => c.name)), [classes]);

  function teachersInClass(cls) {
    if (!items) return [];
    if (cls === UNASSIGNED) return items.filter((t) => !t.class || !assignedNames.has(t.class));
    return items.filter((t) => t.class === cls);
  }

  const classCards = useMemo(() => {
    const cards = classes.map((c) => ({
      key: c.id, name: c.name, value: c.name,
      count: (items || []).filter((t) => t.class === c.name).length,
    }));
    const unassigned = (items || []).filter((t) => !t.class || !assignedNames.has(t.class)).length;
    if (unassigned > 0) cards.push({ key: UNASSIGNED, name: 'Unassigned', value: UNASSIGNED, count: unassigned, muted: true });
    return cards;
  }, [classes, items, assignedNames]);

  const visibleTeachers = useMemo(() => {
    if (!items) return null;
    if (searching) {
      const q = search.trim().toLowerCase();
      return items.filter((t) =>
        [t.name, t.class, t.email, t.phone_1, t.phone_2, t.adhar_number].join(' ').toLowerCase().includes(q));
    }
    if (selectedClass === null) return null;
    return teachersInClass(selectedClass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, searching, selectedClass, assignedNames]);

  const classNames = useMemo(() => {
    const names = classes.map((c) => c.name);
    if (editing?.class && !names.includes(editing.class)) names.push(editing.class);
    return names;
  }, [classes, editing]);

  async function handleSave(e) {
    e.preventDefault();
    if (!editing.name.trim()) return setError('Name is required');
    const payload = {
      ...editing,
      salary: Number(editing.salary) || 0,
      leave_days: Number(editing.leave_days) || 0,
      days_in_month: Number(editing.days_in_month) || 30,
    };
    if (await save(payload)) setEditing(null);
  }

  async function handleDelete(t) {
    if (confirm(`Delete ${t.name}? This cannot be undone.`)) await remove(t.id);
  }

  function startAdd() {
    const cls = selectedClass && selectedClass !== UNASSIGNED ? selectedClass : '';
    setEditing({ ...BLANK, class: cls, days_in_month: daysInMonth() });
  }
  function startEdit(t) {
    setEditing({ ...t, days_in_month: t.days_in_month || daysInMonth() });
  }

  async function addClass(name) {
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      classesCol.setError('That class already exists');
      return false;
    }
    return Boolean(await classesCol.save({ id: '', name }));
  }
  async function deleteClass(c) {
    if (confirm(`Delete class "${c.name}"? (Existing teachers keep their label.)`)) await classesCol.remove(c.id);
  }

  function TeacherCard({ t }) {
    return (
      <div className="card flex flex-col p-4">
        <div className="flex items-center gap-3">
          <Avatar name={t.name} src={t.photo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-slate-900">{t.name}</p>
            <p className="truncate text-[13px] text-slate-500">{t.email || '—'}</p>
          </div>
          {t.class && <span className="badge-brand shrink-0">{t.class}</span>}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
          <KV label="Phone 1" value={t.phone_1} />
          <KV label="Phone 2" value={t.phone_2} />
          <KV label="Join date" value={t.join_date} />
          <KV label="Leave days" value={String(t.leave_days || 0)} />
        </dl>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Net payable</p>
            <p className="text-[15px] font-semibold text-emerald-600">{money(netSalary(t))}</p>
          </div>
          <p className="text-right text-xs text-slate-400">
            Salary {money(t.salary)}<br />
            {leaveDeduction(t) > 0 ? <span className="text-rose-500">− {money(leaveDeduction(t))} leave</span> : 'No deduction'}
          </p>
        </div>
        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
          <button className="btn-secondary flex-1 py-2" onClick={() => startEdit(t)}>
            <Icon name="pencil" size={15} /> Edit
          </button>
          <button className="btn-danger px-3 py-2" onClick={() => handleDelete(t)} aria-label="Delete">
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
    );
  }

  function renderBody() {
    if (items === null || classesCol.items === null) return <Spinner />;

    if (searching) {
      return (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {visibleTeachers.length} result{visibleTeachers.length === 1 ? '' : 's'} for “{search.trim()}”
          </p>
          {visibleTeachers.length === 0
            ? <EmptyState icon="search" message="No teachers match your search." />
            : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleTeachers.map((t) => <TeacherCard key={t.id} t={t} />)}</div>}
        </>
      );
    }

    if (selectedClass === null) {
      return (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Classes</h2>
            <button className="btn-secondary h-9 px-3 text-[13px]" onClick={() => setShowClasses(true)}>
              <Icon name="layers" size={16} /> Manage classes
            </button>
          </div>
          {classCards.length === 0 ? (
            <EmptyState icon="building" message="No classes yet. Add one from “Manage classes” to get started." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classCards.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedClass(c.value)}
                  className="card group flex items-center gap-3.5 p-4 text-left transition hover:border-slate-300 hover:shadow-pop active:scale-[0.99]"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.muted ? 'bg-slate-100 text-slate-400' : 'bg-violet-50 text-violet-600'}`}>
                    <Icon name="book-open" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[13px] text-slate-500">{c.count} teacher{c.count === 1 ? '' : 's'}</p>
                  </div>
                  <span className="text-slate-300 transition-transform group-hover:translate-x-0.5">
                    <Icon name="chevron-right" size={18} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button className="btn-secondary h-9 px-3 text-[13px]" onClick={() => setSelectedClass(null)}>
            <Icon name="arrow-left" size={16} /> All classes
          </button>
          <span className="text-[15px] font-semibold text-slate-900">
            {selectedClass === UNASSIGNED ? 'Unassigned' : `Class ${selectedClass}`}
          </span>
          <span className="text-sm text-slate-400">· {visibleTeachers.length} teacher{visibleTeachers.length === 1 ? '' : 's'}</span>
        </div>
        {visibleTeachers.length === 0
          ? <EmptyState icon="book-open" message="No teachers for this class yet. Tap “Add” to create one." />
          : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleTeachers.map((t) => <TeacherCard key={t.id} t={t} />)}</div>}
      </>
    );
  }

  return (
    <SectionLayout
      iconName="book-open" title="Teachers" accent="bg-violet-50 text-violet-600"
      count={items ? items.length : null}
      search={search} onSearch={setSearch}
      onAdd={startAdd} addLabel="Add"
    >
      <ErrorBanner message={error} />
      {renderBody()}

      <SlidePanel open={!!editing} title={editing?.id ? 'Edit teacher' : 'Add teacher'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Full name">
              <input className="input" value={editing.name} placeholder="Teacher's full name"
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <Field label="Class (class teacher of)">
              <select className="input" value={editing.class}
                onChange={(e) => setEditing({ ...editing, class: e.target.value })}>
                <option value="">Select class</option>
                {classNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            {classes.length === 0 && (
              <p className="-mt-1.5 text-xs text-amber-600">Add classes from the Students page (“Manage classes”).</p>
            )}
            <Field label="Email">
              <input type="email" className="input" value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone 1">
                <input className="input" value={editing.phone_1}
                  onChange={(e) => setEditing({ ...editing, phone_1: e.target.value })} />
              </Field>
              <Field label="Phone 2">
                <input className="input" value={editing.phone_2}
                  onChange={(e) => setEditing({ ...editing, phone_2: e.target.value })} />
              </Field>
              <Field label="Join date">
                <input type="date" className="input" value={editing.join_date || ''}
                  onChange={(e) => setEditing({ ...editing, join_date: e.target.value })} />
              </Field>
              <Field label="Aadhaar number">
                <input className="input" value={editing.adhar_number}
                  onChange={(e) => setEditing({ ...editing, adhar_number: e.target.value })} />
              </Field>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Salary</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Salary (₹)">
                  <input type="number" min="0" className="input" value={editing.salary}
                    onChange={(e) => setEditing({ ...editing, salary: e.target.value })} />
                </Field>
                <Field label="Days / month">
                  <input type="number" min="1" max="31" className="input" value={editing.days_in_month}
                    onChange={(e) => setEditing({ ...editing, days_in_month: e.target.value })} />
                </Field>
                <Field label="Days on leave">
                  <input type="number" min="0" className="input" value={editing.leave_days}
                    onChange={(e) => setEditing({ ...editing, leave_days: e.target.value })} />
                </Field>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Per-day pay (÷ {payDays(editing)} days)</span>
                  <span className="font-medium text-slate-700">{money(perDay(editing.salary, payDays(editing)))}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Leave deduction ({editing.leave_days || 0} days)</span>
                  <span className="text-rose-600">− {money(leaveDeduction(editing))}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <span className="font-medium text-slate-600">Net payable</span>
                  <span className="font-semibold text-emerald-600">{money(netSalary(editing))}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Set “Days / month” to the actual days (28–31) or your working-days count.
              </p>
            </div>

            <Field label="Photo URL (optional)">
              <input className="input" value={editing.photo} placeholder="https://…"
                onChange={(e) => setEditing({ ...editing, photo: e.target.value })} />
            </Field>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Save teacher'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </SlidePanel>

      <ClassManager
        open={showClasses}
        onClose={() => { setShowClasses(false); classesCol.setError(''); }}
        classes={classes} onAdd={addClass} onDelete={deleteClass}
        busy={classesCol.saving} error={classesCol.error}
      />
    </SectionLayout>
  );
}
