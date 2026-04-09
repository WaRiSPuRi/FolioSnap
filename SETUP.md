# Portfol.io — Setup Guide

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign up (free)
2. Click "New project", give it a name like "portfollio", set a password, click Create
3. Wait ~1 minute for it to set up

---

## Step 2 — Run this SQL in Supabase

Go to your project → SQL Editor → New query → paste this and click Run:

```sql
-- Portfolios table
create table portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  slug text unique,
  content jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Allow logged in users to read/write only their own portfolio
alter table portfolios enable row level security;

create policy "Users can view their own portfolio"
  on portfolios for select using (auth.uid() = user_id);

create policy "Users can insert their own portfolio"
  on portfolios for insert with check (auth.uid() = user_id);

create policy "Users can update their own portfolio"
  on portfolios for update using (auth.uid() = user_id);

-- Allow anyone to view published portfolios by slug (for public pages)
create policy "Public can view portfolios by slug"
  on portfolios for select using (slug is not null);
```

---

## Step 3 — Create storage bucket for resumes

In Supabase: go to Storage → New bucket → name it `resumes` → check "Public bucket" → Create

Then go to Storage → Policies → resumes bucket → Add policy:
- For INSERT: `auth.uid()::text = (storage.foldername(name))[1]`
- For SELECT: `true` (public read)

Or paste this SQL:

```sql
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', true);

create policy "Users can upload their own resume"
  on storage.objects for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can read resumes"
  on storage.objects for select using (bucket_id = 'resumes');

create policy "Users can update their own resume"
  on storage.objects for update using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Step 4 — Enable email auth

In Supabase: go to Authentication → Providers → Email → make sure it's enabled.

For testing, go to Authentication → Settings → turn OFF "Confirm email" so users don't need to verify (turn it back on for production).

---

## Step 5 — Get your credentials

In Supabase: go to Settings → API → copy:
- `Project URL`
- `anon public` key

---

## Step 6 — Add credentials to the app

Open these 3 files and replace the placeholder values at the top of each `<script>` tag:

```
index.html      → line ~85
dashboard.html  → line ~145
portfolio.html  → line ~145
```

Replace:
```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

With your actual values:
```js
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Step 7 — Deploy to Vercel

1. Create a new GitHub repo (e.g. `portfollio-app`)
2. Upload ALL files from this folder into the repo root
3. Go to vercel.com → New Project → import that repo → Deploy
4. That's it — your app is live!

---

## File structure

```
portfollio-app/
├── index.html        ← Landing page + login/signup
├── dashboard.html    ← Editor dashboard (logged-in users)
├── portfolio.html    ← Public portfolio page (rendered from DB)
├── vercel.json       ← URL routing
└── SETUP.md          ← This file (you can delete it)
```

---

## How it works

1. User signs up at `yourapp.vercel.app`
2. Fills in their info at `yourapp.vercel.app/dashboard`
3. Clicks Publish → their portfolio goes live at `yourapp.vercel.app/portfolio/their-name`
4. They share that link anywhere

---

## User portfolio URL format

When a user publishes, their URL is generated from their name:
- "Waris Puri" → `/portfolio/waris-puri`
- "John Smith" → `/portfolio/john-smith`
