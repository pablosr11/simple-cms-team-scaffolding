import { describe, expect, it } from "vitest";
import { resolveModelChain } from "./model-chain";

describe("resolveModelChain", () => {
  it("returns default chain when env is empty", () => {
    expect(resolveModelChain({})).toEqual([
      "google/gemini-3-flash-preview",
      "anthropic/claude-sonnet-4.6",
      "openai/gpt-5.5",
    ]);
  });

  it("uses custom primary with default fallbacks", () => {
    const chain = resolveModelChain({ OPENROUTER_MODEL: "openai/gpt-4o" });
    expect(chain[0]).toBe("openai/gpt-4o");
    expect(chain.length).toBe(3);
  });

  it("uses custom fallbacks when OPENROUTER_FALLBACK_MODELS is set", () => {
    const chain = resolveModelChain({
      OPENROUTER_FALLBACK_MODELS: "anthropic/claude-haiku-4.5, openai/gpt-4o-mini",
    });
    expect(chain).toEqual([
      "google/gemini-3-flash-preview",
      "anthropic/claude-haiku-4.5",
      "openai/gpt-4o-mini",
    ]);
  });

  it("deduplicates models preserving order", () => {
    const chain = resolveModelChain({
      OPENROUTER_MODEL: "openai/gpt-5.5",
      OPENROUTER_FALLBACK_MODELS: "openai/gpt-5.5,anthropic/claude-sonnet-4.6",
    });
    expect(chain).toEqual(["openai/gpt-5.5", "anthropic/claude-sonnet-4.6"]);
  });

  it("ignores whitespace-only and empty entries", () => {
    const chain = resolveModelChain({
      OPENROUTER_FALLBACK_MODELS: " ,anthropic/claude-sonnet-4.6, ,",
    });
    expect(chain).toEqual([
      "google/gemini-3-flash-preview",
      "anthropic/claude-sonnet-4.6",
    ]);
  });
});
