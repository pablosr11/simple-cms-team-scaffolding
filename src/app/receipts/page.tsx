import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrg } from "@/lib/orgs";
import { ReceiptUpload } from "@/components/receipt-upload";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  uploaded: "outline",
  processing: "secondary",
  extracted: "default",
  failed: "destructive",
};

export default async function ReceiptsPage() {
  const org = await getActiveOrg();
  const supabase = await createClient();
  const { data: receipts } = await supabase
    .from("receipts")
    .select("id, vendor, receipt_date, total_amount, currency, status")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Receipts {org ? `· ${org.name}` : ""}
        </h1>
      </div>

      <ReceiptUpload />

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">Vendor</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(receipts ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-muted-foreground"
                >
                  No receipts yet — upload one above.
                </td>
              </tr>
            ) : (
              receipts!.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/receipts/${r.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.vendor ?? "Untitled receipt"}
                    </Link>
                  </td>
                  <td className="p-3">{r.receipt_date ?? "—"}</td>
                  <td className="p-3">
                    {r.total_amount != null
                      ? `${r.currency ?? ""} ${r.total_amount}`.trim()
                      : "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
