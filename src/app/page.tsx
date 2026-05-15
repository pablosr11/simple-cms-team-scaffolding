import { redirect } from "next/navigation";
import { getUserOrgs } from "@/lib/orgs";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  await requireUser();
  const orgs = await getUserOrgs();
  redirect(orgs.length === 0 ? "/onboarding" : "/receipts");
}
