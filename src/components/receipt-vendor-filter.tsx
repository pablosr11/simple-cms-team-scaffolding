"use client";

export function ReceiptVendorFilter({
  vendors,
  selected,
}: {
  vendors: string[];
  selected?: string;
}) {
  return (
    <form action="/receipts">
      <select
        name="vendor"
        defaultValue={selected ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border bg-background px-2 py-1 text-sm"
      >
        <option value="">All vendors</option>
        {vendors.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </form>
  );
}
