"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACTIVE_ORG_COOKIE } from "@/lib/orgs";

export async function setActiveOrg(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) return;
  (await cookies()).set(ACTIVE_ORG_COOKIE, orgId);
  revalidatePath("/", "layout");
}
