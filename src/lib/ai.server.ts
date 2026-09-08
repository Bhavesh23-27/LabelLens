import type { AnalysisReport } from "@/lib/engine/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const CHAT_MODEL = "google/gemini-3.6-flash";
const VISION_MODEL = "google/gemini-3.6-flash";

export class AiUnavailableError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

type ChatMessage = {
  role: "system" | "user";
  content: string | Array<Record<string, unknown>>;
};

async function callGateway(messages: ChatMessage[]): Promise<string> {
  const key = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiUnavailableError("AI is not configured for this project.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: CHAT_MODEL, messages }),
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 429)
      throw new AiUnavailableError(
        "The explanation service is busy right now. Please try again shortly.",
        429,
      );
    if (response.status === 402)
      throw new AiUnavailableError(
        "AI credits are exhausted, so plain-language explanations are paused. The verified analysis below is unaffected.",
        402,
      );
    throw new AiUnavailableError(detail.slice(0, 300), response.status);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

const GUARDRAILS = `You are LabelLens, an assistant that explains packaged-food labels in simple, calm language.
Hard rules:
- Use ONLY the verified analysis data provided to you. Never add regulatory claims, limits, or references that are not in the data.
- Never say an ingredient is toxic, poisonous or dangerous. Never say a product is "FSSAI approved" or "banned".
- Never claim NOVA 4 means unsafe. Never treat "not found in the database" as banned.
- If information is missing, say so plainly.
- Short sentences. No fear-based language. No emojis. No markdown headings.`;

function summariseReport(report: AnalysisReport): string {
  const ingredients = report.ingredients.map((i) => ({
    label_text: i.parsed.raw,
    identified_as: i.knowledge?.canonical_name ?? "identification uncertain",
    ins: i.knowledge?.ins_number ?? i.parsed.insNumber ?? null,
    category: i.knowledge?.category ?? null,
    what_it_does: i.knowledge?.why_used ?? null,
    regulatory_status: i.regulatory?.permission_status ?? i.knowledge?.fssai_status ?? "unknown",
    regulatory_condition: i.regulatory?.condition ?? null,
    match_confidence: i.confidence,
  }));

  return JSON.stringify(
    {
      product: report.input.productName,
      insight_score: report.score.total,
      score_dimensions: report.score.dimensions,
      nova: report.nova,
      flags: report.flags.map((f) => ({
        code: f.code,
        label: f.label,
        detail: f.detail,
        ingredients: f.ingredients,
      })),
      allergens: report.allergens,
      nutrition: report.nutrition,
      analysis_confidence: report.confidence,
      ingredients,
    },
    null,
    1,
  );
}

/** AI explanation layer — natural language only, never regulatory truth. */
export async function generateExplanation(report: AnalysisReport): Promise<string> {
  return callGateway([
    { role: "system", content: GUARDRAILS },
    {
      role: "user",
      content: `Here is the verified LabelLens analysis for a product:\n${summariseReport(report)}\n\nWrite a short consumer summary in three parts, each on its own line and prefixed exactly like this:\nWhat this label says: ...\nThings worth knowing: ...\nHow to read the score: ...\nKeep each part to two or three sentences.`,
    },
  ]);
}

export async function answerQuestion(
  report: AnalysisReport,
  question: string,
): Promise<string> {
  return callGateway([
    { role: "system", content: GUARDRAILS },
    {
      role: "user",
      content: `Verified analysis data:\n${summariseReport(report)}\n\nUser question: ${question}\n\nAnswer using only the data above. If the data does not contain the answer, reply exactly: "I don't have enough verified information to answer that confidently."`,
    },
  ]);
}

/**
 * OCR service boundary. Implemented today with a vision model through the
  * Hosted AI gateway; can be swapped for any OCR provider without touching the
 * analysis engine.
 */
export async function runOcr(imageDataUrl: string): Promise<{
  text: string;
  confidence: number;
  provider: string;
}> {
  const key = process.env["AI_API_KEY"] ?? process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiUnavailableError("OCR_UNAVAILABLE: no OCR provider configured.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an OCR engine for packaged-food labels. Transcribe text exactly as printed. Never invent ingredients. Respond with strict JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Read this food package image. Return JSON: {"product_name": string|null, "brand": string|null, "ingredients_text": string, "nutrition_text": string|null, "allergen_text": string|null, "confidence": number between 0 and 1, "notes": string}. "ingredients_text" must contain only the ingredient declaration as printed. If no ingredient list is visible, return an empty string and confidence 0.',
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new AiUnavailableError(`OCR_FAILED: ${detail.slice(0, 200)}`, response.status);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new AiUnavailableError("OCR_FAILED: unreadable OCR response.");

  const parsed = JSON.parse(jsonMatch[0]) as {
    product_name?: string | null;
    brand?: string | null;
    ingredients_text?: string;
    nutrition_text?: string | null;
    allergen_text?: string | null;
    confidence?: number;
  };

  const text = [parsed.ingredients_text ?? "", parsed.allergen_text ?? "", parsed.nutrition_text ?? ""]
    .filter(Boolean)
    .join("\n");

  return {
    text,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
    provider: `ai-vision:${VISION_MODEL}`,
  };
}

export async function extractNutritionFromText(text: string): Promise<Record<string, number | string | null> | null> {
  const numeric = (pattern: RegExp): number | null => {
    const match = text.match(pattern);
    return match?.[1] ? Number(match[1]) : null;
  };
  const facts = {
    energy_kcal: numeric(/energy[^0-9]{0,20}(\d+(?:\.\d+)?)\s*k?cal/i),
    protein_g: numeric(/protein[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    carbohydrate_g: numeric(/carbohydrate[s]?[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    total_sugars_g: numeric(/(?:total\s+)?sugars?[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    added_sugars_g: numeric(/added\s+sugars?[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    total_fat_g: numeric(/(?:total\s+)?fat[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    saturated_fat_g: numeric(/saturated[^0-9]{0,25}(\d+(?:\.\d+)?)/i),
    trans_fat_g: numeric(/trans[^0-9]{0,25}(\d+(?:\.\d+)?)/i),
    fibre_g: numeric(/(?:fibre|fiber)[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    sodium_mg: numeric(/sodium[^0-9]{0,20}(\d+(?:\.\d+)?)/i),
    salt_g: numeric(/salt[^0-9]{0,20}(\d+(?:\.\d+)?)\s*g/i),
    basis: /per\s*100\s*(g|ml)/i.test(text) ? "per 100 g/ml" : null,
  };
  const hasValue = Object.entries(facts).some(
    ([key, value]) => key !== "basis" && typeof value === "number",
  );
  return hasValue ? facts : null;
}
