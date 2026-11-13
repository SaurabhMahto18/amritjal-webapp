-- Amrit Jal initial schema. Apply to a NEW Supabase project only.
-- Auth users are created by Supabase Auth; never expose service_role keys in browser code.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','manager','staff','viewer');
create type public.record_status as enum ('active','inactive','archived');
create type public.delivery_shift as enum ('morning','evening','other');
create type public.payment_method as enum ('cash','upi','bank_transfer','card','cheque','wallet','other');
create type public.invoice_status as enum ('draft','issued','partially_paid','paid','void');
create type public.jar_movement_type as enum ('opening','loaded','unloaded','delivered','returned','damaged','lost','adjustment');
create type public.ledger_entry_type as enum ('opening_balance','delivery_charge','payment','invoice','invoice_adjustment','expense_adjustment','credit_note','debit_note','manual_adjustment');
create type public.message_status as enum ('queued','processing','sent','delivered','failed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  preferred_language text not null default 'hi' check (preferred_language in ('hi','en')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  phone text,
  email text,
  address text,
  village text,
  district text,
  state text default 'Bihar',
  postal_code text,
  country text not null default 'India',
  logo_url text,
  currency_code char(3) not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  invoice_prefix text not null default 'AJ',
  default_due_days integer not null default 0 check (default_due_days between 0 and 365),
  settings jsonb not null default '{}'::jsonb,
  status public.record_status not null default 'active',
  created_by uuid not null references auth.users(id),
  owner_id uuid references auth.users(id), -- compatibility for current frontend owner lookups
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'staff',
  permissions jsonb not null default '{}'::jsonb,
  status public.record_status not null default 'active',
  joined_at timestamptz not null default now(), created_at timestamptz not null default now(),
  unique (business_id,user_id), unique (id,business_id)
);

create table public.customer_groups (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, description text, status public.record_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (business_id,name), unique (id,business_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, sku text, description text, unit text not null default 'jar', jar_size_l numeric(8,2),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0), cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  is_returnable_jar boolean not null default true, status public.record_status not null default 'active', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id,business_id), unique (business_id,sku)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  group_id uuid, customer_code text, code text, name text not null, phone text, alternate_phone text, email text,
  address text, area text, village text, district text, state text, postal_code text, landmark text,
  jar_rate numeric(12,2) not null default 20 check(jar_rate >= 0), archived boolean not null default false,
  opening_balance numeric(12,2) not null default 0, credit_limit numeric(12,2), due_days integer not null default 0 check (due_days between 0 and 365),
  notes text, status public.record_status not null default 'active', metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz,
  constraint customers_group_fk foreign key (group_id,business_id) references public.customer_groups(id,business_id) on delete restrict,
  unique (id,business_id), unique (business_id,customer_code)
);

create table public.customer_group_members (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  group_id uuid not null, customer_id uuid not null, created_at timestamptz not null default now(),
  foreign key(group_id,business_id) references public.customer_groups(id,business_id) on delete cascade,
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete cascade,
  unique(group_id,customer_id), unique(id,business_id)
);

create table public.customer_rate_plans (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null, product_id uuid not null, unit_price numeric(12,2) not null check(unit_price >= 0),
  effective_from date not null default current_date, effective_to date, created_at timestamptz not null default now(),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete cascade,
  foreign key(product_id,business_id) references public.products(id,business_id) on delete restrict,
  check(effective_to is null or effective_to >= effective_from), unique(id,business_id)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null, employee_code text, full_name text not null, phone text, email text,
  address text, job_title text, joining_date date, salary numeric(12,2) not null default 0 check(salary >= 0),
  permissions jsonb not null default '{}'::jsonb, status public.record_status not null default 'active', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id), unique(business_id,employee_code)
);

create table public.delivery_routes (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, description text, assigned_employee_id uuid, status public.record_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id), unique(business_id,name),
  foreign key(assigned_employee_id,business_id) references public.employees(id,business_id) on delete restrict
);
create table public.route_customers (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  route_id uuid not null, customer_id uuid not null, sequence_no integer not null default 0,
  foreign key(route_id,business_id) references public.delivery_routes(id,business_id) on delete cascade,
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete cascade,
  unique(route_id,customer_id), unique(id,business_id)
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null, route_id uuid, delivered_by uuid, delivery_date date not null default current_date,
  shift public.delivery_shift not null default 'morning', reference_no text, notes text,
  status public.record_status not null default 'active', source text not null default 'manual' check(source in ('manual','bulk_import','recurring','api')),
  idempotency_key text, created_by uuid references auth.users(id),
  jar_quantity numeric(12,3) not null default 0 check(jar_quantity >= 0), jars_received numeric(12,3) not null default 0 check(jars_received >= 0),
  jar_rate numeric(12,2) not null default 0 check(jar_rate >= 0), amount numeric(12,2) not null default 0 check(amount >= 0),
  delivery_shift text not null default 'morning', delivery_person text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
  foreign key(route_id,business_id) references public.delivery_routes(id,business_id) on delete restrict,
  foreign key(delivered_by,business_id) references public.employees(id,business_id) on delete restrict,
  unique(id,business_id), unique(business_id,idempotency_key)
);
create table public.delivery_items (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  delivery_id uuid not null, product_id uuid not null, quantity_delivered numeric(12,3) not null default 0 check(quantity_delivered >= 0),
  quantity_returned numeric(12,3) not null default 0 check(quantity_returned >= 0), unit_price numeric(12,2) not null default 0 check(unit_price >= 0),
  line_total numeric(12,2) generated always as (round(quantity_delivered * unit_price,2)) stored,
  notes text, created_at timestamptz not null default now(),
  foreign key(delivery_id,business_id) references public.deliveries(id,business_id) on delete cascade,
  foreign key(product_id,business_id) references public.products(id,business_id) on delete restrict, unique(id,business_id)
);

