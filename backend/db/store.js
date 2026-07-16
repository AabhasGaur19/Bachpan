// Data access layer.
// If SUPABASE_URL + SUPABASE_SERVICE_KEY are set, everything reads/writes to
// your real Supabase (PostgreSQL) database. Otherwise it uses a LOCAL JSON
// file (db/data.json) so the app works out-of-the-box AND survives restarts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  sampleStudents, sampleTeachers, sampleInventory, sampleClasses, samplePayments,
  sampleHolidays, sampleTeacherLeaves, samplePayroll, sampleUsers,
} from './seed.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

export const usingSupabase = Boolean(url && key);
const supabase = usingSupabase ? createClient(url, key) : null;

// Teacher leave policy:
//  - 1 free (paid) FULL-DAY leave per calendar month.
//  - Extra full-day leaves are charged 1 day each; half-day leaves are always
//    charged 0.5 day (the free leave never applies to half-days, and two halves
//    are NOT merged into a full day).
//  - Counts/deductions are per CURRENT month, so they reset each month.
//  - Unused monthly paid leaves accrue over the academic session and can be
//    encashed at the end (see unusedPaidLeaveCount).
const FREE_LEAVES_PER_MONTH = 1;
const SESSION_START_MONTH = 4; // April = start of the academic session
const currentMonth = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'
const perDaySalary = (s) => (Number(s) || 0) / 30; // fixed 30-day month

const ymOf = (dateStr) => String(dateStr).slice(0, 7);
const isHalf = (l) => l.type === 'half';

// Leave stats for one teacher's register within a given 'YYYY-MM'.
function monthLeaveStats(leaves, ym) {
  const inMonth = leaves.filter((l) => ymOf(l.date) === ym);
  const full = inMonth.filter((l) => !isHalf(l)).length;
  const half = inMonth.filter((l) => isHalf(l)).length;
  const chargeableDays = Math.max(full - FREE_LEAVES_PER_MONTH, 0) + 0.5 * half;
  return { count: inMonth.length, full, half, chargeableDays };
}

function sessionStartYm(now = new Date()) {
  const y = now.getFullYear();
  const startYear = (now.getMonth() + 1) >= SESSION_START_MONTH ? y : y - 1;
  return `${startYear}-${String(SESSION_START_MONTH).padStart(2, '0')}`;
}

// Completed months this session (from join date onward) with NO full-day leave
// taken — each is one unused paid leave that can be encashed at session end.
function unusedPaidLeaveCount(leaves, joinDate, now = new Date()) {
  const startYm = sessionStartYm(now);
  const joinYm = joinDate ? ymOf(joinDate) : '0000-00';
  let [yy, mm] = (startYm > joinYm ? startYm : joinYm).split('-').map(Number);
  const curYm = now.toISOString().slice(0, 7);
  let count = 0;
  for (let guard = 0; guard < 24; guard++) {
    const ym = `${yy}-${String(mm).padStart(2, '0')}`;
    if (ym >= curYm) break; // only completed (past) months count
    if (monthLeaveStats(leaves, ym).full === 0) count++;
    mm++; if (mm > 12) { mm = 1; yy++; }
  }
  return count;
}

// Column each table is ordered by when listed.
const ORDER = {
  students: 'name',
  teachers: 'name',
  inventory: 'name',
  classes: 'created_at',
  fee_payments: 'paid_on',
  holidays: 'date',
  teacher_leaves: 'date',
  payroll: 'name',
  users: 'username',
};

// ---------- Local JSON store ----------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');

function initialData() {
  return {
    students: structuredClone(sampleStudents),
    teachers: structuredClone(sampleTeachers),
    inventory: structuredClone(sampleInventory),
    classes: structuredClone(sampleClasses),
    fee_payments: structuredClone(samplePayments),
    holidays: structuredClone(sampleHolidays),
    teacher_leaves: structuredClone(sampleTeacherLeaves),
    payroll: structuredClone(samplePayroll),
    users: sampleUsers.map((u) => {
      const { password, ...rest } = u;
      const { salt, hash } = hashPassword(password);
      return { ...rest, salt, password_hash: hash };
    }),
    sessions: [],
  };
}

