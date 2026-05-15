-- `.insert().select()` (supabase-js) issues INSERT ... RETURNING, and Postgres
-- enforces the SELECT policy on the returned row. The owner-membership row is
-- created by the on_org_created AFTER trigger, which fires *after* that check,
-- so `is_org_member(id)` was false and the creator could not read back the org
-- they just inserted. Allow creators to read their own orgs directly.
create policy "creator can read their orgs"
  on organizations for select using (created_by = auth.uid());

-- Drop the temporary diagnostic function.
drop function if exists debug_whoami();
