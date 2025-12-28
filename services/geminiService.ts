import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-3-flash-preview";

function getAI(): GoogleGenAI {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Sanitizes a shopping list by removing formatting and fixing spelling errors.
 */
export async function sanitizeShoppingList(rawText: string): Promise<string> {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Clean up this grocery shopping list. 
- Remove bullet points, symbols, and numbering.
- Fix obvious spelling errors.
- One product per line.
- Return ONLY the cleaned list text.
List: ${rawText}`,
  });

  return response.text?.trim() || rawText;
}

/**
 * Expands shopping list items into semantic search keywords.
 * Returns a map of original items to arrays of alternate search terms.
 */
export async function expandShoppingListKeywords(
  items: string[]
): Promise<Record<string, string[]>> {
  if (items.length === 0) return {};

  const ai = getAI();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `You are a grocery item semantic mapper. For each item in the list, provide 5-7 alternate search keywords or specific product phrases likely found in a Walmart order history.

CRITICAL RULES:
1. Keywords MUST strictly align with the user's intent. 
2. DO NOT suggest items that just share a word fragment (e.g., if searching for "anti gas", do NOT suggest "bubbles").
3. For generic items like "breakfast sandwiches", suggest actual products like "sausage biscuit", "bacon croissant", "Jimmy Dean", "breakfast muffin".
4. Return a JSON object where keys are the original items and values are arrays of strings.

Shopping List:
${items.join("\n")}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: items.reduce(
          (acc, item) => {
            acc[item] = { type: Type.ARRAY, items: { type: Type.STRING } };
            return acc;
          },
          {} as Record<string, { type: typeof Type.ARRAY; items: { type: typeof Type.STRING } }>
        ),
      },
    },
  });

  return JSON.parse(response.text || "{}") as Record<string, string[]>;
}

export interface AnalyzeResult {
  cleanedText: string;
  expansions: Record<string, string[]>;
}

/**
 * Full analysis pipeline: sanitize + expand keywords.
 */
export async function analyzeShoppingList(
  rawText: string
): Promise<AnalyzeResult> {
  const cleanedText = await sanitizeShoppingList(rawText);
  const items = cleanedText.split("\n").filter((line) => line.trim());
  const expansions = await expandShoppingListKeywords(items);

  return { cleanedText, expansions };
}
