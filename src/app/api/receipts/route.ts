import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrg } from "@/lib/orgs";
import { receiptKey, putReceipt } from "@/lib/r2";
import { processReceipt } from "@/lib/services/process-receipt";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await getActiveOrg();
  if (!org) {
    return NextResponse.json({ error: "No active organization" }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${file.type}` },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  // RLS enforces that the user is a member of org.id.
  const { data: receipt, error } = await supabase
    .from("receipts")
    .insert({
      org_id: org.id,
      uploaded_by: user.id,
      r2_key: "",
      original_filename: file.name,
      mime_type: file.type,
      status: "uploaded",
    })
    .select("id")
    .single();
  if (error || !receipt) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  const key = receiptKey(org.id, receipt.id, file.name);
  await putReceipt(key, await file.arrayBuffer(), file.type);
  await supabase.from("receipts").update({ r2_key: key }).eq("id", receipt.id);

  try {
    await processReceipt(supabase, receipt.id);
  } catch {
    // Status is already 'failed'; surface the receipt so the UI can show it.
  }

  return NextResponse.json({ id: receipt.id }, { status: 201 });
}
