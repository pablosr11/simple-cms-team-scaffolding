import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE } from "@/lib/orgs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  await requireUser();
  const { token } = await searchParams;
  if (!token) redirect("/receipts");

  const supabase = await createClient();

  // Look up the invite to show the org name before confirming.
  const { data: invite } = await supabase
    .from("org_invites")
    .select("org_id, organizations(name)")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
            <CardDescription>
              This link has expired or is not valid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/receipts" className="text-sm underline">
              Go to your receipts
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const org = invite.organizations as unknown as { name: string } | null;

  async function acceptInvite() {
    "use server";
    const sb = await createClient();
    const { data: ok } = await sb.rpc("accept_invite", { p_token: token });
    if (!ok) redirect(`/join?token=${token}&error=1`);

    // Switch the active org cookie to the newly joined org.
    (await cookies()).set(ACTIVE_ORG_COOKIE, invite!.org_id);
    redirect("/receipts");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join {org?.name ?? "team"}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this team on Receipt Tracker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={acceptInvite}>
            <Button type="submit" className="w-full">
              Accept invite
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
