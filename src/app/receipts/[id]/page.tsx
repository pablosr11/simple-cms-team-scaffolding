import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DeleteReceiptButton } from "@/components/delete-receipt-button";

const UpdateSchema = z.object({
  vendor: z.string().trim().optional(),
  receipt_date: z.string().trim().optional(),
  currency: z.string().trim().optional(),
  total_amount: z.coerce.number().optional(),
  tax_amount: z.coerce.number().optional(),
  payer: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

function emptyToNull(v: string | undefined) {
  return v && v.length > 0 ? v : null;
}

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: receipt } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .single();
  if (!receipt) notFound();

  const { data: lineItems } = await supabase
    .from("receipt_line_items")
    .select("*")
    .eq("receipt_id", id);

  async function save(formData: FormData) {
    "use server";
    const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return;
    const d = parsed.data;

    const sb = await createClient();
    await sb
      .from("receipts")
      .update({
        vendor: emptyToNull(d.vendor),
        receipt_date: emptyToNull(d.receipt_date),
        currency: emptyToNull(d.currency),
        total_amount: Number.isFinite(d.total_amount) ? d.total_amount : null,
        tax_amount: Number.isFinite(d.tax_amount) ? d.tax_amount : null,
        payer: emptyToNull(d.payer),
        category: emptyToNull(d.category),
      })
      .eq("id", id);

    revalidatePath(`/receipts/${id}`);
    redirect("/receipts");
  }

  const field = (
    name: string,
    label: string,
    value: unknown,
    type = "text",
  ) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={value == null ? "" : String(value)}
        step={type === "number" ? "0.01" : undefined}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {receipt.vendor ?? "Receipt"}
        </h1>
        <div className="flex items-center gap-3">
          <Badge>{receipt.status}</Badge>
          <DeleteReceiptButton id={id} variant="detail" />
        </div>
      </div>

      {receipt.status === "failed" && receipt.error ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Extraction failed: {receipt.error}
        </p>
      ) : null}

      <form action={save} className="grid grid-cols-2 gap-4">
        {field("vendor", "Vendor", receipt.vendor)}
        {field("receipt_date", "Date", receipt.receipt_date, "date")}
        {field("currency", "Currency", receipt.currency)}
        {field("payer", "Payer", receipt.payer)}
        {field("total_amount", "Total", receipt.total_amount, "number")}
        {field("tax_amount", "Tax", receipt.tax_amount, "number")}
        {field("category", "Category", receipt.category)}
        <div className="col-span-2">
          <Button type="submit">Save changes</Button>
        </div>
      </form>

      <div>
        <h2 className="mb-2 font-medium">Line items</h2>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {(lineItems ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No line items extracted.
                  </td>
                </tr>
              ) : (
                lineItems!.map((li) => (
                  <tr key={li.id} className="border-b last:border-0">
                    <td className="p-3">{li.description}</td>
                    <td className="p-3">{li.quantity ?? "—"}</td>
                    <td className="p-3">{li.unit_price ?? "—"}</td>
                    <td className="p-3">{li.line_total ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
