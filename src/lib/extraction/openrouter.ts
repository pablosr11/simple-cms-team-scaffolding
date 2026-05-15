import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import {
  ReceiptExtractionSchema,
  type ReceiptExtractor,
  type ReceiptFile,
} from "./types";
import { resolveModelChain } from "./model-chain";

const SYSTEM_PROMPT =
  "You extract structured data from receipts and invoices. " +
  "Return null for any field you cannot determine. Do not invent values.";

export function createOpenRouterExtractor(): ReceiptExtractor {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  const chain = resolveModelChain(process.env as Record<string, string | undefined>);
  // chain[0] is the primary; the full array is passed as `models` so OpenRouter
  // automatically falls back to the next entry on availability/rate-limit errors.
  const modelId = chain[0];

  return {
    async extract(file: ReceiptFile) {
      const isPdf = file.mimeType === "application/pdf";
      const { object } = await generateObject({
        model: openrouter(modelId, { models: chain }),
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
