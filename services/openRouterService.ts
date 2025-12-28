import { AIProvider, PROMPTS, buildExpansionSchema } from "./aiService";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return apiKey;
}

function getModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

async function chat(
  messages: OpenRouterMessage[],
  jsonSchema?: object
): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();

  const body: Record<string, unknown> = {
    model,
    messages,
  };

  if (jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "response",
        strict: true,
        schema: jsonSchema,
      },
    };
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/TheSethRose/Shopping-List-Standardization",
      "X-Title": "Walmart Purchase History Analyzer",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  return content;
}

export class OpenRouterProvider implements AIProvider {
  async sanitizeShoppingList(rawText: string): Promise<string> {
    const content = await chat([
      { role: "user", content: PROMPTS.sanitize(rawText) },
    ]);

    return content.trim() || rawText;
  }

  async expandShoppingListKeywords(
    items: string[]
  ): Promise<Record<string, string[]>> {
    if (items.length === 0) return {};

    const schema = buildExpansionSchema(items);

    const content = await chat(
      [{ role: "user", content: PROMPTS.expand(items) }],
      schema
    );

    return JSON.parse(content) as Record<string, string[]>;
  }
}
