-- Receipt/Invoice Tracker — multi-tenant schema, RLS, and bootstrap triggers.

create type member_role as enum ('owner', 'admin', 'member');
create type receipt_status as enum ('uploaded', 'processing', 'extracted', 'failed');

-- 1:1 with auth.users
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index on organization_members (user_id);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id),
  r2_key text not null,
  original_filename text not null,
  mime_type text not null,
  status receipt_status not null default 'uploaded',
  vendor text,
  receipt_date date,
  currency text,
  total_amount numeric(12, 2),
  tax_amount numeric(12, 2),
  payer text,
  category text,
  raw_extraction jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on receipts (org_id, created_at desc);

create table receipt_line_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts (id) on delete cascade,
  description text not null,
  quantity numeric(12, 3),
  unit_price numeric(12, 2),
  line_total numeric(12, 2)
);
create index on receipt_line_items (receipt_id);

-- SECURITY DEFINER membership check: bypasses RLS so policies on
-- organization_members do not recurse infinitely.
create function is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members
    where org_id = org and user_id = auth.uid()
  );
$$;

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger receipts_set_updated_at
  before update on receipts
  for each row execute function set_updated_at();

-- Create a profile row when a new auth user signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Creator becomes the owner of any organization they create.
create function handle_new_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into organization_members (org_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_org_created
  after insert on organizations
  for each row execute function handle_new_org();

-- Row Level Security
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table receipts enable row level security;
alter table receipt_line_items enable row level security;

create policy "own profile is selectable"
  on profiles for select using (id = auth.uid());
create policy "own profile is updatable"
  on profiles for update using (id = auth.uid());

create policy "member can read their orgs"
  on organizations for select using (is_org_member(id));
create policy "any authed user can create an org"
  on organizations for insert with check (created_by = auth.uid());

create policy "member can read org membership"
  on organization_members for select using (is_org_member(org_id));
create policy "owner can manage membership"
  on organization_members for all
  using (
    exists (
      select 1 from organization_members m
      where m.org_id = organization_members.org_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

create policy "member can read org receipts"
  on receipts for select using (is_org_member(org_id));
create policy "member can write org receipts"
  on receipts for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

create policy "member can read line items"
  on receipt_line_items for select using (
    exists (
      select 1 from receipts r
      where r.id = receipt_line_items.receipt_id and is_org_member(r.org_id)
    )
  );
create policy "member can write line items"
  on receipt_line_items for all
  using (
    exists (
      select 1 from receipts r
      where r.id = receipt_line_items.receipt_id and is_org_member(r.org_id)
    )
  )
  with check (
    exists (
      select 1 from receipts r
      where r.id = receipt_line_items.receipt_id and is_org_member(r.org_id)
    )
  );
