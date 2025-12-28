/**
 * AI Provider abstraction for swappable LLM backends.
 * Configure via AI_PROVIDER env var: "gemini" | "openrouter"
 */

export interface AnalyzeResult {
  cleanedText: string;
  expansions: Record<string, string[]>;
}

export interface AIProvider {
  sanitizeShoppingList(rawText: string): Promise<string>;
  expandShoppingListKeywords(items: string[]): Promise<Record<string, string[]>>;
}

// Prompts shared across providers
export const PROMPTS = {
  sanitize: (rawText: string) => `Clean up this grocery shopping list. 
- Remove bullet points, symbols, and numbering.
- Fix obvious spelling errors.
- One product per line.
- Return ONLY the cleaned list text.
List: ${rawText}`,

  expand: (items: string[]) => `You are a grocery item semantic mapper. For each item in the list, provide 5-7 alternate search keywords or specific product phrases likely found in a Walmart order history.

CRITICAL RULES:
1. Keywords MUST strictly align with the user's intent. 
2. DO NOT suggest items that just share a word fragment (e.g., if searching for "anti gas", do NOT suggest "bubbles").
3. For generic items like "breakfast sandwiches", suggest actual products like "sausage biscuit", "bacon croissant", "Jimmy Dean", "breakfast muffin".
4. Return a JSON object where keys are the original items and values are arrays of strings.

Shopping List:
${items.join("\n")}`,
};

/**
 * Build JSON schema for expansion response.
 */
export function buildExpansionSchema(items: string[]) {
  return {
    type: "object" as const,
    properties: items.reduce(
      (acc, item) => {
        acc[item] = {
          type: "array" as const,
          items: { type: "string" as const },
        };
        return acc;
      },
      {} as Record<string, { type: "array"; items: { type: "string" } }>
    ),
    required: items,
    additionalProperties: false,
  };
}

/**
 * Full analysis pipeline using the configured provider.
 */
export async function analyzeShoppingList(
  rawText: string
): Promise<AnalyzeResult> {
  const provider = await getProvider();
  const cleanedText = await provider.sanitizeShoppingList(rawText);
  const items = cleanedText.split("\n").filter((line) => line.trim());
  const expansions = await provider.expandShoppingListKeywords(items);

  return { cleanedText, expansions };
}

/**
 * Dynamically load the configured AI provider.
 */
async function getProvider(): Promise<AIProvider> {
  const providerName = process.env.AI_PROVIDER || "gemini";

  switch (providerName.toLowerCase()) {
    case "openrouter": {
      const { OpenRouterProvider } = await import("./openRouterService");
      return new OpenRouterProvider();
    }
    case "gemini":
    default: {
      const { GeminiProvider } = await import("./geminiService");
      return new GeminiProvider();
    }
  }
}
