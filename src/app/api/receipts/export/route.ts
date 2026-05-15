import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const HEADERS = [
  "id",
  "vendor",
  "date",
  "currency",
  "total_amount",
  "tax_amount",
  "payer",
  "category",
  "status",
  "filename",
];

function csvRow(values: unknown[]) {
  return values
    .map((v) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export async function GET(req: NextRequest) {
  await requireUser();
  const supabase = await createClient();

  const { searchParams } = req.nextUrl;
  const vendor = searchParams.get("vendor") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const dir = searchParams.get("dir") ?? undefined;

  const ascending = dir !== "desc";
  const SORT_COLUMN: Record<string, string> = {
    vendor: "vendor",
    date: "receipt_date",
  };

  let query = supabase
    .from("receipts")
    .select(
      "id, vendor, receipt_date, currency, total_amount, tax_amount, payer, category, status, original_filename",
    );

  if (sort && SORT_COLUMN[sort]) {
    query = query.order(SORT_COLUMN[sort], { ascending, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }
  if (vendor) query = query.eq("vendor", vendor);

  const { data: receipts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = [
    csvRow(HEADERS),
    ...(receipts ?? []).map((r) =>
      csvRow([
        r.id,
        r.vendor,
        r.receipt_date,
        r.currency,
        r.total_amount,
        r.tax_amount,
        r.payer,
        r.category,
        r.status,
        r.original_filename,
      ]),
    ),
  ];

  const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const scope = vendor ? vendor.replace(/[^a-z0-9]/gi, "_") : "all-vendors";
  const filename = `receipts-${scope}-${ts}.csv`;

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