create table public.jar_transactions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid, product_id uuid not null, employee_id uuid, delivery_id uuid, movement_type public.jar_movement_type not null,
  quantity numeric(12,3) not null check(quantity > 0), transaction_date date not null default current_date, notes text,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
  foreign key(product_id,business_id) references public.products(id,business_id) on delete restrict,
  foreign key(employee_id,business_id) references public.employees(id,business_id) on delete restrict,
  foreign key(delivery_id,business_id) references public.deliveries(id,business_id) on delete set null, unique(id,business_id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null, invoice_number text not null, invoice_date date not null default current_date, period_start date, period_end date,
  due_date date, status public.invoice_status not null default 'draft', subtotal numeric(12,2) not null default 0 check(subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check(discount_amount >= 0), tax_amount numeric(12,2) not null default 0 check(tax_amount >= 0),
  total_amount numeric(12,2) not null default 0 check(total_amount >= 0), amount_paid numeric(12,2) not null default 0 check(amount_paid >= 0),
  notes text, created_by uuid references auth.users(id), issued_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
  check(period_end is null or period_start is null or period_end >= period_start), check(amount_paid <= total_amount),
  unique(id,business_id), unique(business_id,invoice_number)
);
create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid not null, product_id uuid, description text not null, quantity numeric(12,3) not null default 1 check(quantity >= 0),
  unit_price numeric(12,2) not null default 0 check(unit_price >= 0), line_total numeric(12,2) not null default 0 check(line_total >= 0),
  source_delivery_item_id uuid, created_at timestamptz not null default now(),
  foreign key(invoice_id,business_id) references public.invoices(id,business_id) on delete cascade,
  foreign key(product_id,business_id) references public.products(id,business_id) on delete restrict,
  foreign key(source_delivery_item_id,business_id) references public.delivery_items(id,business_id) on delete restrict, unique(id,business_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid, employee_id uuid, payment_date date not null default current_date, amount numeric(12,2) not null check(amount > 0),
  method public.payment_method not null default 'cash', reference_no text, purpose text not null default 'customer_payment' check(purpose in ('customer_payment','employee_payment','refund','advance','other')),
  notes text, received_by uuid references auth.users(id), created_at timestamptz not null default now(),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
  foreign key(employee_id,business_id) references public.employees(id,business_id) on delete restrict,
  check ((purpose='customer_payment' and customer_id is not null) or (purpose='employee_payment' and employee_id is not null) or purpose not in ('customer_payment','employee_payment')),
  unique(id,business_id)
);
create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  payment_id uuid not null, invoice_id uuid not null, amount numeric(12,2) not null check(amount > 0), created_at timestamptz not null default now(),
  foreign key(payment_id,business_id) references public.payments(id,business_id) on delete cascade,
  foreign key(invoice_id,business_id) references public.invoices(id,business_id) on delete restrict, unique(payment_id,invoice_id), unique(id,business_id)
);

