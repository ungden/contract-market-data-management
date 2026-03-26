-- ============================================
-- Contract & Market Data Management Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. Users (profiles linked to Supabase Auth)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  role text not null default 'market_staff' check (role in ('admin', 'sale_admin', 'market_staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. Customers
-- ============================================
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tax_code text,
  address text,
  bank_account text,
  legal_representative text,
  contact_person text,
  phone text,
  gps_lat double precision,
  gps_lng double precision,
  notes text,
  created_by uuid not null references public.users(id),
  creator_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 3. Products
-- ============================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  origin text,
  unit text not null default '',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- 4. Contract Templates
-- ============================================
create table public.contract_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  description text,
  fields_json text not null default '[]',
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- 5. Contracts
-- ============================================
create table public.contracts (
  id uuid primary key default uuid_generate_v4(),
  contract_no text not null,
  template_id uuid not null references public.contract_templates(id),
  template_name text not null,
  customer_id uuid references public.customers(id),
  customer_name text not null default '',
  company_name text not null default '',
  data_json text not null default '{}',
  year integer not null default extract(year from now()),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  created_by uuid not null references public.users(id),
  creator_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sequence for auto-increment contract numbers per year
create table public.contract_sequences (
  year integer primary key,
  last_number integer not null default 0
);

-- ============================================
-- 6. Market Visits
-- ============================================
create table public.market_visits (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references public.users(id),
  staff_name text not null default '',
  visit_date timestamptz not null default now(),
  area text,
  customer_id uuid references public.customers(id),
  customer_name text,
  shop_name text not null,
  address text,
  contact_person text,
  notes text,
  photo_urls jsonb default '[]',
  gps_lat double precision,
  gps_lng double precision,
  product_lines jsonb default '[]',
  created_at timestamptz not null default now()
);

-- ============================================
-- Indexes
-- ============================================
create index idx_customers_created_by on public.customers(created_by);
create index idx_customers_name on public.customers(name);
create index idx_contracts_created_by on public.contracts(created_by);
create index idx_contracts_status on public.contracts(status);
create index idx_contracts_year on public.contracts(year);
create index idx_contracts_contract_no on public.contracts(contract_no);
create index idx_market_visits_staff_id on public.market_visits(staff_id);
create index idx_market_visits_visit_date on public.market_visits(visit_date);
create index idx_market_visits_customer_id on public.market_visits(customer_id);
create index idx_products_created_by on public.products(created_by);

-- ============================================
-- Function: Get next contract number
-- ============================================
create or replace function public.get_next_contract_number(p_year integer)
returns integer
language plpgsql
as $$
declare
  v_next integer;
begin
  insert into public.contract_sequences (year, last_number)
  values (p_year, 1)
  on conflict (year)
  do update set last_number = contract_sequences.last_number + 1
  returning last_number into v_next;

  return v_next;
end;
$$;

-- ============================================
-- Function: Auto-update updated_at
-- ============================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.update_updated_at();

create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute function public.update_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_sequences enable row level security;
alter table public.market_visits enable row level security;

-- Helper: get user role
create or replace function public.get_user_role()
returns text
language sql
stable
as $$
  select role from public.users where id = auth.uid();
$$;

-- Helper: check if admin
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select role = 'admin' from public.users where id = auth.uid();
$$;

-- USERS policies
create policy "Users can view own profile" on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy "Admin can manage users" on public.users
  for all using (public.is_admin());

create policy "Users can update own profile" on public.users
  for update using (id = auth.uid());

-- CUSTOMERS policies
create policy "Admin sees all customers" on public.customers
  for select using (public.is_admin());

create policy "Users see own customers" on public.customers
  for select using (created_by = auth.uid());

create policy "Authenticated users can create customers" on public.customers
  for insert with check (auth.uid() is not null);

create policy "Admin can update any customer" on public.customers
  for update using (public.is_admin());

create policy "Users can update own customers" on public.customers
  for update using (created_by = auth.uid());

create policy "Admin can delete customers" on public.customers
  for delete using (public.is_admin());

-- PRODUCTS policies
create policy "Anyone can view products" on public.products
  for select using (auth.uid() is not null);

create policy "Admin and sale_admin can manage products" on public.products
  for all using (public.get_user_role() in ('admin', 'sale_admin'));

-- CONTRACT TEMPLATES policies
create policy "Anyone can view templates" on public.contract_templates
  for select using (auth.uid() is not null);

create policy "Admin and sale_admin can manage templates" on public.contract_templates
  for all using (public.get_user_role() in ('admin', 'sale_admin'));

-- CONTRACTS policies
create policy "Admin sees all contracts" on public.contracts
  for select using (public.is_admin());

create policy "Users see own contracts" on public.contracts
  for select using (created_by = auth.uid());

create policy "Admin and sale_admin can create contracts" on public.contracts
  for insert with check (public.get_user_role() in ('admin', 'sale_admin'));

create policy "Admin can update any contract" on public.contracts
  for update using (public.is_admin());

create policy "Creator can update own contracts" on public.contracts
  for update using (created_by = auth.uid());

create policy "Admin can delete contracts" on public.contracts
  for delete using (public.is_admin());

-- CONTRACT SEQUENCES policies
create policy "Authenticated can use sequences" on public.contract_sequences
  for all using (auth.uid() is not null);

-- MARKET VISITS policies
create policy "Admin sees all visits" on public.market_visits
  for select using (public.is_admin());

create policy "Staff sees own visits" on public.market_visits
  for select using (staff_id = auth.uid());

create policy "Authenticated users can create visits" on public.market_visits
  for insert with check (auth.uid() is not null);

create policy "Admin can update any visit" on public.market_visits
  for update using (public.is_admin());

create policy "Staff can update own visits" on public.market_visits
  for update using (staff_id = auth.uid());

create policy "Admin can delete visits" on public.market_visits
  for delete using (public.is_admin());

-- ============================================
-- Storage bucket for visit photos
-- ============================================
-- Run in Supabase dashboard:
-- create bucket 'visit-photos' with public = true

-- ============================================
-- Auto-create user profile on first auth
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(
      (select role from public.users where email = new.email limit 1),
      'market_staff'
    ),
    true
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
