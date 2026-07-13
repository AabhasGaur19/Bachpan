// Data access layer.
// If SUPABASE_URL + SUPABASE_SERVICE_KEY are set, everything reads/writes to
// your real Supabase (PostgreSQL) database. Otherwise it uses a LOCAL JSON
// file (db/data.json) so the app works out-of-the-box AND survives restarts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  sampleStudents, sampleTeachers, sampleInventory, sampleClasses, samplePayments,
} from './seed.js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

export const usingSupabase = Boolean(url && key);
const supabase = usingSupabase ? createClient(url, key) : null;

// Column each table is ordered by when listed.
const ORDER = {
  students: 'name',
  teachers: 'name',
  inventory: 'item_name',
  classes: 'created_at',
  fee_payments: 'paid_on',
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

export async function addPayment(studentId, { amount, note, paid_on }) {
  const row = {
    student_id: studentId,
    amount: Number(amount) || 0,
    note: note || '',
    paid_on: paid_on || new Date().toISOString().slice(0, 10),
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
  const paid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  await update('students', studentId, { paid_fees: paid });
}
