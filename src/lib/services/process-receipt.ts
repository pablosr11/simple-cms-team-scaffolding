import type { SupabaseClient } from "@supabase/supabase-js";
import { getReceiptBytes } from "@/lib/r2";
import { getReceiptExtractor } from "@/lib/extraction";
import { toReceiptUpdate, toLineItemRows } from "@/lib/extraction/map";

// Upload → extract → persist. Synchronous today (called inline from the
// upload route). The body is self-contained so it can move to a Cloudflare
// Queue consumer later with no schema change — `receipts.status` already
// models the async lifecycle.
export async function processReceipt(
  supabase: SupabaseClient,
  receiptId: string,
): Promise<void> {
  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("id, r2_key, mime_type")
    .eq("id", receiptId)
    .single();
  if (error || !receipt) throw error ?? new Error("Receipt not found");

  await supabase
    .from("receipts")
    .update({ status: "processing" })
    .eq("id", receiptId);

  try {
    const bytes = await getReceiptBytes(receipt.r2_key);
    if (!bytes) throw new Error("Receipt file missing from storage");

    const extraction = await getReceiptExtractor().extract({
      bytes,
      mimeType: receipt.mime_type,
    });

    await supabase
      .from("receipts")
      .update(toReceiptUpdate(extraction))
      .eq("id", receiptId);

    const rows = toLineItemRows(receiptId, extraction);
    if (rows.length > 0) {
      await supabase.from("receipt_line_items").insert(rows);
    }
  } catch (e) {
    await supabase
      .from("receipts")
      .update({
        status: "failed",
        error: e instanceof Error ? e.message : "Extraction failed",
      })
      .eq("id", receiptId);
    throw e;
  }
}
