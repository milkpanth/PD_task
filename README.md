# TaskFlow — Next.js + Supabase

React/Next.js port of the original single-file TaskFlow app. Same look & feel,
same data model — now backed by Supabase instead of `localStorage`, so your
data persists in the cloud and the app is ready to deploy (Vercel, etc).

## What's included

- Dashboard, All Tasks, Project Overview, Roadmap, Products
- Project Workspace (per-project tabs): Dev Task, WBS, Requirement, Sprint, Member, Defect
- PD Task module: Dashboard, Task List, Kanban, Issue Log, Backlog, Product Feedback
- All CRUD operations go straight to Supabase (Postgres), with the same UI/UX and CSS as the original

## 1. Set up Supabase

1. Create a project at https://supabase.com (free tier is fine).
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it.
   This creates all tables (projects, tasks, products, devTasks, wbs, requirements,
   sprints, members, defects, pdTasks, pdIssues, pdBacklog, pdFeedback) plus permissive
   RLS policies so the app works immediately with the public anon key.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — if Supabase isn't configured yet you'll see a
friendly notice on every page instead of a crash.

## 4. Deploy

Push this folder to a GitHub repo and import it in **Vercel** (or any Next.js
host). Add the same two `NEXT_PUBLIC_SUPABASE_*` environment variables in the
project's settings, then deploy — no other config needed.

## Notes on the port

- **RLS is wide open** (`using (true)`) so the app works instantly with the anon
  key — same trust model as the original app's browser `localStorage`. Before
  giving this to real end users with logins, add Supabase Auth and scope the
  policies to `auth.uid()`.
- **WBS view is simplified**: the original had a day-by-day Gantt grid; this
  version uses a table with Plan/Actual dates + a progress bar per row (all the
  same data is captured — just a lighter visualization). Happy to build the
  full day-grid Gantt back in if you want it.
- **OpenProject sync** (the "⚙️ ตั้งค่า OpenProject" / "⟳ Sync OpenProject"
  buttons in the original) was not ported — it called an external API directly
  from the browser, which doesn't fit a hosted Supabase-backed app well (CORS +
  credentials). Dev Tasks still have a free-text "Ticket" field you can fill in
  by hand. If you want real OpenProject sync, that's best done as a Supabase
  Edge Function that calls the OpenProject API server-side.
- Every entity keeps its original field names (Thai labels included) so nothing
  was lost in translation.
