import { useMemo, useState } from 'react';
import SectionLayout from '../components/SectionLayout.jsx';
import SlidePanel from '../components/SlidePanel.jsx';
import StudentFees from '../components/StudentFees.jsx';
import StudentDetail from '../components/StudentDetail.jsx';
import ClassManager from '../components/ClassManager.jsx';
import Icon from '../components/Icon.jsx';
import { Field, Avatar, EmptyState, Spinner, ErrorBanner } from '../components/ui.jsx';
import { useCollection } from '../lib/useCollection.js';
import { api } from '../lib/api.js';
import { money, feesLeft } from '../lib/format.js';

const BLANK = {
  id: '', name: '', registration_number: '', class: '', section: '',
  dob: '', father_name: '', phone: '', address: '', adhar_number: '',
  total_fees: 0, paid_fees: 0, initial_paid: '',
};

const UNASSIGNED = '__unassigned__';

export default function Students() {
  const { items, error, saving, save, remove, reload, setError } = useCollection('students');
  const classesCol = useCollection('classes');
  const classes = classesCol.items || [];

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [editing, setEditing] = useState(null);
  const [feesFor, setFeesFor] = useState(null);
  const [detailFor, setDetailFor] = useState(null);
  const [showClasses, setShowClasses] = useState(false);

  const searching = search.trim() !== '';
  const assignedNames = useMemo(() => new Set(classes.map((c) => c.name)), [classes]);

  function studentsInClass(cls) {
    if (!items) return [];
    if (cls === UNASSIGNED) return items.filter((s) => !s.class || !assignedNames.has(s.class));
    return items.filter((s) => s.class === cls);
  }

  const classCards = useMemo(() => {
    const cards = classes.map((c) => ({
      key: c.id, name: c.name, value: c.name,
      count: (items || []).filter((s) => s.class === c.name).length,
    }));
    const unassigned = (items || []).filter((s) => !s.class || !assignedNames.has(s.class)).length;
    if (unassigned > 0) cards.push({ key: UNASSIGNED, name: 'Unassigned', value: UNASSIGNED, count: unassigned, muted: true });
    return cards;
  }, [classes, items, assignedNames]);

  const visibleStudents = useMemo(() => {
    if (!items) return null;
    if (searching) {
      const q = search.trim().toLowerCase();
      return items.filter((s) =>
        [s.name, s.registration_number, s.class, s.section, s.father_name, s.phone, s.adhar_number]
          .join(' ').toLowerCase().includes(q));
    }
    if (selectedClass === null) return null;
    return studentsInClass(selectedClass);
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
    const { paid_fees, initial_paid, ...rest } = editing;
    const isNew = !editing.id;
    const payload = { ...rest, total_fees: Number(editing.total_fees) || 0 };
    const saved = await save(payload);
    if (!saved) return;
    const firstPayment = Number(initial_paid);
    if (isNew && firstPayment > 0) {
      try {
        await api.addPayment(saved.id, { amount: firstPayment, note: 'Initial payment' });
        await reload();
      } catch (err) { setError(`Student saved, but the payment failed: ${err.message}`); }
    }
    setEditing(null);
  }

  function startAdd() {
    const cls = selectedClass && selectedClass !== UNASSIGNED ? selectedClass : '';
    setEditing({ ...BLANK, class: cls });
  }

  async function addClass(name) {
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      classesCol.setError('That class already exists');
      return false;
    }
    return Boolean(await classesCol.save({ id: '', name }));
  }
  async function deleteClass(c) {
    if (confirm(`Delete class "${c.name}"? (Existing students keep their label.)`)) await classesCol.remove(c.id);
  }

  function StudentCard({ s }) {
    const left = feesLeft(s);
    return (
      <button
        onClick={() => setDetailFor(s)}
        className="card flex w-full items-center gap-3 p-3.5 text-left transition hover:border-slate-300 hover:shadow-pop active:scale-[0.99]"
      >
        <Avatar name={s.name} className="!h-11 !w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-slate-900">{s.name}</p>
          <p className="truncate text-[13px] text-slate-500">
            {s.class ? `Class ${s.class}${s.section ? ' · ' + s.section : ''}` : 'No class'}
            {s.registration_number ? ` · ${s.registration_number}` : ''}
          </p>
        </div>
        {left > 0
          ? <span className="badge-red shrink-0">{money(left)}</span>
          : <span className="badge-green shrink-0"><Icon name="check" size={13} /> Paid</span>}
        <span className="shrink-0 text-slate-300"><Icon name="chevron-right" size={18} /></span>
      </button>
    );
  }

  function renderBody() {
    if (items === null || classesCol.items === null) return <Spinner />;

    if (searching) {
      return (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {visibleStudents.length} result{visibleStudents.length === 1 ? '' : 's'} for “{search.trim()}”
          </p>
          {visibleStudents.length === 0
            ? <EmptyState icon="search" message="No students match your search." />
            : <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{visibleStudents.map((s) => <StudentCard key={s.id} s={s} />)}</div>}
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
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.muted ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-600'}`}>
                    <Icon name="building" size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[13px] text-slate-500">{c.count} student{c.count === 1 ? '' : 's'}</p>
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
          <span className="text-sm text-slate-400">· {visibleStudents.length} student{visibleStudents.length === 1 ? '' : 's'}</span>
        </div>
        {visibleStudents.length === 0
          ? <EmptyState icon="graduation-cap" message="No students in this class yet. Tap “Add” to create one." />
          : <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{visibleStudents.map((s) => <StudentCard key={s.id} s={s} />)}</div>}
      </>
    );
  }

  return (
    <SectionLayout
      iconName="graduation-cap" title="Students" accent="bg-brand-50 text-brand-600"
      count={items ? items.length : null}
      search={search} onSearch={setSearch}
      onAdd={startAdd} addLabel="Add"
    >
      <ErrorBanner message={error} />
      {renderBody()}

      {/* Add / Edit */}
      <SlidePanel open={!!editing} title={editing?.id ? 'Edit student' : 'Add student'} onClose={() => setEditing(null)}>
        {editing && (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Full name">
              <input className="input" value={editing.name} placeholder="Student's full name"
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Registration no.">
                <input className="input" value={editing.registration_number}
                  onChange={(e) => setEditing({ ...editing, registration_number: e.target.value })} />
              </Field>
              <Field label="Date of birth">
                <input type="date" className="input" value={editing.dob || ''}
                  onChange={(e) => setEditing({ ...editing, dob: e.target.value })} />
              </Field>
              <Field label="Class">
                <select className="input" value={editing.class}
                  onChange={(e) => setEditing({ ...editing, class: e.target.value })}>
                  <option value="">Select class</option>
                  {classNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Section">
                <input className="input" value={editing.section}
                  onChange={(e) => setEditing({ ...editing, section: e.target.value })} />
              </Field>
            </div>
            {classes.length === 0 && (
              <p className="-mt-1.5 text-xs text-amber-600">Add classes from “Manage classes” to fill this dropdown.</p>
            )}
            <Field label="Father's name">
              <input className="input" value={editing.father_name}
                onChange={(e) => setEditing({ ...editing, father_name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <input className="input" value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
              <Field label="Aadhaar number">
                <input className="input" value={editing.adhar_number}
                  onChange={(e) => setEditing({ ...editing, adhar_number: e.target.value })} />
              </Field>
            </div>
            <Field label="Address">
              <textarea className="input" rows={2} value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </Field>

            {/* Fees */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Fees</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total fees (₹)">
                  <input type="number" min="0" className="input" value={editing.total_fees}
                    onChange={(e) => setEditing({ ...editing, total_fees: e.target.value })} />
                </Field>
                {editing.id ? (
                  <Field label="Paid so far (₹)">
                    <input className="input bg-slate-100 text-slate-500" value={money(editing.paid_fees || 0)} readOnly />
                  </Field>
                ) : (
                  <Field label="Fees paid now (₹)">
                    <input type="number" min="0" className="input" value={editing.initial_paid} placeholder="e.g. 10000"
                      onChange={(e) => setEditing({ ...editing, initial_paid: e.target.value })} />
                  </Field>
                )}
              </div>
              {(() => {
                const paidNow = editing.id ? Number(editing.paid_fees) || 0 : Number(editing.initial_paid) || 0;
                const left = Math.max((Number(editing.total_fees) || 0) - paidNow, 0);
                return (
                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                    <span className="font-medium text-slate-500">Fees left</span>
                    <span className={`font-semibold ${left > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {left > 0 ? money(left) : 'Fully paid'}
                    </span>
                  </div>
                );
              })()}
              {editing.id ? (
                <button type="button" className="btn-secondary mt-3 w-full"
                  onClick={() => { setFeesFor(editing); setEditing(null); }}>
                  <Icon name="wallet" size={16} /> Manage payments & history
                </button>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Optional — records the first payment now.</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving…' : 'Save student'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}
      </SlidePanel>

      <StudentDetail
        student={detailFor}
        onClose={() => setDetailFor(null)}
        onEdit={() => { setEditing(detailFor); setDetailFor(null); }}
        onFees={() => { setFeesFor(detailFor); setDetailFor(null); }}
        onDelete={async () => {
          if (confirm(`Delete ${detailFor.name}? This cannot be undone.`)) { await remove(detailFor.id); setDetailFor(null); }
        }}
      />

      <StudentFees student={feesFor} onClose={() => setFeesFor(null)} onChanged={reload} />

      <ClassManager
        open={showClasses}
        onClose={() => { setShowClasses(false); classesCol.setError(''); }}
        classes={classes} onAdd={addClass} onDelete={deleteClass}
        busy={classesCol.saving} error={classesCol.error}
      />
    </SectionLayout>
  );
}
