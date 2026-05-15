import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_ORG_COOKIE = "active_org";

export type Org = { id: string; name: string; role: string };

export async function getUserOrgs(): Promise<Org[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .order("created_at", { ascending: true });

  return (data ?? []).flatMap((m) => {
    const org = m.organizations as unknown as { id: string; name: string } | null;
    return org ? [{ id: org.id, name: org.name, role: m.role as string }] : [];
  });
}

// Resolves the active org from the cookie, falling back to the first
// membership. Returns null when the user belongs to no org yet.
export async function getActiveOrg(): Promise<Org | null> {
  const orgs = await getUserOrgs();
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  return orgs.find((o) => o.id === preferred) ?? orgs[0];
}