let mem = {};
function loadLocal() {
  if (usingSupabase) return;
  try {
    if (fs.existsSync(DATA_FILE)) {
      mem = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      const init = initialData(); // make sure any newly-added tables exist
      for (const k of Object.keys(init)) if (!mem[k]) mem[k] = init[k];
    } else {
      mem = initialData();
      saveLocal();
    }
  } catch (e) {
    console.error('Could not read data.json, starting fresh:', e.message);
    mem = initialData();
  }
}
function saveLocal() {
  if (usingSupabase) return;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mem, null, 2));
  } catch (e) {
    console.error('Could not write data.json:', e.message);
  }
}
loadLocal();
reconcileTeacherLeavesLocal();
migrateInventoryLocal();

// Convert any pre-existing inventory rows to the new variant-based shape
// (name + variants) and drop the old ordering fields.
function migrateInventoryLocal() {
  if (usingSupabase) return;
  let changed = false;
  for (const it of mem.inventory || []) {
    if (it.name == null && it.item_name != null) { it.name = it.item_name; changed = true; }
    if (!Array.isArray(it.variants)) {
      it.variants = [{ label: '', quantity: Number(it.quantity) || 0 }];
      changed = true;
    }
    for (const k of ['item_name', 'quantity', 'reorder_level', 'supplier', 'last_ordered', 'variant_label', 'category', 'unit']) {
      if (k in it) { delete it[k]; changed = true; }
    }
  }
  if (changed) saveLocal();
}

// Keep every teacher's current-month leave counters in step with the register.
function reconcileTeacherLeavesLocal() {
  if (usingSupabase) return;
  const month = currentMonth();
  for (const t of mem.teachers || []) {
    const taken = (mem.teacher_leaves || [])
      .filter((l) => String(l.teacher_id) === String(t.id) && String(l.date).slice(0, 7) === month)
      .length;
    t.leave_days = taken;
    t.chargeable_leaves = Math.max(taken - FREE_LEAVES_PER_MONTH, 0);
  }
  saveLocal();
}

function memList(table) {
  const col = ORDER[table] || 'name';
  return [...(mem[table] || [])].sort((a, b) =>
    String(a[col] ?? '').localeCompare(String(b[col] ?? ''))
  );
}
function memCreate(table, row) {
  const record = { id: randomUUID(), created_at: new Date().toISOString(), ...row };
  (mem[table] ||= []).push(record);
  saveLocal();
  return record;
}
function memUpdate(table, id, patch) {
  const i = (mem[table] || []).findIndex((r) => String(r.id) === String(id));
  if (i === -1) return null;
  mem[table][i] = { ...mem[table][i], ...patch };
  saveLocal();
  return mem[table][i];
}
function memRemove(table, id) {
  const i = (mem[table] || []).findIndex((r) => String(r.id) === String(id));
  if (i === -1) return false;
  mem[table].splice(i, 1);
  saveLocal();
  return true;
}

// ---------- Public CRUD API (same shape for both backends) ----------
export async function list(table) {
  if (!usingSupabase) return memList(table);
  const { data, error } = await supabase.from(table).select('*').order(ORDER[table] || 'name');
  if (error) throw error;
  return data;
}