create table public.customer_ledger_entries (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null, entry_date date not null default current_date, entry_type public.ledger_entry_type not null,
  debit numeric(12,2) not null default 0 check(debit >= 0), credit numeric(12,2) not null default 0 check(credit >= 0),
  description text not null, reference_type text, reference_id uuid, idempotency_key text, created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
  check(not (debit > 0 and credit > 0)), unique(id,business_id), unique(business_id,idempotency_key)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  expense_date date not null default current_date, category text not null, description text not null, amount numeric(12,2) not null check(amount > 0),
  payment_method public.payment_method not null default 'cash', vendor text, receipt_url text, employee_id uuid, notes text,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id),
  foreign key(employee_id,business_id) references public.employees(id,business_id) on delete restrict
);
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  employee_id uuid not null, transaction_date date not null default current_date, direction text not null check(direction in ('credit','debit')),
  amount numeric(12,2) not null check(amount > 0), reason text not null, reference_no text, payment_id uuid, created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  foreign key(employee_id,business_id) references public.employees(id,business_id) on delete restrict,
  foreign key(payment_id,business_id) references public.payments(id,business_id) on delete restrict, unique(id,business_id)
);
create table public.employee_leaves (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  employee_id uuid not null, start_date date not null, end_date date not null, leave_type text not null default 'casual', reason text,
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')), reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), check(end_date >= start_date), unique(id,business_id),
  foreign key(employee_id,business_id) references public.employees(id,business_id) on delete cascade
);
create table public.business_events (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null, description text, starts_at timestamptz not null, ends_at timestamptz, all_day boolean not null default false,
  customer_id uuid, employee_id uuid, created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  check(ends_at is null or ends_at >= starts_at), unique(id,business_id),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
  foreign key(employee_id,business_id) references public.employees(id,business_id) on delete restrict
);
create table public.import_batches (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  file_name text, file_hash text, import_type text not null default 'monthly_delivery', period_start date, period_end date,
  status text not null default 'pending' check(status in ('pending','validated','processing','completed','failed','cancelled')),
  total_rows integer not null default 0, successful_rows integer not null default 0, failed_rows integer not null default 0,
  error_summary jsonb not null default '[]'::jsonb, created_by uuid references auth.users(id), created_at timestamptz not null default now(), completed_at timestamptz,
  unique(id,business_id), unique(business_id,file_hash)
);
create table public.import_rows (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  batch_id uuid not null, row_number integer not null, raw_data jsonb not null default '{}'::jsonb, normalized_data jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check(status in ('pending','valid','imported','skipped','failed')), error_messages jsonb not null default '[]'::jsonb,
  delivery_id uuid, created_at timestamptz not null default now(),
  foreign key(batch_id,business_id) references public.import_batches(id,business_id) on delete cascade,
  foreign key(delivery_id,business_id) references public.deliveries(id,business_id) on delete set null, unique(batch_id,row_number), unique(id,business_id)
);
create table public.message_jobs (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid, channel text not null check(channel in ('sms','whatsapp','email')), template_key text, recipient text not null,
  subject text, message_body text not null, status public.message_status not null default 'queued', provider_message_id text,
  scheduled_at timestamptz, sent_at timestamptz, delivered_at timestamptz, error_message text, metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id),
  foreign key(customer_id,business_id) references public.customers(id,business_id) on delete set null
);
create table public.message_delivery_events (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  message_job_id uuid not null, event_type text not null, payload jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now(),
  foreign key(message_job_id,business_id) references public.message_jobs(id,business_id) on delete cascade
);
create table public.audit_logs (
  id bigint generated always as identity primary key, business_id uuid not null references public.businesses(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null, action text not null, table_name text not null,
  record_id uuid, old_data jsonb, new_data jsonb, request_id text, created_at timestamptz not null default now()
);

-- Access helpers: all data access is scoped to a business membership; owner/admin can manage members.
create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists(select 1 from public.business_members m where m.business_id=p_business_id and m.user_id=auth.uid() and m.status='active') $$;
create or replace function public.has_business_role(p_business_id uuid, p_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists(select 1 from public.business_members m where m.business_id=p_business_id and m.user_id=auth.uid() and m.status='active' and m.role = any(p_roles)) $$;
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.has_business_role(uuid,public.member_role[]) from public;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_role(uuid,public.member_role[]) to authenticated;

-- Profile is private to its owner; a business member can see other member profiles only through application joins as needed.
alter table public.profiles enable row level security;
create policy profiles_select_self on public.profiles for select to authenticated using (id=auth.uid());
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id=auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

-- Business row policies; create owner membership through the onboarding RPC below.
alter table public.businesses enable row level security;
create policy businesses_select_member on public.businesses for select to authenticated using (public.is_business_member(id));
create policy businesses_update_admin on public.businesses for update to authenticated using (public.has_business_role(id,array['owner','admin']::public.member_role[])) with check (public.has_business_role(id,array['owner','admin']::public.member_role[]));

-- Secure business onboarding: creates business and owner membership atomically.
create or replace function public.create_business(p_name text, p_phone text default null, p_address text default null)
returns uuid language plpgsql security definer set search_path=public,auth
as $$
declare v_business_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'Business name is required'; end if;
  insert into public.businesses(name,phone,address,created_by,owner_id) values(trim(p_name),nullif(trim(p_phone),''),nullif(trim(p_address),''),auth.uid(),auth.uid()) returning id into v_business_id;
  insert into public.business_members(business_id,user_id,role) values(v_business_id,auth.uid(),'owner');
  insert into public.profiles(id) values(auth.uid()) on conflict(id) do nothing;
  return v_business_id;
end $$;
revoke all on function public.create_business(text,text,text) from public;
grant execute on function public.create_business(text,text,text) to authenticated;

-- Enable RLS and apply a uniform tenant policy to every business-scoped table.
do $$
declare t text;
begin
  foreach t in array array[
    'customer_groups','customer_group_members','products','customers','customer_rate_plans','employees','delivery_routes','route_customers',
    'deliveries','delivery_items','jar_transactions','invoices','invoice_lines','payments','payment_allocations','customer_ledger_entries',
    'expenses','wallet_transactions','employee_leaves','business_events','import_batches','import_rows','message_jobs','message_delivery_events','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_business_member(business_id))',t||'_tenant_select',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_business_role(business_id,array[''owner'',''admin'',''manager'',''staff'']::public.member_role[]))',t||'_tenant_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_business_role(business_id,array[''owner'',''admin'',''manager'',''staff'']::public.member_role[])) with check (public.has_business_role(business_id,array[''owner'',''admin'',''manager'',''staff'']::public.member_role[]))',t||'_tenant_update',t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_business_role(business_id,array[''owner'',''admin'']::public.member_role[]))',t||'_tenant_delete',t);
  end loop;
