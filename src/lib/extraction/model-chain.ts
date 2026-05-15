const DEFAULT_PRIMARY = "google/gemini-3-flash-preview";
const DEFAULT_FALLBACKS = ["anthropic/claude-sonnet-4.6", "openai/gpt-5.5"];

export function resolveModelChain(env: Record<string, string | undefined>): string[] {
  const primary = env.OPENROUTER_MODEL?.trim() || DEFAULT_PRIMARY;
  const fallbacks = env.OPENROUTER_FALLBACK_MODELS
    ? env.OPENROUTER_FALLBACK_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
    : DEFAULT_FALLBACKS;

  // Deduplicate: primary first, then fallbacks in order (skip repeats).
  const seen = new Set<string>();
  return [primary, ...fallbacks].filter((m) => {
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}
