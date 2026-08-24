-- TaskFlow / PD Task — Supabase schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Column names are kept camelCase (quoted) to match the app's data model 1:1.

create extension if not exists pgcrypto;

-- ── Core: Projects & Tasks ─────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "desc" text default '',
  color text default '#1c3a63',
  status text default 'active',
  "start" date,
  "end" date,
  emoji text default '📁',
  "openProjectId" int,
  "createdAt" timestamptz default now()
);
-- Migration for existing databases (adds the OpenProject project link):
-- alter table projects add column if not exists "openProjectId" int;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "desc" text default '',
  project uuid references projects(id) on delete set null,
  priority text default 'medium',
  "type" text default 'weekly',
  due date,
  done boolean default false,
  "createdAt" timestamptz default now()
);

-- ── Products ────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text default '',
  "desc" text default '',
  phase text default '',
  scope text default 'internal',
  status text default 'planning',
  emoji text default '📦',
  "createdAt" timestamptz default now()
);

-- ── Per-project workspace: Dev Tasks / WBS / Requirement / Sprint / Member / Defect
create table if not exists "devTasks" (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  ticket text default '',
  sprint text default '',
  module text default '',
  func text default '',
  name text not null,
  "desc" text default '',
  assignee text default '',
  "type" text default 'task',
  priority text default 'medium',
  status text default 'todo',
  "start" date,
  "end" date,
  remark text default '',
  "opTicketId" int unique,
  "opParentId" int,
  "opUrl" text default '',
  -- ── OpenProject-mirrored ticket detail fields (Section 2 of the Dev Task
  -- form — "Open Project"), matching an OpenProject Feature ticket's own
  -- field layout 1:1. Kept separate from the "task-native" fields above
  -- (type/status/sprint/module/func/etc.) which drive TaskFlow's own
  -- board/table and are unrelated to OpenProject's schema. ──
  "opFeature" text default '',
  "opPriority" text default 'Normal',
  "opInformer" text default '',
  "opCustomer" text default '',
  "opPlatform" text default '',
  "opEditedVersion" text default '',
  "opApproval" text default 'New',
  "opStartDate" date,
  "opFinishDate" date,
  "opEstimatedDate" date,
  "opAssignee" text default '',
  "opAssignees" text default '',
  "opProgress" int default 0,
  "opLevel" text default '',
  "opFinishedVersion" text default '',
  "opCloseDate" date,
  "opCaseLevel" text default '',
  "opReOpen" text default '',
  "opReTest" text default '',
  "createdAt" timestamptz default now()
);
-- Migration for existing databases (adds OpenProject work package linking):
-- alter table "devTasks" add column if not exists "opTicketId" int unique;
-- alter table "devTasks" add column if not exists "opParentId" int;
-- alter table "devTasks" add column if not exists "opUrl" text default '';
-- Migration for existing databases (adds the "Open Project" detail section):
-- alter table "devTasks" add column if not exists "opFeature" text default '';
-- alter table "devTasks" add column if not exists "opPriority" text default 'Normal';
-- alter table "devTasks" add column if not exists "opInformer" text default '';
-- alter table "devTasks" add column if not exists "opCustomer" text default '';
-- alter table "devTasks" add column if not exists "opPlatform" text default '';
-- alter table "devTasks" add column if not exists "opEditedVersion" text default '';
-- alter table "devTasks" add column if not exists "opApproval" text default 'New';
-- alter table "devTasks" add column if not exists "opStartDate" date;
-- alter table "devTasks" add column if not exists "opFinishDate" date;
-- alter table "devTasks" add column if not exists "opEstimatedDate" date;
-- alter table "devTasks" add column if not exists "opAssignee" text default '';
-- alter table "devTasks" add column if not exists "opAssignees" text default '';
-- alter table "devTasks" add column if not exists "opProgress" int default 0;
-- alter table "devTasks" add column if not exists "opLevel" text default '';
-- alter table "devTasks" add column if not exists "opFinishedVersion" text default '';
-- alter table "devTasks" add column if not exists "opCloseDate" date;
-- alter table "devTasks" add column if not exists "opCaseLevel" text default '';
-- alter table "devTasks" add column if not exists "opReOpen" text default '';
-- alter table "devTasks" add column if not exists "opReTest" text default '';

create table if not exists wbs (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  level text default 'main', -- header | main | sub
  name text not null,
  pic text default '',
  "planStart" date,
  "planEnd" date,
  "actualStart" date,
  "actualEnd" date,
  progress int default 0,
  remark text default '',
  "sortOrder" int default 0,
  "createdAt" timestamptz default now()
);

