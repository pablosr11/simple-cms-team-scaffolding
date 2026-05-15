-- Supabase's standard public-schema privileges for the API roles. RLS still
-- governs row access; these GRANTs only allow the roles to reach the tables.
-- Needed because the schema was applied via `supabase db push` (as postgres),
-- which does not run the dashboard's default grant bootstrap.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
