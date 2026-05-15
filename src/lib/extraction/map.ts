import type { ReceiptExtraction } from "./types";

// Pure mappers from AI extraction output to DB row shapes. Kept separate
// so they are unit-testable without a database or network.

export function toReceiptUpdate(extraction: ReceiptExtraction) {
  return {
    status: "extracted" as const,
    vendor: extraction.vendor,
    receipt_date: extraction.receiptDate,
    currency: extraction.currency,
    total_amount: extraction.totalAmount,
    tax_amount: extraction.taxAmount,
    payer: extraction.payer,
    category: extraction.category,
    raw_extraction: extraction,
    error: null,
  };
}

export function toLineItemRows(
  receiptId: string,
  extraction: ReceiptExtraction,
) {
  return extraction.lineItems.map((li) => ({
    receipt_id: receiptId,
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unitPrice,
    line_total: li.lineTotal,
  }));
}