create table if not exists requirements (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  module text default '',
  feature text default '',
  "function" text default '',
  detail text default '',
  "businessRule" text default '',
  "type" text default '',
  priority text default '',
  status text default '',
  remark text default '',
  "createdAt" timestamptz default now()
);

create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  name text default '',
  "startDate" date,
  "endDate" date,
  goal text default '',
  remark text default '',
  "createdAt" timestamptz default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  name text default '',
  role text default '',
  department text default '',
  remark text default '',
  "createdAt" timestamptz default now()
);

create table if not exists defects (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  module text default '',
  "function" text default '',
  "defectDetail" text default '',
  assignee text default '',
  env text default '',
  priority text default '',
  status text default '',
  "defectType" text default '',
  "createdDate" date,
  "testResult" text default '',
  remark text default '',
  "createdAt" timestamptz default now()
);

-- ── Change Log (Project tab) ─────────────────────────────────────
-- "changeId" (CR001, CR002, ...) is auto-generated client-side per
-- project when a new entry is created — not enforced unique at the DB
-- level, since numbering restarts per project.
create table if not exists "changeLog" (
  id uuid primary key default gen_random_uuid(),
  project uuid references projects(id) on delete cascade,
  "changeId" text default '',
  "changeDetail" text default '',
  "changeType" text default '',
  "impactAnalysis" text default '',
  "reqRef" text default '',
  status text default 'Open',
  "changeBy" text default '',
  "changeDate" date,
  "approvedBy" text default '',
  "dateApproved" date,
  "targetRelease" text default '',
  "productVersion" text default '',
  remarks text default '',
  "createdAt" timestamptz default now()
);

-- ── PD Task module (global, not tied to a single project) ─────────
create table if not exists "pdTasks" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assignee text default '',
  priority text default 'Medium',
  status text default 'To do',
  "order" int default 0,
  "createdAt" timestamptz default now()
);
-- Migration for existing databases created before drag-and-drop ordering:
-- alter table "pdTasks" add column if not exists "order" int default 0;

create table if not exists "pdIssues" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  module text default '',
  severity text default 'Medium',
  status text default 'Open',
  reporter text default '',
  remark text default '',
  "createdAt" timestamptz default now()
);

create table if not exists "pdBacklog" (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "type" text default 'Feature',
  priority text default 'Medium',
  status text default 'Backlog',
  remark text default '',
  "createdAt" timestamptz default now()
);

create table if not exists "pdFeedback" (
  id uuid primary key default gen_random_uuid(),
  source text default '',
  feedback text default '',
  sentiment text default 'Neutral',
  status text default 'New',
  "createdAt" timestamptz default now()
);

-- ── Timesheet (PD Task > Timesheet) ────────────────────────────────
create table if not exists "timesheets" (
  id uuid primary key default gen_random_uuid(),
  date date,
  "timeIn" time,
  "timeOut" time,
  "projectId" uuid references projects(id) on delete set null,
  "workDetail" text default '',
  "entryType" text default 'work', -- 'work' | 'leave'
  "leaveType" text default '', -- 'Annual Leave' | 'Sick Leave' | 'Personal Leave'
  reason text default '',
  "userId" uuid references auth.users(id) on delete set null,
  "userEmail" text default '',
  "createdAt" timestamptz default now()
);
-- Migration for existing databases (adds leave-request + owner tracking):
-- alter table "timesheets" add column if not exists "entryType" text default 'work';
-- alter table "timesheets" add column if not exists "leaveType" text default '';
-- alter table "timesheets" add column if not exists reason text default '';
-- alter table "timesheets" add column if not exists "userId" uuid references auth.users(id) on delete set null;
-- alter table "timesheets" add column if not exists "userEmail" text default '';

