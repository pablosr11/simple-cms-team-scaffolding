-- TEMPORARY diagnostic. Dropped in a follow-up migration.
create or replace function debug_whoami()
returns json
language sql
stable
as $$
  select json_build_object(
    'uid', auth.uid(),
    'role', current_user,
    'jwt_role', current_setting('request.jwt.claims', true)::json ->> 'role',
    'jwt_sub', current_setting('request.jwt.claims', true)::json ->> 'sub'
  );
$$;
grant execute on function debug_whoami() to anon, authenticated;
