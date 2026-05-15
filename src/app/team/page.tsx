import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { getActiveOrg } from "@/lib/orgs";
import { createClient } from "@/lib/supabase/server";
import { InviteLinkBox } from "@/components/invite-link-box";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TeamPage() {
  const user = await requireUser();
  const org = await getActiveOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, role, user_id, profiles(display_name)")
    .eq("org_id", org.id)
    .order("created_at");

  const isOwner = org.role === "owner";

  // Latest unexpired invite for this org (owned only).
  const { data: invite } = isOwner
    ? await supabase
        .from("org_invites")
        .select("token")
        .eq("org_id", org.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    : { data: null };

  const origin = (await headers()).get("origin") ?? (await headers()).get("host") ?? "";
  const inviteUrl = invite ? `${origin}/join?token=${invite.token}` : null;

  async function generateInvite() {
    "use server";
    const sb = await createClient();
    const u = await requireUser();
    const activeOrg = await getActiveOrg();
    if (!activeOrg || activeOrg.role !== "owner") return;

    await sb.from("org_invites").insert({
      org_id: activeOrg.id,
      created_by: u.id,
    });
    revalidatePath("/team");
  }

  async function removeMember(formData: FormData) {
    "use server";
    const memberId = String(formData.get("memberId") ?? "");
    const activeOrg = await getActiveOrg();
    if (!activeOrg || activeOrg.role !== "owner") return;

    const sb = await createClient();
    await sb.from("organization_members").delete().eq("id", memberId);
    revalidatePath("/team");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team · {org.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(members ?? []).map((m) => {
            const profile = m.profiles as unknown as { display_name: string | null } | null;
            const isSelf = m.user_id === user.id;
            return (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  {profile?.display_name ?? m.user_id}{" "}
                  <span className="text-muted-foreground">· {m.role}</span>
                  {isSelf && <span className="text-muted-foreground"> (you)</span>}
                </span>
                {isOwner && !isSelf && (
                  <form action={removeMember}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite link</CardTitle>
            <CardDescription>
              Share this link with teammates. Valid for 7 days; anyone with it
              can join this team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inviteUrl ? (
              <InviteLinkBox url={inviteUrl} />
            ) : (
              <form action={generateInvite}>
                <Button type="submit">Generate invite link</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
