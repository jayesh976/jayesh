-- Admin allow-list: only these emails can read and manage enquiries.
create table public.admin_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_emails a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create policy "admins can read admin list" on public.admin_emails
  for select to authenticated using ((select private.is_admin()));

-- Enquiries are inserted only by the submit-enquiry edge function (service role).
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  company text check (char_length(company) <= 160),
  phone text not null check (char_length(phone) between 6 and 30),
  email text check (char_length(email) <= 200),
  category text not null check (char_length(category) <= 120),
  quantity text check (char_length(quantity) <= 200),
  location text check (char_length(location) <= 200),
  details text not null check (char_length(details) between 1 and 5000),
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  admin_notes text check (char_length(admin_notes) <= 5000),
  ip_hash text,
  email_notified boolean not null default false
);
create index enquiries_created_at_idx on public.enquiries (created_at desc);
create index enquiries_ip_hash_created_idx on public.enquiries (ip_hash, created_at desc);
alter table public.enquiries enable row level security;

create policy "admins read enquiries" on public.enquiries
  for select to authenticated using ((select private.is_admin()));
create policy "admins update enquiries" on public.enquiries
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete enquiries" on public.enquiries
  for delete to authenticated using ((select private.is_admin()));

revoke all on public.enquiries from anon;
revoke insert, truncate, references, trigger on public.enquiries from authenticated;
revoke all on public.admin_emails from anon;
revoke insert, update, delete, truncate, references, trigger on public.admin_emails from authenticated;

insert into public.admin_emails (email) values
  ('shreemahaganapati72@gmail.com'),
  ('nigadegitanjali@gmail.com');
