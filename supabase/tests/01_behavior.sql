\set ON_ERROR_STOP on
create function t_fail(q text) returns void language plpgsql as $$
begin
  execute q;
  raise exception 'EXPECTED FAILURE DID NOT HAPPEN: %', q;
exception when others then
  if sqlerrm like 'EXPECTED FAILURE DID NOT HAPPEN%' then raise; end if;
end $$;
create function t_eq(label text, got text, want text) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got [%] want [%]', label, got, want; end if;
  raise notice 'ok - %', label;
end $$;

-- users (as postgres)
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1','stu1@c.edu','{"full_name":"Stu One","student_id":"S1","department":"CSE","semester":"5","role":"admin"}'),
 ('00000000-0000-0000-0000-0000000000a2','stu2@c.edu','{"full_name":"Stu Two","student_id":"S2","department":"ISE","semester":"3"}'),
 ('00000000-0000-0000-0000-0000000000b1','staff@c.edu','{"full_name":"Staff One"}'),
 ('00000000-0000-0000-0000-0000000000c1','admin@c.edu','{"full_name":"Admin One"}');
select t_eq('client metadata cannot grant admin', (select role::text from profiles where student_id='S1'), 'student');
update profiles set role='staff', staff_department_id=(select id from departments where name='IT / AV Support') where email='staff@c.edu';
update profiles set role='admin' where email='admin@c.edu';
select t_fail($$insert into auth.users (id,email,raw_user_meta_data) values (gen_random_uuid(),'dup@c.edu','{"student_id":"S1"}')$$);
select t_eq('duplicate student id rejected', '1', '1');

-- student 1 creates a request
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
insert into requests (student_id, service_id, title, description, location, priority)
 select '00000000-0000-0000-0000-0000000000a1', id, 'Projector not working', 'The projector in Room 204 is not working and I have a presentation tomorrow.', 'Room 204', 'high' from services where name='IT Support';
select t_eq('request id format', (select public_id from requests), 'CF-10001');
select t_eq('status starts pending', (select status::text from requests), 'pending');
select t_eq('high SLA is 12h', (select (extract(epoch from due_at-created_at)/3600)::int from requests)::text, '12');
select t_eq('dept inherited from service', (select d.name from requests r join departments d on d.id=r.department_id), 'IT / AV Support');
select t_fail($$insert into requests (student_id, service_id, title, description) select '00000000-0000-0000-0000-0000000000a2', id, 'Spoofed', 'Trying to file for another student', from services limit 1$$);
select t_eq('student notified of submission', (select count(*)::text from notifications), '1');
update requests set title='hacked title';
select t_eq('student update changes nothing', (select title from requests), 'Projector not working');
select t_fail($$update profiles set role='admin' where id='00000000-0000-0000-0000-0000000000a1'$$);
-- UPDATE with no policy match silently affects 0 rows for other users; verify isolation:
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2',false);
select t_eq('student 2 cannot see student 1 request', (select count(*)::text from requests), '0');
select t_eq('student 2 cannot see others notifications', (select count(*)::text from notifications), '0');

-- admin sees it, assigns staff
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000c1',false);
select t_eq('admin sees request', (select count(*)::text from requests), '1');
select t_fail($$update requests set status='completed'$$);
update requests set assigned_to='00000000-0000-0000-0000-0000000000b1';
select t_eq('assigning moves to assigned', (select status::text from requests), 'assigned');
select t_eq('assigned_at set', (select (assigned_at is not null)::text from requests), 'true');

-- staff acts
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1',false);
select t_eq('staff sees assigned request', (select count(*)::text from requests), '1');
select t_eq('staff got assignment notification', (select count(*)::text from notifications where kind='request_assigned'), '1');
select t_fail($$update requests set priority='low'$$);
select t_fail($$update requests set status='completed'$$);
select t_fail($$update requests set assigned_to=null$$);
update requests set status='in_progress', estimated_completion = now() + interval '3 hours';
select t_eq('started_at set', (select (started_at is not null)::text from requests), 'true');
update requests set status='completed';
select t_eq('completed_at set', (select (completed_at is not null)::text from requests), 'true');
select t_fail($$update requests set status='in_progress'$$);
insert into request_activity (request_id, actor_id, kind, message, is_internal)
  select id, '00000000-0000-0000-0000-0000000000b1','note','replaced lamp',true from requests;

-- student 1 sees completion + history, not internal notes
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
select t_eq('student notified of completion', (select count(*)::text from notifications where kind='request_completed'), '1');
select t_eq('student sees public history only', (select count(*)::text from request_activity), '6');
select t_fail($$insert into request_activity (request_id, actor_id, kind, message) select id, '00000000-0000-0000-0000-0000000000a1','note','x' from requests$$);
insert into request_activity (request_id, actor_id, kind, message) select id, '00000000-0000-0000-0000-0000000000a1','comment','Thanks!' from requests;
update notifications set is_read=true;
select t_fail($$update notifications set title='x'$$);
select t_fail($$select run_sla_checks()$$);

-- SLA escalation (system job)
reset role; select set_config('request.jwt.claim.sub','',false);
insert into requests (student_id, service_id, title, description, priority)
 select '00000000-0000-0000-0000-0000000000a2', id, 'Water leakage Block B', 'Water is leaking from the ceiling in Block B corridor.', 'critical' from services where name='Maintenance';
update requests set due_at = now() - interval '1 hour' where title like 'Water%';
select run_sla_checks();
select t_eq('overdue request escalated', (select escalated::text from requests where title like 'Water%'), 'true');
select t_eq('admin notified of escalation', (select count(*)::text from notifications where kind='request_escalated' and user_id='00000000-0000-0000-0000-0000000000c1'), '1');
select t_eq('completed requests are never escalated', (select escalated::text from requests where title like 'Projector%'), 'false');
alter table requests disable trigger requests_before_update;
update requests set created_at = now() - interval '3 hours 45 minutes', due_at = now() + interval '15 minutes', escalated=false where title like 'Water%';
alter table requests enable trigger requests_before_update;
select run_sla_checks();
select t_eq('warning raised inside last 25%', (select sla_warned::text from requests where title like 'Water%'), 'true');
select t_eq('sequence increments', (select number::text from requests where title like 'Water%'), '10002');
