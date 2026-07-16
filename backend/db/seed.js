// Sample data used to initialise the local JSON store (and handy for seeding
// Supabase later).

// Default login accounts. Passwords are plaintext here only for seeding; the
// store hashes them before saving. Change these (or add users) as needed.
export const sampleUsers = [
  { id: 'user-dev', username: 'developer', name: 'Developer', role: 'developer', password: 'dev@2026' },
  { id: 'user-admin', username: 'admin', name: 'School Admin', role: 'admin', password: 'admin@123' },
  { id: 'user-coord', username: 'coordinator', name: 'Coordinator', role: 'coordinator', password: 'coord@123' },
];

export const sampleClasses = [
  { id: 'c1', name: 'Nursery', created_at: '2026-01-01T00:00:01Z' },
  { id: 'c2', name: 'LKG', created_at: '2026-01-01T00:00:02Z' },
  { id: 'c3', name: 'UKG', created_at: '2026-01-01T00:00:03Z' },
  { id: 'c4', name: 'First', created_at: '2026-01-01T00:00:04Z' },
  { id: 'c5', name: 'Second', created_at: '2026-01-01T00:00:05Z' },
  { id: 'c6', name: 'Third', created_at: '2026-01-01T00:00:06Z' },
  { id: 'c7', name: 'Fourth', created_at: '2026-01-01T00:00:07Z' },
  { id: 'c8', name: 'Fifth', created_at: '2026-01-01T00:00:08Z' },
];

export const sampleStudents = [
  { id: 's1', name: 'Aarav Sharma', registration_number: 'REG-2026-001', class: 'Fifth', section: 'A', dob: '2014-03-12', father_name: 'Rajesh Sharma', phone: '9812345670', address: 'MG Road, Pune', adhar_number: '2345 6789 0011', total_fees: 45000, paid_fees: 30000 },
  { id: 's2', name: 'Diya Patel', registration_number: 'REG-2026-002', class: 'Fifth', section: 'A', dob: '2014-07-22', father_name: 'Mahesh Patel', phone: '9812345671', address: 'FC Road, Pune', adhar_number: '2345 6789 0022', total_fees: 45000, paid_fees: 45000 },
  { id: 's3', name: 'Vihaan Gupta', registration_number: 'REG-2026-003', class: 'Fourth', section: 'B', dob: '2013-11-05', father_name: 'Anil Gupta', phone: '9812345672', address: 'Kothrud, Pune', adhar_number: '2345 6789 0033', total_fees: 48000, paid_fees: 12000 },
  { id: 's4', name: 'Ananya Reddy', registration_number: 'REG-2026-004', class: 'Fourth', section: 'B', dob: '2013-01-19', father_name: 'Suresh Reddy', phone: '9812345673', address: 'Baner, Pune', adhar_number: '2345 6789 0044', total_fees: 48000, paid_fees: 48000 },
  { id: 's5', name: 'Kabir Singh', registration_number: 'REG-2026-005', class: 'Third', section: 'A', dob: '2012-09-30', father_name: 'Harpreet Singh', phone: '9812345674', address: 'Wakad, Pune', adhar_number: '2345 6789 0055', total_fees: 50000, paid_fees: 20000 },
];

// leave_days = total leaves taken; chargeable_leaves = leaves beyond the
// 1-free-per-month allowance (these are the ones deducted from salary).
export const sampleTeachers = [
  { id: 't1', name: 'Sunita Iyer', class: 'Fifth', email: 'sunita@bachpan.edu', phone_1: '9900112233', phone_2: '', join_date: '2019-06-10', adhar_number: '1111 2222 3301', salary: 42000, leave_days: 1, chargeable_leaves: 0 },
  { id: 't2', name: 'Rakesh Menon', class: 'Fourth', email: 'rakesh@bachpan.edu', phone_1: '9900112234', phone_2: '9800011122', join_date: '2020-04-01', adhar_number: '1111 2222 3302', salary: 38000, leave_days: 0, chargeable_leaves: 0 },
  { id: 't3', name: 'Priya Nair', class: 'Third', email: 'priya@bachpan.edu', phone_1: '9900112235', phone_2: '', join_date: '2018-07-15', adhar_number: '1111 2222 3303', salary: 45000, leave_days: 3, chargeable_leaves: 2 },
  { id: 't4', name: 'Amit Deshmukh', class: 'Second', email: 'amit@bachpan.edu', phone_1: '9900112236', phone_2: '', join_date: '2021-08-20', adhar_number: '1111 2222 3304', salary: 36000, leave_days: 0, chargeable_leaves: 0 },
];

