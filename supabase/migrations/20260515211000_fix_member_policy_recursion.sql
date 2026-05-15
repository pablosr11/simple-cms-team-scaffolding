-- The "owner can manage membership" policy was cmd ALL with a USING subquery
-- that selects from organization_members — so it also gated SELECT and
-- recursed into itself ("infinite recursion detected in policy"). Mirror the
-- is_org_member() pattern: a SECURITY DEFINER owner check that bypasses RLS,
-- and split management into per-command policies so SELECT is handled solely
-- by the safe is_org_member() policy.

create or replace function is_org_owner(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members
    where org_id = org and user_id = auth.uid() and role = 'owner'
  );
$$;
grant execute on function is_org_owner(uuid) to anon, authenticated;

drop policy "owner can manage membership" on organization_members;

create policy "owner inserts membership"
  on organization_members for insert with check (is_org_owner(org_id));
create policy "owner updates membership"
  on organization_members for update
  using (is_org_owner(org_id)) with check (is_org_owner(org_id));
create policy "owner deletes membership"
  on organization_members for delete using (is_org_owner(org_id));
