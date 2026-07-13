// Sample data used to initialise the local JSON store (and handy for seeding
// Supabase later).

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
  { id: 's1', name: 'Aarav Sharma', registration_number: 'REG-2026-001', class: 'Fifth', section: 'A', dob: '2014-03-12', father_name: 'Rajesh Sharma', phone: '9812345670', address: 'MG Road, Pune', adhar_number: '2345 6789 0011', total_fees: 45000, paid_fees: 30000, photo: '' },
  { id: 's2', name: 'Diya Patel', registration_number: 'REG-2026-002', class: 'Fifth', section: 'A', dob: '2014-07-22', father_name: 'Mahesh Patel', phone: '9812345671', address: 'FC Road, Pune', adhar_number: '2345 6789 0022', total_fees: 45000, paid_fees: 45000, photo: '' },
  { id: 's3', name: 'Vihaan Gupta', registration_number: 'REG-2026-003', class: 'Fourth', section: 'B', dob: '2013-11-05', father_name: 'Anil Gupta', phone: '9812345672', address: 'Kothrud, Pune', adhar_number: '2345 6789 0033', total_fees: 48000, paid_fees: 12000, photo: '' },
  { id: 's4', name: 'Ananya Reddy', registration_number: 'REG-2026-004', class: 'Fourth', section: 'B', dob: '2013-01-19', father_name: 'Suresh Reddy', phone: '9812345673', address: 'Baner, Pune', adhar_number: '2345 6789 0044', total_fees: 48000, paid_fees: 48000, photo: '' },
  { id: 's5', name: 'Kabir Singh', registration_number: 'REG-2026-005', class: 'Third', section: 'A', dob: '2012-09-30', father_name: 'Harpreet Singh', phone: '9812345674', address: 'Wakad, Pune', adhar_number: '2345 6789 0055', total_fees: 50000, paid_fees: 20000, photo: '' },
];

export const sampleTeachers = [
  { id: 't1', name: 'Sunita Iyer', class: 'Fifth', email: 'sunita@bachpan.edu', phone_1: '9900112233', phone_2: '', join_date: '2019-06-10', adhar_number: '1111 2222 3301', salary: 42000, leave_days: 2, photo: '' },
  { id: 't2', name: 'Rakesh Menon', class: 'Fourth', email: 'rakesh@bachpan.edu', phone_1: '9900112234', phone_2: '9800011122', join_date: '2020-04-01', adhar_number: '1111 2222 3302', salary: 38000, leave_days: 0, photo: '' },
  { id: 't3', name: 'Priya Nair', class: 'Third', email: 'priya@bachpan.edu', phone_1: '9900112235', phone_2: '', join_date: '2018-07-15', adhar_number: '1111 2222 3303', salary: 45000, leave_days: 4, photo: '' },
  { id: 't4', name: 'Amit Deshmukh', class: 'Second', email: 'amit@bachpan.edu', phone_1: '9900112236', phone_2: '', join_date: '2021-08-20', adhar_number: '1111 2222 3304', salary: 36000, leave_days: 1, photo: '' },
];

export const samplePayments = [
  { id: 'p1', student_id: 's1', amount: 15000, note: 'Term 1', paid_on: '2026-04-05' },
  { id: 'p2', student_id: 's1', amount: 15000, note: 'Term 2', paid_on: '2026-06-10' },
  { id: 'p3', student_id: 's2', amount: 45000, note: 'Full year (one-time)', paid_on: '2026-04-02' },
  { id: 'p4', student_id: 's3', amount: 12000, note: 'Term 1', paid_on: '2026-04-08' },
  { id: 'p5', student_id: 's4', amount: 24000, note: 'Term 1', paid_on: '2026-04-03' },
  { id: 'p6', student_id: 's4', amount: 24000, note: 'Term 2', paid_on: '2026-07-01' },
  { id: 'p7', student_id: 's5', amount: 20000, note: 'Term 1', paid_on: '2026-04-06' },
];

export const sampleInventory = [
  { id: 'i1', item_name: 'Notebooks (200 pg)', category: 'Stationery', quantity: 40, unit: 'pcs', reorder_level: 50, supplier: 'Sharma Stationers', last_ordered: '2026-05-11' },
  { id: 'i2', item_name: 'Chalk (white)', category: 'Stationery', quantity: 12, unit: 'box', reorder_level: 20, supplier: 'Sharma Stationers', last_ordered: '2026-06-02' },
  { id: 'i3', item_name: 'Student Chairs', category: 'Furniture', quantity: 60, unit: 'pcs', reorder_level: 30, supplier: 'Modern Furniture Co', last_ordered: '2026-01-18' },
  { id: 'i4', item_name: 'Whiteboard Markers', category: 'Stationery', quantity: 8, unit: 'box', reorder_level: 15, supplier: 'Office Depot', last_ordered: '2026-06-20' },
  { id: 'i5', item_name: 'First-Aid Kits', category: 'Medical', quantity: 5, unit: 'kit', reorder_level: 10, supplier: 'HealthPlus', last_ordered: '2026-03-09' },
];