// School-wide holidays (everyone off — not counted as teacher leave).
export const sampleHolidays = [
  { id: 'h1', name: 'Independence Day', date: '2026-08-15' },
  { id: 'h2', name: 'Ganesh Chaturthi', date: '2026-09-14' },
  { id: 'h3', name: 'Gandhi Jayanti', date: '2026-10-02' },
  { id: 'h4', name: 'Diwali', date: '2026-11-08' },
];

// Individual teacher leaves (register). Priya took 3 in July -> 1 free, 2 charged.
export const sampleTeacherLeaves = [
  { id: 'tl1', teacher_id: 't1', date: '2026-07-05', reason: 'Personal', type: 'full' },
  { id: 'tl2', teacher_id: 't3', date: '2026-07-03', reason: 'Sick leave', type: 'full' },
  { id: 'tl3', teacher_id: 't3', date: '2026-07-10', reason: 'Personal', type: 'half' },
  { id: 'tl4', teacher_id: 't3', date: '2026-07-18', reason: 'Family function', type: 'full' },
];

// A saved payroll snapshot for LAST month (June 2026) so there is history to see.
export const samplePayroll = [
  { id: 'pr1', month: '2026-06', teacher_id: 't1', name: 'Sunita Iyer', class: 'Fifth', salary: 42000, leaves: 2, chargeable: 1, deduction: 1400, net: 40600, generated_at: '2026-06-30T10:00:00Z' },
  { id: 'pr2', month: '2026-06', teacher_id: 't2', name: 'Rakesh Menon', class: 'Fourth', salary: 38000, leaves: 0, chargeable: 0, deduction: 0, net: 38000, generated_at: '2026-06-30T10:00:00Z' },
  { id: 'pr3', month: '2026-06', teacher_id: 't3', name: 'Priya Nair', class: 'Third', salary: 45000, leaves: 1, chargeable: 0, deduction: 0, net: 45000, generated_at: '2026-06-30T10:00:00Z' },
  { id: 'pr4', month: '2026-06', teacher_id: 't4', name: 'Amit Deshmukh', class: 'Second', salary: 36000, leaves: 3, chargeable: 2, deduction: 2400, net: 33600, generated_at: '2026-06-30T10:00:00Z' },
];

export const samplePayments = [
  { id: 'p1', student_id: 's1', amount: 15000, note: 'Term 1', paid_on: '2026-04-05', method: 'online', category: 'fee' },
  { id: 'p2', student_id: 's1', amount: 15000, note: 'Term 2', paid_on: '2026-06-10', method: 'cash', category: 'fee' },
  { id: 'p3', student_id: 's2', amount: 45000, note: 'Full year (one-time)', paid_on: '2026-04-02', method: 'online', category: 'fee' },
  { id: 'p4', student_id: 's3', amount: 12000, note: 'Term 1', paid_on: '2026-04-08', method: 'cash', category: 'fee' },
  { id: 'p5', student_id: 's4', amount: 24000, note: 'Term 1', paid_on: '2026-04-03', method: 'online', category: 'fee' },
  { id: 'p6', student_id: 's4', amount: 24000, note: 'Term 2', paid_on: '2026-07-01', method: 'cash', category: 'fee' },
  { id: 'p7', student_id: 's5', amount: 20000, note: 'Term 1', paid_on: '2026-04-06', method: 'online', category: 'fee' },
  { id: 'p8', student_id: 's5', amount: 300, note: 'Admission form', paid_on: '2026-04-06', method: 'cash', category: 'admission' },
];

// An item has a name and a list of "variants" — each a free-text label you name
// yourself (e.g. "Size 9") with its own quantity. A simple item is just one
// variant with a blank label.
export const sampleInventory = [
  { id: 'i1', name: 'Notebooks (200 pg)', variants: [{ label: '', quantity: 120 }] },
  { id: 'i2', name: 'Shoes', variants: [{ label: 'Size 6', quantity: 12 }, { label: 'Size 7', quantity: 18 }, { label: 'Size 8', quantity: 10 }] },
  { id: 'i3', name: 'Student Chairs', variants: [{ label: '', quantity: 60 }] },
  { id: 'i4', name: 'Sweaters', variants: [{ label: 'Small', quantity: 20 }, { label: 'Medium', quantity: 15 }, { label: 'Large', quantity: 8 }] },
  { id: 'i5', name: 'Chalk (white)', variants: [{ label: '', quantity: 25 }] },
];
