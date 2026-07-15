# SCM Task Tracker

Internal task tracker for the **Strategic Communications** department at the American University of Sharjah. Managers assign creative work; staff receive and update their own tasks. Replaces the shared spreadsheet.

Built with **Next.js (App Router) + TypeScript + Prisma + PostgreSQL + NextAuth + Tailwind**. Passwords are hashed with bcrypt; sessions are httpOnly JWT cookies. All authorization is enforced server-side — staff can never read another person's tasks, and managers can never be removed.

---

## What's inside

| Role | Can do |
| --- | --- |
| **Manager** (Larissa, Adeel, Samar) | See every task, create/edit/delete tasks, filter by person and status, add/remove people, see workloads |
| **Staff** (Sam, Abdalla) | See only their own tasks; update status, completion date, file link, and comments |

Hard rules enforced in the API layer, not just the UI:
- Staff queries are scoped to `assignedToId = you`. Asking for someone else's task returns 404.
- Managers cannot be removed by anyone (including themselves). Only staff can be removed, as a **soft delete** — their tasks stay on the board for reassignment.
- Staff PATCH requests can only touch `status`, `dateCompleted`, and `fileLink`.

---

## Run it locally

You need **Node 18+** and a Postgres connection string (a free Neon database is
perfect — see the deploy steps below). Paste that string into `.env` as
`DATABASE_URL`, then, from inside the `scm-task-tracker` folder:

```bash
npm install          # install dependencies
npm run db:push      # creates the tables in your Postgres database
npm run db:seed      # adds the 5 users + sample tasks
npm run dev          # starts http://localhost:3000
```

> Prefer zero-setup local runs? Change the `datasource` provider in
> `prisma/schema.prisma` to `"sqlite"` and set `DATABASE_URL="file:./dev.db"`.

Then open <http://localhost:3000> and sign in with any seeded email — e.g.
`ldsilva@aus.edu` (manager) or `b00101717@aus.edu` (staff, Sam) — and the shared
starter password **`changeme123`**.

> If port 3000 is taken, Next will use the next free port and print the URL.

### Environment variables (`.env`)

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Supabase **Transaction pooler** string (port 6543) — used by the app at runtime |
| `DIRECT_URL` | Supabase **Session/direct** string (port 5432) — used by `prisma db push`/migrations |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; your Vercel URL in production |
| `NEXTAUTH_SECRET` | A long random string — generate with `openssl rand -base64 32` |
| `SEED_PASSWORD` | The shared starter password given to seeded users |

---

## Deploy to Vercel (step by step)

**1. Create the database (Supabase — free).**
   - Go to <https://supabase.com>, create a project (remember the database password you set).
   - Click **Connect** (top bar) → **ORMs** tab → **Prisma**. It shows a `DATABASE_URL` (transaction pooler, port 6543) and a `DIRECT_URL` (session, port 5432). Copy both, replacing `[YOUR-PASSWORD]` with your database password.

**2. Push this code to GitHub.**
   ```bash
   cd scm-task-tracker
   git init && git add . && git commit -m "SCM task tracker"
   git branch -M main
   git remote add origin https://github.com/<you>/scm-task-tracker.git
   git push -u origin main
   ```

**3. Import the repo into Vercel.**
   - Go to <https://vercel.com>, "Add New… → Project", pick the GitHub repo.
   - Framework preset auto-detects **Next.js**. Leave build settings as-is.

**4. Add environment variables in Vercel** (Project → Settings → Environment Variables):
   - `DATABASE_URL` → your Supabase transaction-pooler string
   - `DIRECT_URL` → your Supabase session/direct string
   - `NEXTAUTH_SECRET` → run `openssl rand -base64 32` and paste the result
   - `NEXTAUTH_URL` → your production URL, e.g. `https://scm-task-tracker.vercel.app`
   - `SEED_PASSWORD` → the starter password (optional; defaults to `changeme123`)

**5. Deploy.** Vercel builds and gives you a URL.

**6. Set up the database schema and seed data (one time).** From your own machine, with `.env` pointing at the **same** Supabase database:
   ```bash
   npm run db:push     # create tables in the production DB
   npm run db:seed     # load the 5 users + sample tasks
   ```

**7. Open your Vercel URL and sign in.** Done.

> After the first login, hand each person their email + the starter password and ask them to treat it as temporary. (A self-service password change screen is a natural next addition — see below.)

---

## Project structure

```
prisma/
  schema.prisma        # User, Task, Comment models
  seed.ts              # 5 real users + sample tasks
src/
  app/
    signin/            # email + password sign-in
    (app)/             # authenticated shell (sidebar + pages)
      tasks/           # task list + detail modal
      team/            # team management (managers only)
    api/
      auth/            # NextAuth
      tasks/           # list, create, read, update, delete, comments
      users/           # list, add, soft-delete
  lib/
    auth.ts            # NextAuth config (credentials + JWT)
    authz.ts           # requireUser / requireManager / row guards
    validation.ts      # Zod schemas (incl. per-role patch schemas)
    dates.ts           # week grouping (Week 1 = Mon 1 Jun 2026), turnaround
    constants.ts       # statuses, pillars, status colours
  components/          # Shell, TaskBoard, TaskModal, TeamBoard, ui
```

---

## Design notes

- **Colours:** white surfaces, a burgundy (`#8B1E2D`) sidebar, burgundy used only to signal attention (active nav, blocked count, the most-loaded person's bar).
- **Type:** Source Serif 4 for the wordmark/titles, Inter for the UI, IBM Plex Mono for every date, count, and turnaround figure.
- **Dates are always native pickers** — the team never has to type a date.
- **Turnaround** = `dateCompleted − dateAssigned`, computed on the fly, shown as "—" until both dates exist.

---

## Later (architected for, not built)

These were intentionally left out but the data model supports them:
- **Email notification** when someone is assigned a task (add an email provider + a hook in `POST /api/tasks`).
- **Per-pillar reporting** — every task already stores `strategicPillar`; add a report page that groups by it.
- **CSV export** for weekly reporting — read the same task query and stream a CSV.
- **Self-service password change.**