export async function create(table, row) {
  if (!usingSupabase) return memCreate(table, row);
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function update(table, id, patch) {
  if (!usingSupabase) return memUpdate(table, id, patch);
  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function remove(table, id) {
  if (!usingSupabase) return memRemove(table, id);
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  return true;
}

// ---------- Fee payments (installment history) ----------
export async function listPayments(studentId) {
  if (!usingSupabase) {
    return (mem.fee_payments || [])
      .filter((p) => String(p.student_id) === String(studentId))
      .sort((a, b) => String(a.paid_on).localeCompare(String(b.paid_on)));
  }
  const { data, error } = await supabase
    .from('fee_payments').select('*').eq('student_id', studentId).order('paid_on');
  if (error) throw error;
  return data;
}

export async function addPayment(studentId, { amount, note, paid_on, method, category }) {
  const row = {
    student_id: studentId,
    amount: Number(amount) || 0,
    note: note || '',
    paid_on: paid_on || new Date().toISOString().slice(0, 10),
    method: method === 'online' ? 'online' : 'cash',
    category: category === 'admission' ? 'admission' : 'fee',
  };
  let created;
  if (!usingSupabase) {
    created = memCreate('fee_payments', row);
  } else {
    const { data, error } = await supabase.from('fee_payments').insert(row).select().single();
    if (error) throw error;
    created = data;
  }
  await syncPaidFees(studentId);
  return created;
}

export async function deletePayment(studentId, paymentId) {
  if (!usingSupabase) {
    if (!memRemove('fee_payments', paymentId)) return false;
  } else {
    const { error } = await supabase.from('fee_payments').delete().eq('id', paymentId);
    if (error) throw error;
  }
  await syncPaidFees(studentId);
  return true;
}

async function syncPaidFees(studentId) {
  const payments = await listPayments(studentId);
  // Only tuition ('fee') payments count toward paid_fees — admission form fees
  // are a separate one-time charge and don't reduce the tuition balance.
  const paid = payments
    .filter((p) => p.category !== 'admission')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  await update('students', studentId, { paid_fees: paid });
}

// Month-wise fee collection summary across ALL students, split by method.
export async function paymentsSummary() {
  let all;
  if (!usingSupabase) {
    all = mem.fee_payments || [];
  } else {
    const { data, error } = await supabase.from('fee_payments').select('*');
    if (error) throw error;
    all = data;
  }
  const byMonth = new Map();
  for (const p of all) {
    const ym = String(p.paid_on).slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, { month: ym, total: 0, online: 0, cash: 0, count: 0 });
    const m = byMonth.get(ym);
    const amt = Number(p.amount) || 0;
    m.total += amt;
    if (p.method === 'online') m.online += amt; else m.cash += amt;
    m.count += 1;
  }
  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

// Individual payments in a given month, with the student's name attached.
export async function paymentsByMonth(month) {
  let all, students;
  if (!usingSupabase) {
    all = mem.fee_payments || [];
    students = mem.students || [];
  } else {
    const p = await supabase.from('fee_payments').select('*');
    if (p.error) throw p.error;
    const s = await supabase.from('students').select('id, name');
    if (s.error) throw s.error;
    all = p.data; students = s.data;
  }
  const nameById = new Map(students.map((s) => [String(s.id), s.name]));
  return all
    .filter((p) => String(p.paid_on).slice(0, 7) === month)
    .map((p) => ({
      id: p.id,
      student_name: nameById.get(String(p.student_id)) || '—',
      amount: Number(p.amount) || 0,
      method: p.method === 'online' ? 'online' : 'cash',
      category: p.category === 'admission' ? 'admission' : 'fee',
      paid_on: p.paid_on,
      note: p.note || '',
    }))
    .sort((a, b) => String(a.paid_on).localeCompare(String(b.paid_on)) || a.student_name.localeCompare(b.student_name));
}

// ---------- Teacher leaves (register) ----------

export async function listLeaves(teacherId) {
  if (!usingSupabase) {
    return (mem.teacher_leaves || [])
      .filter((l) => String(l.teacher_id) === String(teacherId))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  const { data, error } = await supabase
    .from('teacher_leaves').select('*').eq('teacher_id', teacherId).order('date');
  if (error) throw error;
  return data;
}

export async function addLeave(teacherId, { date, reason, type }) {
  const row = {
    teacher_id: teacherId,
    date: date || new Date().toISOString().slice(0, 10),
    reason: reason || '',
    type: type === 'half' ? 'half' : 'full',
  };
  let created;
  if (!usingSupabase) {
    created = memCreate('teacher_leaves', row);
  } else {
    const { data, error } = await supabase.from('teacher_leaves').insert(row).select().single();
    if (error) throw error;
    created = data;
  }
  await syncTeacherLeaves(teacherId);
  return created;
}

// Add a full-day leave for every date in [from, to] (inclusive) at once.
export async function addLeaveRange(teacherId, { from, to, reason }) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (isNaN(start) || isNaN(end) || start > end) throw new Error('Invalid date range');

  const rows = [];
  for (let d = new Date(start); d <= end && rows.length < 366; d.setDate(d.getDate() + 1)) {
    rows.push({
      teacher_id: teacherId,
      date: d.toISOString().slice(0, 10),
      reason: reason || '',
      type: 'full',
    });
  }
  if (!usingSupabase) {
    rows.forEach((r) => memCreate('teacher_leaves', r));
  } else {
    const { error } = await supabase.from('teacher_leaves').insert(rows);
    if (error) throw error;
  }
  await syncTeacherLeaves(teacherId);
  return rows.length;
}

export async function deleteLeave(teacherId, leaveId) {
  if (!usingSupabase) {
    if (!memRemove('teacher_leaves', leaveId)) return false;
  } else {
    const { error } = await supabase.from('teacher_leaves').delete().eq('id', leaveId);
    if (error) throw error;
  }
  await syncTeacherLeaves(teacherId);
  return true;
}

// Recompute this month's leave count for a teacher (rough stored value; the
// authoritative figures are computed fresh in listTeachers on every read).
async function syncTeacherLeaves(teacherId) {
  const leaves = await listLeaves(teacherId);
  const s = monthLeaveStats(leaves, currentMonth());
  await update('teachers', teacherId, {
    leave_days: s.count,
    chargeable_leaves: Math.round(s.chargeableDays),
  });
}

// Teachers list enriched with CURRENT-MONTH leave stats + session carry-over
// (recomputed on every read, so it resets automatically each month).
export async function listTeachers() {
  const teachers = await list('teachers');
  const month = currentMonth();
  let allLeaves;
  if (!usingSupabase) {
    allLeaves = mem.teacher_leaves || [];
  } else {
    const { data, error } = await supabase.from('teacher_leaves').select('*');
    if (error) throw error;
    allLeaves = data;
  }
  return teachers.map((t) => {
    const leaves = allLeaves.filter((l) => String(l.teacher_id) === String(t.id));
    const s = monthLeaveStats(leaves, month);
    return {
      ...t,
      leave_days: s.count,
      full_this_month: s.full,
      half_this_month: s.half,
      chargeable_days: s.chargeableDays,
      chargeable_leaves: Math.round(s.chargeableDays),
      unused_paid_leaves: unusedPaidLeaveCount(leaves, t.join_date),
    };
  });
}

// ---------- Payroll (monthly salary register) ----------
async function getAllLeaves() {
  if (!usingSupabase) return mem.teacher_leaves || [];
  const { data, error } = await supabase.from('teacher_leaves').select('*');
  if (error) throw error;
  return data;
}

// Live figures for a month, computed from current salaries + the leave register.
export async function payrollPreview(month) {
  const teachers = await list('teachers');
  const allLeaves = await getAllLeaves();
  return teachers.map((t) => {
    const leaves = allLeaves.filter((l) => String(l.teacher_id) === String(t.id));
    const s = monthLeaveStats(leaves, month);
    const salary = Number(t.salary) || 0;
    const deduction = Math.round(perDaySalary(salary) * s.chargeableDays);
    return {
      teacher_id: t.id, name: t.name, class: t.class || '',
      salary, leaves: s.count, chargeable: s.chargeableDays,
      deduction, net: Math.max(salary - deduction, 0),
    };
  });
}

export async function getPayroll(month) {
  if (!usingSupabase) {
    return (mem.payroll || [])
      .filter((p) => p.month === month)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }
  const { data, error } = await supabase.from('payroll').select('*').eq('month', month).order('name');
  if (error) throw error;
  return data;
}

// Save (lock in) a month's payroll snapshot. Overwrites any existing snapshot.
export async function generatePayroll(month) {
  const preview = await payrollPreview(month);
  const generated_at = new Date().toISOString();
  if (!usingSupabase) {
    mem.payroll = (mem.payroll || []).filter((p) => p.month !== month);
    for (const r of preview) mem.payroll.push({ id: randomUUID(), month, generated_at, ...r });
    saveLocal();
  } else {
    await supabase.from('payroll').delete().eq('month', month);
    const { error } = await supabase.from('payroll').insert(preview.map((r) => ({ month, generated_at, ...r })));
    if (error) throw error;
  }
  return getPayroll(month);
}

export async function payrollMonths() {
  let months;
  if (!usingSupabase) {
    months = (mem.payroll || []).map((p) => p.month);
  } else {
    const { data, error } = await supabase.from('payroll').select('month');
    if (error) throw error;
    months = data.map((d) => d.month);
  }
  return [...new Set(months)].sort().reverse();
}

// ---------- Auth: users, passwords & sessions ----------
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash);
  const b = Buffer.from(expectedHash || '');
  return a.length === b.length && timingSafeEqual(a, b);
}

