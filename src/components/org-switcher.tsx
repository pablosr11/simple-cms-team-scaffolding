"use client";

import { setActiveOrg } from "@/app/actions";
import type { Org } from "@/lib/orgs";

export function OrgSwitcher({
  orgs,
  activeId,
}: {
  orgs: Org[];
  activeId?: string;
}) {
  return (
    <form action={setActiveOrg}>
      <select
        name="orgId"
        defaultValue={activeId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border bg-background px-2 py-1 text-sm"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </form>
  );
}
