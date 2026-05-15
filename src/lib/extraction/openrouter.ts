import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import {
  ReceiptExtractionSchema,
  type ReceiptExtractor,
  type ReceiptFile,
} from "./types";

const SYSTEM_PROMPT =
  "You extract structured data from receipts and invoices. " +
  "Return null for any field you cannot determine. Do not invent values.";

export function createOpenRouterExtractor(): ReceiptExtractor {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  const modelId = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  return {
    async extract(file: ReceiptFile) {
      const isPdf = file.mimeType === "application/pdf";
      const { object } = await generateObject({
        model: openrouter(modelId),
        schema: ReceiptExtractionSchema,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the receipt data." },
              isPdf
                ? {
                    type: "file",
                    data: file.bytes,
                    mediaType: file.mimeType,
                  }
                : {
                    type: "image",
                    image: file.bytes,
                    mediaType: file.mimeType,
                  },
            ],
          },
        ],
      });
      return object;
    },
  };
}
