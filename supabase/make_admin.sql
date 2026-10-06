-- Run AFTER you have registered and confirmed your email in the app.
update public.profiles set role = 'admin' where email = 'prakashp9353@gmail.com';
select email, role from public.profiles where email = 'prakashp9353@gmail.com';
