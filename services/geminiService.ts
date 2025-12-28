import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, PROMPTS } from "./aiService";

const MODEL = "gemini-2.0-flash";

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

export class GeminiProvider implements AIProvider {
  async sanitizeShoppingList(rawText: string): Promise<string> {
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: PROMPTS.sanitize(rawText),
    });

    return response.text?.trim() || rawText;
  }

  async expandShoppingListKeywords(
    items: string[]
  ): Promise<Record<string, string[]>> {
    if (items.length === 0) return {};

    const ai = getAI();

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: PROMPTS.expand(items),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: Object.fromEntries(
            items.map((item) => [
              item,
              { type: Type.ARRAY, items: { type: Type.STRING } },
            ])
          ),
        },
      },
    });

    return JSON.parse(response.text || "{}") as Record<string, string[]>;
  }
}
