-- Shareable invite links: org owner generates a token, shares the URL;
-- any signed-in user with the link can join the org.

create table org_invites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  role       member_role not null default 'member',
  token      uuid not null default gen_random_uuid() unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create index on org_invites (token);

alter table org_invites enable row level security;

-- Owners create and revoke invites for their org.
create policy "owner manages invites"
  on org_invites for all
  using (is_org_owner(org_id)) with check (is_org_owner(org_id));

-- Any authed user can read an invite row (to display org name on /join).
create policy "authed user reads invite"
  on org_invites for select using (auth.uid() is not null);

grant all on org_invites to authenticated;
grant all on org_invites to anon;

-- SECURITY DEFINER: validates the token and inserts the caller as a member.
-- Bypasses RLS on organization_members so the joining user doesn't need
-- owner rights — the token is the authorisation.
create function accept_invite(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v org_invites%rowtype;
begin
  select * into v
  from org_invites
  where token = p_token and expires_at > now();
  if not found then return false; end if;

  insert into organization_members (org_id, user_id, role)
  values (v.org_id, auth.uid(), v.role)
  on conflict (org_id, user_id) do nothing;

  return true;
end;
$$;

grant execute on function accept_invite(uuid) to authenticated;
