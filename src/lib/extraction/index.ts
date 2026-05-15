import type { ReceiptExtractor } from "./types";
import { createOpenRouterExtractor } from "./openrouter";

// Single seam for swapping providers. Today everything routes through
// OpenRouter (model selected via OPENROUTER_MODEL); add a branch here to
// introduce another provider.
export function getReceiptExtractor(): ReceiptExtractor {
  return createOpenRouterExtractor();
}

export type { ReceiptExtractor, ReceiptExtraction } from "./types";
