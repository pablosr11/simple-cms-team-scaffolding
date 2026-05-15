import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserOrgs, ACTIVE_ORG_COOKIE } from "@/lib/orgs";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function createOrg(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Trigger handle_new_org() adds the creator as owner member.
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, created_by: user.id })
    .select("id")
    .single();
  if (error) throw error;

  (await cookies()).set(ACTIVE_ORG_COOKIE, data.id);
  redirect("/receipts");
}

export default async function OnboardingPage() {
  await requireUser();
  const orgs = await getUserOrgs();
  if (orgs.length > 0) redirect("/receipts");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your team</CardTitle>
          <CardDescription>
            Receipts are shared within a team. You can invite people later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input id="name" name="name" required placeholder="Acme Inc." />
            </div>
            <Button type="submit" className="w-full">
              Create team
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
