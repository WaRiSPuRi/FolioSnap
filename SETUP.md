# FolioSnap v4 — Supabase SQL Setup

## Run ALL of these in Supabase → SQL Editor → New Query

---

## 1. Main portfolios table (run this if you haven't already)

```sql
create table if not exists portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  slug text unique,
  content jsonb default '{}'::jsonb,
  is_featured boolean default false,
  updated_at timestamptz default now()
);

alter table portfolios enable row level security;

create policy "select_own_or_public" on portfolios
  for select using (auth.uid() = user_id OR slug is not null);
create policy "insert_own" on portfolios
  for insert with check (auth.uid() = user_id);
create policy "update_own" on portfolios
  for update using (auth.uid() = user_id);
```

---

## 2. Analytics table (NEW — needed for view counter + section tracking)

```sql
create table if not exists portfolio_analytics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  total_views integer default 0,
  views_today integer default 0,
  views_week integer default 0,
  resume_downloads integer default 0,
  section_time jsonb default '{}'::jsonb,
  recent_views jsonb default '[]'::jsonb,
  last_view_date text,
  updated_at timestamptz default now()
);

alter table portfolio_analytics enable row level security;

create policy "analytics_owner_read" on portfolio_analytics
  for select using (auth.uid() = user_id);
create policy "analytics_public_read" on portfolio_analytics
  for select using (true);
create policy "analytics_insert" on portfolio_analytics
  for insert with check (true);
create policy "analytics_update" on portfolio_analytics
  for update using (true);
```

---

## 3. Referrals table (NEW — needed for referral system)

```sql
create table if not exists referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_id uuid references auth.users(id) on delete cascade not null,
  referred_email text,
  referred_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table referrals enable row level security;

create policy "referrals_read_own" on referrals
  for select using (auth.uid() = referrer_id);
create policy "referrals_insert" on referrals
  for insert with check (true);
```

---

## 4. Storage bucket for resumes (run if you haven't already)

```sql
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict do nothing;

create policy "upload_own_resume" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "read_all_resumes" on storage.objects
  for select using (bucket_id = 'resumes');

create policy "update_own_resume" on storage.objects
  for update using (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Done! All 4 SQL blocks above are everything you need.
