-- Tighten invite link default expiry from 7 days to 1 day.
alter table org_invites
  alter column expires_at set default now() + interval '1 day';
