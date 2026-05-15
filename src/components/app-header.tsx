import Link from "next/link";
import { getUserOrgs, getActiveOrg } from "@/lib/orgs";
import { OrgSwitcher } from "@/components/org-switcher";
import { Button } from "@/components/ui/button";

export async function AppHeader() {
  const [orgs, active] = await Promise.all([getUserOrgs(), getActiveOrg()]);

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-4">
        <Link href="/receipts" className="font-semibold">
          Receipt Tracker
        </Link>
        {orgs.length > 0 && (
          <OrgSwitcher orgs={orgs} activeId={active?.id} />
        )}
      </div>
      <form action="/auth/signout" method="post">
        <Button variant="ghost" size="sm" type="submit">
          Sign out
        </Button>
      </form>
    </header>
  );
}
