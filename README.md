# CampusFlow AI

Campus service management: students submit requests, staff resolve them, admins monitor SLA and workload.

## Setup
1. `npm install`
2. `.env.local` already holds the Supabase URL and publishable key (see `.env.example`). Never put a `service_role` or secret key in this app.
3. In the Supabase dashboard, open SQL Editor and run, in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_initial_config.sql`
   - `supabase/migrations/0003_cron.sql` (enable the pg_cron extension first: Database > Extensions)
4. Authentication > URL Configuration: set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs. Add your deployed URL the same way later.
5. `npm run dev`, register at `/register`, confirm the email, then run `supabase/make_admin.sql` in the SQL editor to make that account an administrator. Sign out and in again.

## Scripts
`npm run dev` · `npm run typecheck` · `npm test`

## Security model
Role lives in `profiles.role` and is never read from the client. Row Level Security limits students to their own requests, staff to requests assigned to them, and admins to everything. A database trigger enforces the status workflow, so it holds even if the API is called directly.
