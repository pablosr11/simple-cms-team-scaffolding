import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrg } from "@/lib/orgs";
import { ReceiptUpload } from "@/components/receipt-upload";
import { ReceiptVendorFilter } from "@/components/receipt-vendor-filter";
import { DeleteReceiptButton } from "@/components/delete-receipt-button";
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

const SORT_COLUMN = { vendor: "vendor", date: "receipt_date" } as const;
type SortKey = keyof typeof SORT_COLUMN;

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string; sort?: string; dir?: string }>;
}) {
  const { vendor, sort, dir } = await searchParams;
  const sortKey: SortKey | null =
    sort === "vendor" || sort === "date" ? sort : null;
  const ascending = dir !== "desc";

  const org = await getActiveOrg();
  const supabase = await createClient();

  const { data: vendorRows } = await supabase
    .from("receipts")
    .select("vendor")
    .not("vendor", "is", null);
  const vendors = [
    ...new Set((vendorRows ?? []).map((r) => r.vendor as string)),
  ].sort((a, b) => a.localeCompare(b));

  let query = supabase
    .from("receipts")
    .select("id, vendor, receipt_date, total_amount, currency, status");
  query = sortKey
    ? query.order(SORT_COLUMN[sortKey], { ascending, nullsFirst: false })
    : query.order("created_at", { ascending: false });
  if (vendor) query = query.eq("vendor", vendor);
  const { data: receipts } = await query;

  function sortHref(key: SortKey) {
    const params = new URLSearchParams();
    if (vendor) params.set("vendor", vendor);
    params.set("sort", key);
    // Toggle when re-clicking the active column; default to ascending.
    params.set("dir", sortKey === key && ascending ? "desc" : "asc");
    return `/receipts?${params.toString()}`;
  }

  function sortLabel(key: SortKey, label: string) {
    const arrow = sortKey === key ? (ascending ? " ▲" : " ▼") : "";
    return `${label}${arrow}`;
  }

  const exportParams = new URLSearchParams();
  if (vendor) exportParams.set("vendor", vendor);
  if (sort) exportParams.set("sort", sort);
  if (dir) exportParams.set("dir", dir);
  const exportHref = `/api/receipts/export${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          Receipts {org ? `· ${org.name}` : ""}
        </h1>
        {vendors.length > 0 && (
          <div className="flex items-center gap-3">
            <ReceiptVendorFilter vendors={vendors} selected={vendor} />
            {vendor && (
              <Link
                href="/receipts"
                className="text-sm text-muted-foreground hover:underline"
              >
                Clear
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <ReceiptUpload />
        <Link href={exportHref} className="text-sm text-muted-foreground hover:underline">
          Export CSV
        </Link>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="p-3">
                <Link href={sortHref("vendor")} className="hover:underline">
                  {sortLabel("vendor", "Vendor")}
                </Link>
              </th>
              <th className="p-3">
                <Link href={sortHref("date")} className="hover:underline">
                  {sortLabel("date", "Date")}
                </Link>
              </th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {(receipts ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  {vendor
                    ? `No receipts for ${vendor}.`
                    : "No receipts yet — upload one above."}
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
                  <td className="p-3 text-right">
                    <DeleteReceiptButton id={r.id} />
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
