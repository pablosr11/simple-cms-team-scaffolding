import { describe, it, expect } from "vitest";
import { toReceiptUpdate, toLineItemRows } from "./map";
import type { ReceiptExtraction } from "./types";

const extraction: ReceiptExtraction = {
  vendor: "Acme Cafe",
  receiptDate: "2026-05-01",
  currency: "USD",
  totalAmount: 42.5,
  taxAmount: 3.5,
  payer: "Jane Doe",
  category: "Meals",
  lineItems: [
    { description: "Coffee", quantity: 2, unitPrice: 4, lineTotal: 8 },
    { description: "Sandwich", quantity: 1, unitPrice: 9.5, lineTotal: 9.5 },
  ],
};

describe("extraction mappers", () => {
  it("maps extraction to a receipt update with extracted status", () => {
    const update = toReceiptUpdate(extraction);
    expect(update.status).toBe("extracted");
    expect(update.vendor).toBe("Acme Cafe");
    expect(update.total_amount).toBe(42.5);
    expect(update.error).toBeNull();
    expect(update.raw_extraction).toBe(extraction);
  });

  it("maps line items to rows keyed by receipt id", () => {
    const rows = toLineItemRows("r-1", extraction);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      receipt_id: "r-1",
      description: "Coffee",
      quantity: 2,
      unit_price: 4,
      line_total: 8,
    });
  });

  it("returns no rows when there are no line items", () => {
    expect(toLineItemRows("r-1", { ...extraction, lineItems: [] })).toEqual([]);
  });
});
