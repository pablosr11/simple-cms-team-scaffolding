"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { deleteReceiptFile } from "@/lib/r2";
import { ACTIVE_ORG_COOKIE } from "@/lib/orgs";

export async function setActiveOrg(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) return;
  (await cookies()).set(ACTIVE_ORG_COOKIE, orgId);
  revalidatePath("/", "layout");
}

export async function deleteReceipt(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // Fetch the r2_key first so we can clean up storage (RLS ensures membership).
  const { data: receipt } = await supabase
    .from("receipts")
    .select("r2_key")
    .eq("id", id)
    .single();

  await supabase.from("receipts").delete().eq("id", id);

  // Best-effort R2 cleanup after the DB row is gone.
  if (receipt?.r2_key) {
    try {
      await deleteReceiptFile(receipt.r2_key);
    } catch {
      // R2 delete is non-critical; the DB row (and RLS) is the source of truth.
    }
  }

  revalidatePath("/receipts");
  redirect("/receipts");
}
