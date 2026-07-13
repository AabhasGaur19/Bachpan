-- ============================================================
--  Bachpan School Management — Supabase / PostgreSQL schema
--  Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Classes ----------
-- The list of class names (e.g. Nursery, First, Second). Students and teachers
-- reference a class by its name.
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz default now()
);

-- ---------- Students ----------
create table if not exists students (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  registration_number  text,
  class                text,
  section              text,
  dob                  date,
  father_name          text,
  phone                text,
  address              text,
  adhar_number         text,
  total_fees           numeric default 0,   -- actual / total fees for the year
  paid_fees            numeric default 0,   -- how much has been paid so far
  -- "Fees left" is NOT stored; it is always computed as total_fees - paid_fees
  photo                text,
  created_at           timestamptz default now()
);

-- ---------- Fee payments (installment history) ----------
-- One row per deposit. A student's paid_fees is kept in sync with the sum
-- of these rows by the backend. Deleting a student removes their payments.
create table if not exists fee_payments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  amount      numeric not null,
  note        text,
  paid_on     date default current_date,
  created_at  timestamptz default now()
);

create index if not exists idx_fee_payments_student on fee_payments(student_id);

-- ---------- Teachers ----------
create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  class         text,
  email         text,
  phone_1       text,
  phone_2       text,
  join_date     date,
  adhar_number  text,
  salary        numeric default 0,   -- base monthly salary
  leave_days    integer default 0,   -- days on leave this month
  days_in_month integer default 30,  -- divisor for per-day pay (28/29/30/31 or working days)
  -- Net salary is NOT stored; it is computed as:
  --   salary - round(salary / days_in_month * leave_days)
  photo         text,
  created_at    timestamptz default now()
);

-- ---------- Inventory ----------
create table if not exists inventory (
  id            uuid primary key default gen_random_uuid(),
  item_name     text not null,
  category      text,
  quantity      integer default 0,
  unit          text,
  reorder_level integer default 0,
  supplier      text,
  last_ordered  date,
  created_at    timestamptz default now()
);

-- Note: The backend uses the SERVICE key and talks to these tables directly,
-- so Row Level Security is not required for the current (no-login) phase.
-- When you add staff login later, enable RLS and add policies here.
