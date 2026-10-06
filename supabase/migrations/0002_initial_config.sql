-- Initial campus configuration (not sample data). Administrators can edit all of it in the app.
insert into public.departments (name, description) values
  ('IT / AV Support', 'Network, accounts, projectors and audio-visual equipment'),
  ('Computer Lab', 'Lab workstations, software and lab access'),
  ('Maintenance', 'Facilities, plumbing, electrical and civil work'),
  ('Examination Section', 'Examinations, results and academic certificates'),
  ('Administration', 'Student records, ID cards and general administration'),
  ('Library', 'Books, access and study spaces');

insert into public.services (name, description, department_id, expected_resolution_hours, requirements)
select s.name, s.description, d.id, s.hours, s.requirements
from (values
  ('IT Support', 'Technical issues, accounts, network and equipment faults', 'IT / AV Support', 12, null),
  ('Computer Lab', 'Workstation, software or lab access problems', 'Computer Lab', 12, null),
  ('Maintenance', 'Water, electrical, furniture and building repairs', 'Maintenance', 24, 'Include the exact location of the issue.'),
  ('Examination', 'Exam schedules, hall tickets, results and re-evaluation', 'Examination Section', 48, null),
  ('Administration', 'Student records, fee receipts and general queries', 'Administration', 48, null),
  ('Library', 'Book requests, membership and study space access', 'Library', 24, 'Library card number, if you have one.'),
  ('ID Card', 'New, replacement or corrected student ID cards', 'Administration', 72, 'Passport-size photo and a fee receipt for replacements.'),
  ('Certificates', 'Bonafide, study and conduct certificates', 'Examination Section', 72, 'Student ID and the purpose of the certificate.'),
  ('Other Services', 'Anything that does not fit another service', 'Administration', 48, null)
) as s(name, description, dept, hours, requirements)
join public.departments d on d.name = s.dept;
