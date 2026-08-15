import { analyseNutrition, detectAllergens, detectConcerns } from "./concerns";
import { matchAll, type KnowledgeIndex } from "./matcher";
import { classifyNova } from "./nova";
import { parseIngredients } from "./parser";
import { buildVerdict, calculateConfidence, calculateInsightScore } from "./score";
import type {
  AnalysisReport,
  NutritionFacts,
  SourceAttribution,
} from "./types";

export * from "./types";
export { parseIngredients, cleanOcrText, extractIngredientSection } from "./parser";
export { buildKnowledgeIndex, matchAll } from "./matcher";
export { classifyNova } from "./nova";
export { detectConcerns, detectAllergens, analyseNutrition } from "./concerns";
export { calculateInsightScore, calculateConfidence, buildVerdict } from "./score";

/**
 * Orchestrates the deterministic pipeline:
 * text -> parser -> normalization -> knowledge base -> regulatory -> NOVA
 * -> nutrition -> concerns -> confidence -> score -> report.
 * The AI explanation layer is attached afterwards and never changes these values.
 */
export function runAnalysis(input: {
  text: string;
  method: "image" | "manual" | "demo";
  index: KnowledgeIndex;
  ocrConfidence?: number | null;
  nutrition?: NutritionFacts | null;
  productName?: string | null;
  brand?: string | null;
  sources: SourceAttribution[];
  knowledgeBaseUpdatedAt?: string | null;
  isDemo?: boolean;
}): AnalysisReport {
  const parsed = parseIngredients(input.text);
  const ingredients = matchAll(parsed.ingredients, input.index);

  const nova = classifyNova(ingredients);
  const flags = detectConcerns(ingredients);
  const nutritionFindings = analyseNutrition(input.nutrition ?? null);
  const allFlags = [...flags, ...nutritionFindings];
  const allergens = detectAllergens(ingredients, parsed.mayContain);
  const confidence = calculateConfidence({
    ingredients,
    ocrConfidence: input.ocrConfidence ?? null,
    sectionFound: parsed.sectionFound,
  });
  const score = calculateInsightScore({
    ingredients,
    nova,
    flags: allFlags,
    nutrition: input.nutrition ?? null,
    confidence,
  });

  return {
    input: {
      method: input.method,
      rawText: input.text,
      ocrConfidence: input.ocrConfidence ?? null,
      productName: input.productName ?? null,
      brand: input.brand ?? null,
    },
    ingredients,
    unknownNames: ingredients
      .filter((i) => !i.knowledge)
      .map((i) => i.parsed.displayName),
    nova,
    flags: allFlags,
    score,
    allergens,
    nutrition: input.nutrition ?? null,
    nutritionFindings,
    confidence,
    verdict: buildVerdict({ score: score.total, nova, flags: allFlags, confidence }),
    sources: input.sources,
    knowledgeBaseUpdatedAt: input.knowledgeBaseUpdatedAt ?? null,
    isDemo: input.isDemo ?? false,
    generatedAt: new Date().toISOString(),
    aiExplanation: null,
    aiUnavailableReason: null,
  };
}
