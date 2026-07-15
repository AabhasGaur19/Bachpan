// Formatting + derived-value helpers shared across pages.

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function money(value) {
  const n = Number(value) || 0;
  return inr.format(n);
}

// Students: fees remaining = total - paid (never below 0)
export function feesLeft(student) {
  const left = (Number(student.total_fees) || 0) - (Number(student.paid_fees) || 0);
  return Math.max(left, 0);
}

// Teachers: per-day pay is always based on a fixed 30-day month.
export function perDay(salary) {
  return (Number(salary) || 0) / 30;
}

// Deductible leave-DAYS this month (fractional because of half-days).
export function chargeableDays(teacher) {
  if (teacher?.chargeable_days != null) return Number(teacher.chargeable_days);
  return Number(teacher?.chargeable_leaves) || 0; // fallback for older data
}

export function leaveDeduction(teacher) {
  return Math.round(perDay(teacher.salary) * chargeableDays(teacher));
}

export function netSalary(teacher) {
  return Math.max((Number(teacher.salary) || 0) - leaveDeduction(teacher), 0);
}

// ----- Leave register helpers (shared by the Leaves panel) -----
export const FREE_LEAVES_PER_MONTH = 1;
const SESSION_START_MONTH = 4; // April
const ymOf = (d) => String(d).slice(0, 7);

// Full/half counts + chargeable days for one 'YYYY-MM'.
export function leaveMonthStats(leaves, ym) {
  const inMonth = (leaves || []).filter((l) => ymOf(l.date) === ym);
  const full = inMonth.filter((l) => l.type !== 'half').length;
  const half = inMonth.filter((l) => l.type === 'half').length;
  const chargeableDays = Math.max(full - FREE_LEAVES_PER_MONTH, 0) + 0.5 * half;
  const paidUsed = Math.min(full, FREE_LEAVES_PER_MONTH); // free full-day used this month
  return { count: inMonth.length, full, half, chargeableDays, paidUsed };
}

export function sessionStartYm(now = new Date()) {
  const y = now.getFullYear();
  const startYear = (now.getMonth() + 1) >= SESSION_START_MONTH ? y : y - 1;
  return `${startYear}-${String(SESSION_START_MONTH).padStart(2, '0')}`;
}

// Past months this session (from join date) with no full-day leave -> unused
// paid leaves. Returns { count, months: ['2026-04', ...] }.
export function unusedPaidLeaves(leaves, joinDate, now = new Date()) {
  const startYm = sessionStartYm(now);
  const joinYm = joinDate ? ymOf(joinDate) : '0000-00';
  let [yy, mm] = (startYm > joinYm ? startYm : joinYm).split('-').map(Number);
  const curYm = now.toISOString().slice(0, 7);
  const months = [];
  for (let guard = 0; guard < 24; guard++) {
    const ym = `${yy}-${String(mm).padStart(2, '0')}`;
    if (ym >= curYm) break;
    if (leaveMonthStats(leaves, ym).full === 0) months.push(ym);
    mm++; if (mm > 12) { mm = 1; yy++; }
  }
  return { count: months.length, months };
}

export function monthName(ym) {
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}
