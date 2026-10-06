-- CampusFlow AI: schema, security policies and workflow rules.
-- Run once in the Supabase SQL editor (or via `supabase db push`).

-- ───────── Types ─────────
create type public.user_role as enum ('student', 'staff', 'admin');
create type public.priority_level as enum ('critical', 'high', 'medium', 'low');
create type public.request_status as enum ('pending', 'assigned', 'in_progress', 'completed');
create type public.activity_kind as enum (
  'submitted', 'assigned', 'status_changed', 'priority_changed',
  'eta_updated', 'escalated', 'comment', 'note'
);
create type public.notification_kind as enum (
  'request_submitted', 'request_assigned', 'status_changed', 'request_completed',
  'sla_warning', 'request_escalated', 'ai_recommendation', 'announcement'
);

-- ───────── Tables ─────────
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  department_id uuid references public.departments (id) on delete restrict,
  expected_resolution_hours integer not null check (expected_resolution_hours > 0),
  requirements text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'student',
  student_id text unique,
  academic_department text check (academic_department in ('CSE', 'ISE', 'AIML', 'AIDS', 'CSD')),
  semester smallint check (semester between 1 and 8),
  staff_department_id uuid references public.departments (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.request_number_seq start 10001;

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.request_number_seq'),
  public_id text generated always as ('CF-' || number::text) stored,
  student_id uuid not null references public.profiles (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  location text,
  priority public.priority_level not null default 'medium',
  status public.request_status not null default 'pending',
  department_id uuid references public.departments (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  escalated boolean not null default false,
  escalated_at timestamptz,
  sla_warned boolean not null default false,
  due_at timestamptz not null,
  estimated_completion timestamptz,
  ai_category text,
  ai_priority_score smallint check (ai_priority_score between 0 and 100),
  ai_reason text,
  ai_recommended_action text,
  attachment_path text,
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index requests_student_idx on public.requests (student_id, created_at desc);
create index requests_assignee_idx on public.requests (assigned_to, status);
create index requests_status_due_idx on public.requests (status, due_at);

create table public.request_activity (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind public.activity_kind not null,
  from_status public.request_status,
  to_status public.request_status,
  message text,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index request_activity_request_idx on public.request_activity (request_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null default '',
  request_id uuid references public.requests (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

-- ───────── Helpers ─────────
create function public.app_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.sla_window(p public.priority_level) returns interval
language sql immutable as $$
  select case p
    when 'critical' then interval '4 hours'
    when 'high' then interval '12 hours'
    when 'medium' then interval '24 hours'
    else interval '72 hours'
  end
$$;

create function public.notify(
  p_user uuid, p_kind public.notification_kind, p_title text, p_body text, p_request uuid
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, request_id)
  select p_user, p_kind, p_title, p_body, p_request where p_user is not null
$$;
revoke execute on function public.notify(uuid, public.notification_kind, text, text, uuid) from public, anon, authenticated;

-- ───────── Profiles ─────────
-- Every new auth user becomes a student. Role is never read from client metadata.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, role, student_id, academic_department, semester)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(meta ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    'student',
    nullif(trim(meta ->> 'student_id'), ''),
    nullif(meta ->> 'department', ''),
    nullif(meta ->> 'semester', '')::smallint
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.profiles_guard() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  -- auth.uid() is null for the SQL editor and scheduled jobs, which may manage roles.
  if auth.uid() is not null and public.app_role() is distinct from 'admin' then
    if new.role is distinct from old.role
       or new.email is distinct from old.email
       or new.student_id is distinct from old.student_id
       or new.staff_department_id is distinct from old.staff_department_id then
      raise exception 'Only administrators can change role, email, student ID or department assignment.';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
for each row execute function public.profiles_guard();

-- ───────── Request workflow ─────────
create function public.requests_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := 'pending';
  new.assigned_to := null;
  new.escalated := false;
  new.escalated_at := null;
  new.sla_warned := false;
  new.assigned_at := null;
  new.started_at := null;
  new.completed_at := null;
  new.created_at := now();
  new.updated_at := now();
  new.due_at := new.created_at + public.sla_window(new.priority);
  if new.department_id is null then
    select department_id into new.department_id from public.services where id = new.service_id;
  end if;
  return new;
end $$;

create trigger requests_before_insert before insert on public.requests
for each row execute function public.requests_before_insert();

create function public.requests_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r public.user_role := case when auth.uid() is null then 'admin' else public.app_role() end;  -- no session user = system job
  ok boolean;
begin
  if r is null then
    raise exception 'No profile exists for the current user.';
  end if;
  if new.id is distinct from old.id or new.number is distinct from old.number
     or new.student_id is distinct from old.student_id or new.service_id is distinct from old.service_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Request identity fields cannot be changed.';
  end if;

  if r = 'student' then
    raise exception 'Students cannot modify requests after submission.';
  end if;

  if r = 'staff' and (
       new.title, new.description, new.location, new.priority, new.department_id,
       new.assigned_to, new.escalated, new.due_at, new.sla_warned
     ) is distinct from (
       old.title, old.description, old.location, old.priority, old.department_id,
       old.assigned_to, old.escalated, old.due_at, old.sla_warned
     ) then
    raise exception 'Staff can only change status and estimated completion.';
  end if;

  -- Assigning someone to a pending request moves it to Assigned.
  if old.status = 'pending' and new.status = 'pending' and new.assigned_to is not null then
    new.status := 'assigned';
  end if;

  if new.status is distinct from old.status then
    ok := (old.status, new.status) in (
      ('pending', 'assigned'), ('assigned', 'in_progress'), ('assigned', 'pending'),
      ('in_progress', 'completed'), ('in_progress', 'assigned')
    );
    if r = 'staff' then
      ok := ok and (old.status, new.status) in (('assigned', 'in_progress'), ('in_progress', 'completed'));
    end if;
    if not ok then
      raise exception 'Invalid status change: % to % (role %).', old.status, new.status, r;
    end if;
  end if;

  if new.status = 'pending' then new.assigned_to := null; end if;
  if new.status in ('assigned', 'in_progress', 'completed') and new.assigned_to is null then
    raise exception 'A staff member must be assigned before the request can move forward.';
  end if;
  if new.assigned_to is not null and not exists (
       select 1 from public.profiles where id = new.assigned_to and role in ('staff', 'admin')) then
    raise exception 'Requests can only be assigned to staff or administrators.';
  end if;

  if new.status = 'assigned' and old.status is distinct from 'assigned' then new.assigned_at := now(); end if;
  if new.status = 'in_progress' and new.started_at is null then new.started_at := now(); end if;
  if new.status = 'completed' and old.status is distinct from 'completed' then new.completed_at := now(); end if;

  if new.priority is distinct from old.priority and new.status <> 'completed' then
    new.due_at := new.created_at + public.sla_window(new.priority);
    new.sla_warned := false;
  end if;
  if new.escalated and not old.escalated then new.escalated_at := now(); end if;

  new.updated_at := now();
  return new;
end $$;

create trigger requests_before_update before update on public.requests
for each row execute function public.requests_before_update();

-- History and notifications for every meaningful change.
create function public.requests_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := auth.uid();
  assignee_name text;
begin
  if tg_op = 'INSERT' then
    insert into public.request_activity (request_id, actor_id, kind, to_status, message)
    values (new.id, actor, 'submitted', 'pending', 'Request submitted');
    perform public.notify(new.student_id, 'request_submitted', 'Request submitted',
      new.public_id || ' was submitted: ' || new.title, new.id);
    perform public.notify(p.id, 'request_submitted', 'New request',
      new.public_id || ': ' || new.title, new.id) from public.profiles p where p.role = 'admin';
    return new;
  end if;

  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    select full_name into assignee_name from public.profiles where id = new.assigned_to;
    insert into public.request_activity (request_id, actor_id, kind, message)
    values (new.id, actor, 'assigned', 'Assigned to ' || coalesce(assignee_name, 'staff'));
    perform public.notify(new.student_id, 'request_assigned', 'Request assigned',
      new.public_id || ' was assigned to ' || coalesce(assignee_name, 'a staff member'), new.id);
    perform public.notify(new.assigned_to, 'request_assigned', 'New assignment',
      new.public_id || ': ' || new.title, new.id);
  end if;

  if new.status is distinct from old.status then
    insert into public.request_activity (request_id, actor_id, kind, from_status, to_status, message)
    values (new.id, actor, 'status_changed', old.status, new.status,
      'Status changed to ' || replace(new.status::text, '_', ' '));
    if new.status = 'completed' then
      perform public.notify(new.student_id, 'request_completed', 'Request completed',
        new.public_id || ' has been completed.', new.id);
    elsif new.status = 'in_progress' then
      perform public.notify(new.student_id, 'status_changed', 'Work has started',
        new.public_id || ' is now in progress.', new.id);
    end if;
  end if;

  if new.priority is distinct from old.priority then
    insert into public.request_activity (request_id, actor_id, kind, message)
    values (new.id, actor, 'priority_changed', 'Priority changed to ' || new.priority::text);
  end if;

  if new.estimated_completion is distinct from old.estimated_completion then
    insert into public.request_activity (request_id, actor_id, kind, message)
    values (new.id, actor, 'eta_updated', 'Estimated completion updated');
  end if;

  if new.escalated and not old.escalated then
    insert into public.request_activity (request_id, actor_id, kind, message)
    values (new.id, actor, 'escalated', 'Request escalated');
    perform public.notify(new.student_id, 'request_escalated', 'Request escalated',
      new.public_id || ' has been escalated for attention.', new.id);
    perform public.notify(new.assigned_to, 'request_escalated', 'Request escalated',
      new.public_id || ' is overdue and escalated.', new.id);
    perform public.notify(p.id, 'request_escalated', 'Request escalated',
      new.public_id || ': ' || new.title, new.id) from public.profiles p where p.role = 'admin';
  end if;

  if new.sla_warned and not old.sla_warned then
    perform public.notify(new.student_id, 'sla_warning', 'SLA warning',
      new.public_id || ' is close to its resolution deadline.', new.id);
    perform public.notify(new.assigned_to, 'sla_warning', 'SLA warning',
      new.public_id || ' is close to its deadline.', new.id);
  end if;
  return new;
end $$;

create trigger requests_after_change after insert or update on public.requests
for each row execute function public.requests_after_change();

-- Scheduled by pg_cron (see 0003_cron.sql). Never callable from the client.
create function public.run_sla_checks() returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.requests set sla_warned = true
  where status <> 'completed' and not sla_warned and due_at > now()
    and (due_at - now()) <= (due_at - created_at) * 0.25;

  update public.requests set escalated = true
  where status <> 'completed' and not escalated and due_at <= now();
end $$;
revoke execute on function public.run_sla_checks() from public, anon, authenticated;

-- ───────── Row Level Security ─────────
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.services enable row level security;
alter table public.requests enable row level security;
alter table public.request_activity enable row level security;
alter table public.notifications enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.app_role() = 'admin'
  or exists (select 1 from public.requests r where r.student_id = profiles.id and r.assigned_to = auth.uid())
  or exists (select 1 from public.requests r where r.assigned_to = profiles.id and r.student_id = auth.uid())
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.app_role() = 'admin')
  with check (id = auth.uid() or public.app_role() = 'admin');

create policy departments_read on public.departments for select to authenticated using (true);
create policy departments_admin on public.departments for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy services_read on public.services for select to authenticated
  using (is_active or public.app_role() = 'admin');
create policy services_admin on public.services for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy requests_select on public.requests for select to authenticated using (
  student_id = auth.uid() or assigned_to = auth.uid() or public.app_role() = 'admin'
);
create policy requests_insert on public.requests for insert to authenticated
  with check (student_id = auth.uid() and public.app_role() = 'student');
create policy requests_update on public.requests for update to authenticated
  using (public.app_role() = 'admin' or (public.app_role() = 'staff' and assigned_to = auth.uid()))
  with check (public.app_role() = 'admin' or (public.app_role() = 'staff' and assigned_to = auth.uid()));

create policy activity_select on public.request_activity for select to authenticated using (
  exists (select 1 from public.requests r where r.id = request_id)
  and (not is_internal or public.app_role() in ('staff', 'admin'))
);
create policy activity_insert on public.request_activity for insert to authenticated with check (
  actor_id = auth.uid()
  and exists (select 1 from public.requests r where r.id = request_id)
  and (kind = 'comment' or (kind = 'note' and public.app_role() in ('staff', 'admin')))
  and (not is_internal or public.app_role() in ('staff', 'admin'))
);

create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────── Privileges ─────────
grant usage on schema public to authenticated;
grant usage on sequence public.request_number_seq to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.departments, public.services to authenticated;
grant select, insert, update on public.requests to authenticated;
grant select, insert on public.request_activity to authenticated;
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- Live updates for notifications and request changes.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications, public.requests;
  end if;
end $$;
