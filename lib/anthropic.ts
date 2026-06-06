import Anthropic from "@anthropic-ai/sdk";

// LLM is a FALLBACK only — used when deterministic parsing of a scraped page fails.
// Model is intentionally Sonnet (not the Opus default): extraction is a high-volume,
// cost-sensitive task. Overridable via CLAUDE_MODEL.
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  client ??= new Anthropic();
  return client;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}

/**
 * Structured extraction fallback. Returns JSON parsed from Claude's response,
 * shaped by `schemaInstruction`. Throws if the API key is missing or output
 * isn't valid JSON — callers treat that as a failed source.
 */
export async function extractWithLLM<T = unknown>(
  markdown: string,
  schemaInstruction: string,
): Promise<T> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: `אתה מחלץ נתונים מובְנים מטקסט. החזר JSON תקין בלבד, ללא טקסט נוסף, התואם לסכמה הבאה:\n${schemaInstruction}`,
    messages: [{ role: "user", content: markdown }],
  });
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(extractJson(text)) as T;
}