async function findUserByUsername(username) {
  if (!usingSupabase) {
    return (mem.users || []).find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  }
  const { data, error } = await supabase.from('users').select('*').ilike('username', username).limit(1);
  if (error) throw error;
  return data && data[0];
}

// Returns the user (minus secrets) on success, or null on bad credentials.
export async function authenticate(username, password) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (!verifyPassword(password, user.salt, user.password_hash)) return null;
  const { salt, password_hash, ...safe } = user;
  return safe;
}

export async function createSession(userId) {
  const token = randomBytes(24).toString('hex');
  const row = { token, user_id: userId, created_at: new Date().toISOString() };
  if (!usingSupabase) {
    (mem.sessions ||= []).push(row);
    saveLocal();
  } else {
    const { error } = await supabase.from('sessions').insert(row);
    if (error) throw error;
  }
  return token;
}

// Resolves a session token to its user (minus secrets), or null.
export async function getSessionUser(token) {
  if (!token) return null;
  let session;
  if (!usingSupabase) {
    session = (mem.sessions || []).find((s) => s.token === token);
  } else {
    const { data } = await supabase.from('sessions').select('*').eq('token', token).limit(1);
    session = data && data[0];
  }
  if (!session) return null;
  let user;
  if (!usingSupabase) {
    user = (mem.users || []).find((u) => String(u.id) === String(session.user_id));
  } else {
    const { data } = await supabase.from('users').select('*').eq('id', session.user_id).limit(1);
    user = data && data[0];
  }
  if (!user) return null;
  const { salt, password_hash, ...safe } = user;
  return safe;
}

