-- Runs SLA warnings and escalations every 5 minutes.
-- Requires the pg_cron extension (Supabase: Database > Extensions > pg_cron).
create extension if not exists pg_cron;
select cron.schedule('campusflow-sla-checks', '*/5 * * * *', $$select public.run_sla_checks()$$);
