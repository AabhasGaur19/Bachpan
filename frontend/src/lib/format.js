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

// Teachers: per-day pay is always based on a fixed 30-day month,
// regardless of how many days the calendar month actually has.
export function perDay(salary) {
  return (Number(salary) || 0) / 30;
}

// Deductible leaves = leaves beyond the 1-free-per-month allowance.
// Falls back to total leave_days for older records without the field.
export function chargeableLeaves(teacher) {
  return teacher?.chargeable_leaves != null
    ? Number(teacher.chargeable_leaves)
    : (Number(teacher?.leave_days) || 0);
}

export function leaveDeduction(teacher) {
  return Math.round(perDay(teacher.salary) * chargeableLeaves(teacher));
}

export function netSalary(teacher) {
  return Math.max((Number(teacher.salary) || 0) - leaveDeduction(teacher), 0);
}