export async function deleteSession(token) {
  if (!usingSupabase) {
    mem.sessions = (mem.sessions || []).filter((s) => s.token !== token);
    saveLocal();
  } else {
    await supabase.from('sessions').delete().eq('token', token);
  }
}

// ---------- User management (developer only) ----------
const stripSecret = ({ salt, password_hash, ...u }) => u;

export async function listUsers() {
  if (!usingSupabase) {
    return (mem.users || []).map(stripSecret).sort((a, b) => String(a.username).localeCompare(String(b.username)));
  }
  const { data, error } = await supabase.from('users').select('id, username, name, role, created_at').order('username');
  if (error) throw error;
  return data;
}

export async function createUser({ username, name, role, password }) {
  const uname = String(username || '').trim();
  if (!uname) throw new Error('Username is required');
  if (!password) throw new Error('Password is required');
  if (!role) throw new Error('Role is required');
  if (await findUserByUsername(uname)) throw new Error('That username already exists');

  const { salt, hash } = hashPassword(password);
  const row = { username: uname, name: name || '', role, salt, password_hash: hash };
  let created;
  if (!usingSupabase) {
    created = memCreate('users', row);
  } else {
    const { data, error } = await supabase.from('users').insert(row).select().single();
    if (error) throw error;
    created = data;
  }
  return stripSecret(created);
}

export async function deleteUser(id) {
  if (!usingSupabase) {
    mem.sessions = (mem.sessions || []).filter((s) => String(s.user_id) !== String(id));
    return memRemove('users', id);
  }
  await supabase.from('sessions').delete().eq('user_id', id); // (also cascades)
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// On Supabase: make sure each default login account exists (adds any that are
// missing, e.g. the developer account on an already-populated database).
// No-op locally (those users are already in the seed).
export async function ensureDefaultUsers() {
  if (!usingSupabase) return;
  for (const u of sampleUsers) {
    if (await findUserByUsername(u.username)) continue;
    const { id, password, ...rest } = u; // let Supabase generate the uuid id
    const { salt, hash } = hashPassword(password);
    const { error } = await supabase.from('users').insert({ ...rest, salt, password_hash: hash });
    if (error) throw error;
    console.log('Seeded default login user into Supabase:', u.username);
  }
}