end $$;
alter table public.business_members enable row level security;
create policy business_members_tenant_select on public.business_members for select to authenticated using (public.is_business_member(business_id));

-- Membership rows may be read by members, but only owners/admins may invite/change/remove memberships.
create policy business_members_owner_insert on public.business_members for insert to authenticated with check (
  user_id=auth.uid() and role='owner' and exists(select 1 from public.businesses b where b.id=business_id and b.created_by=auth.uid())
  or public.has_business_role(business_id,array['owner','admin']::public.member_role[])
);
create policy business_members_owner_update on public.business_members for update to authenticated using (public.has_business_role(business_id,array['owner','admin']::public.member_role[])) with check (public.has_business_role(business_id,array['owner','admin']::public.member_role[]));
create policy business_members_owner_delete on public.business_members for delete to authenticated using (public.has_business_role(business_id,array['owner']::public.member_role[]));

-- Indexes for everyday list views, date filters, joins, idempotent import, and outstanding balance queries.
create index idx_members_user on public.business_members(user_id,business_id) where status='active';
create index idx_group_members_customer on public.customer_group_members(business_id,customer_id);
create index idx_customers_business_status_name on public.customers(business_id,status,name);
create index idx_customers_business_phone on public.customers(business_id,phone);
create index idx_products_business_status on public.products(business_id,status,name);
create index idx_deliveries_business_date on public.deliveries(business_id,delivery_date desc);
create index idx_deliveries_customer_date on public.deliveries(business_id,customer_id,delivery_date desc);
create index idx_delivery_items_delivery on public.delivery_items(business_id,delivery_id);
create index idx_jar_customer_date on public.jar_transactions(business_id,customer_id,transaction_date desc);
create index idx_jar_product_date on public.jar_transactions(business_id,product_id,transaction_date desc);
create index idx_invoices_customer_date on public.invoices(business_id,customer_id,invoice_date desc);
create index idx_invoices_status_due on public.invoices(business_id,status,due_date);
create index idx_invoice_lines_invoice on public.invoice_lines(business_id,invoice_id);
create index idx_payments_customer_date on public.payments(business_id,customer_id,payment_date desc);
create index idx_payments_employee_date on public.payments(business_id,employee_id,payment_date desc);
create index idx_payment_allocations_invoice on public.payment_allocations(business_id,invoice_id);
create index idx_ledger_customer_date on public.customer_ledger_entries(business_id,customer_id,entry_date desc,created_at desc);
create index idx_expenses_business_date on public.expenses(business_id,expense_date desc);
create index idx_wallet_employee_date on public.wallet_transactions(business_id,employee_id,transaction_date desc);
create index idx_leaves_employee_dates on public.employee_leaves(business_id,employee_id,start_date,end_date);
create index idx_events_business_start on public.business_events(business_id,starts_at);
create index idx_import_rows_batch_status on public.import_rows(business_id,batch_id,status);
create index idx_message_jobs_status_schedule on public.message_jobs(business_id,status,scheduled_at) where status in ('queued','processing');
create index idx_audit_logs_business_created on public.audit_logs(business_id,created_at desc);

-- Keep updated_at current on mutable records.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','businesses','customer_groups','customer_group_members','products','customers','employees','delivery_routes','deliveries','invoices','expenses','message_jobs'] loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',t||'_set_updated_at',t); end loop; end $$;

-- Bootstrap a profile when Supabase Auth creates a user. Business creation is an explicit authenticated RPC.
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer set search_path=public
as $$ begin insert into public.profiles(id,full_name) values(new.id, coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

-- NOTE: customer balances are derived from ledger entries/invoice/payment allocation data, not duplicated mutable columns.
