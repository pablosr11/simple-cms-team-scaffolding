import { z } from "zod";

export const ReceiptLineItemSchema = z.object({
  description: z.string().describe("Item or service description"),
  quantity: z.number().nullable().describe("Quantity purchased"),
  unitPrice: z.number().nullable().describe("Price per unit"),
  lineTotal: z.number().nullable().describe("Total for this line"),
});

export const ReceiptExtractionSchema = z.object({
  vendor: z.string().nullable().describe("Merchant / supplier name"),
  receiptDate: z
    .string()
    .nullable()
    .describe("Receipt date in YYYY-MM-DD format"),
  currency: z.string().nullable().describe("ISO 4217 currency code, e.g. USD"),
  totalAmount: z.number().nullable().describe("Grand total including tax"),
  taxAmount: z.number().nullable().describe("Total tax amount"),
  payer: z
    .string()
    .nullable()
    .describe("Who paid, if shown (person or card holder)"),
  category: z
    .string()
    .nullable()
    .describe("Best-guess expense category, e.g. Travel, Meals, Office"),
  lineItems: z.array(ReceiptLineItemSchema),
});

export type ReceiptExtraction = z.infer<typeof ReceiptExtractionSchema>;

export type ReceiptFile = {
  bytes: ArrayBuffer;
  mimeType: string;
};

export interface ReceiptExtractor {
  extract(file: ReceiptFile): Promise<ReceiptExtraction>;
}