-- ── Row Level Security ──────────────────────────────────────────
-- Enabled with permissive policies so the app works immediately with the
-- anon key. Tighten these (e.g. scope to auth.uid()) before going to
-- production with real user accounts.
do $$
declare t text;
begin
  for t in select unnest(array['projects','tasks','products','devTasks','wbs',
    'requirements','sprints','members','defects','changeLog','pdTasks','pdIssues','pdBacklog','pdFeedback','timesheets'])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "allow all" on %I;', t);
    execute format('create policy "allow all" on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- ── Auth: user profiles (role + project assignment) ────────────────
-- Requires Supabase Auth → Providers → Email to be enabled (default).
-- For a zero-friction internal tool, also turn OFF "Confirm email" under
-- Authentication → Settings, so accounts an admin creates can log in
-- immediately with the temporary password shown at creation time.
create table if not exists "profiles" (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'SD',
  "projectIds" uuid[] default '{}',
  "createdAt" timestamptz default now()
);

alter table "profiles" enable row level security;
drop policy if exists "allow all" on "profiles";
drop policy if exists "profiles select" on "profiles";
drop policy if exists "profiles insert" on "profiles";
drop policy if exists "profiles update" on "profiles";
drop policy if exists "profiles delete" on "profiles";

-- profiles is more sensitive than the rest of the app's tables (it controls
-- who can log in and what role they have), so it gets tighter policies
-- instead of the "allow all" pattern above:
--   • everyone can read their own row; the 4 full-system roles can read all
--   • only the 4 full-system roles can create/edit accounts
--   • only Super Admin can delete (revoke) an account
--
-- The role check goes through a SECURITY DEFINER helper function rather
-- than a subquery directly on "profiles". A subquery on the same table
-- would re-trigger this table's own SELECT policy while evaluating itself,
-- which Postgres rejects as "infinite recursion detected in policy"
-- (error 42P17). The function runs with elevated privileges and bypasses
-- RLS internally, so it can safely check the caller's role without looping.
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles select" on "profiles" for select using (
  auth.uid() = id
  or public.current_user_role() in ('Super Admin','CTO','PD Manager','PD Team')
);
create policy "profiles insert" on "profiles" for insert with check (
  public.current_user_role() in ('Super Admin','CTO','PD Manager','PD Team')
);
create policy "profiles update" on "profiles" for update using (
  public.current_user_role() in ('Super Admin','CTO','PD Manager','PD Team')
);
create policy "profiles delete" on "profiles" for delete using (
  public.current_user_role() = 'Super Admin'
);

-- ── First-time setup (bootstrap the first Super Admin) ──────────────
-- The policies above require an existing admin-role profile row before
-- anyone can create accounts through the app — so the very first account
-- must be created manually, once:
--   1. Supabase Dashboard → Authentication → Users → Add user
--      (set an email + password there directly)
--   2. Copy that user's UUID from the Users table
--   3. Run in the SQL editor (bypasses RLS, so this works with zero
--      existing admins):
--        insert into "profiles" (id, email, role)
--        values ('<paste-uuid-here>', 'you@company.com', 'Super Admin');
--   4. Log into the app with that email/password, then create every other
--      account from Admin → Account going forward.

-- ── OpenProject sync (Dev Task ↔ OpenProject work packages) ─────────
-- No new tables needed — just the "openProjectId" column on projects and
-- the "opTicketId"/"opUrl" columns on devTasks added above. See the app's
-- README / setup notes for the required environment variables:
--   OPENPROJECT_BASE_URL, OPENPROJECT_API_KEY, OPENPROJECT_WEBHOOK_SECRET,
--   SUPABASE_SERVICE_ROLE_KEY (all server-only — never NEXT_PUBLIC_*).

-- ── Activity log (Admin → Log, Super Admin only) ────────────────────
-- Records every login/logout, page view, create, update and delete across
-- the app: who, when, and what. Deliberately NOT added to the app's
-- generic multi-table bulk load (StoreContext) — it's fetched only when
-- the Log page itself is opened, since it can grow much larger than the
-- rest of the app's data over time.
create table if not exists "activityLogs" (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid references auth.users(id) on delete set null,
  "userEmail" text default '',
  action text not null, -- login | logout | view | create | update | delete
  "entityType" text default '', -- e.g. 'projects', 'devTasks', 'page', 'auth'
  "entityId" text default '',
  detail text default '',
  "createdAt" timestamptz default now()
);

alter table "activityLogs" enable row level security;
drop policy if exists "activityLogs insert own" on "activityLogs";
drop policy if exists "activityLogs select super admin" on "activityLogs";

-- Anyone signed in can write a log row, but ONLY as themselves (prevents
-- spoofing another user's activity). Reuses the current_user_role() helper
-- defined above for profiles — no new recursion risk since that function
-- already bypasses RLS internally.
create policy "activityLogs insert own" on "activityLogs" for insert with check (
  auth.uid() = "userId"
);
-- Only Super Admin can read the log.
create policy "activityLogs select super admin" on "activityLogs" for select using (
  public.current_user_role() = 'Super Admin'
);
-- No update/delete policy is defined for any role — the log is immutable
-- through the app's anon/authenticated API keys. Clearing old entries (if
-- ever needed) has to be done directly in the SQL editor.

