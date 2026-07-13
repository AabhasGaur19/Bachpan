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

// Actual number of days in a given month (defaults to the current month).
export function daysInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// How many days the salary is divided over. Uses the teacher's own
// days_in_month if set (e.g. 28/29/30/31, or working days like 26),
// otherwise falls back to 30.
export function payDays(teacher) {
  return Number(teacher?.days_in_month) || 30;
}

// Per-day pay = monthly salary / days in that month.
export function perDay(salary, days = 30) {
  const d = Number(days) || 30;
  return (Number(salary) || 0) / d;
}

export function leaveDeduction(teacher) {
  return Math.round(perDay(teacher.salary, payDays(teacher)) * (Number(teacher.leave_days) || 0));
}

export function netSalary(teacher) {
  return Math.max((Number(teacher.salary) || 0) - leaveDeduction(teacher), 0);
}
