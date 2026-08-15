import type { MatchedIngredient, NovaResult } from "./types";

const NOVA_LABELS: Record<number, string> = {
  1: "NOVA 1 — Unprocessed or minimally processed",
  2: "NOVA 2 — Processed culinary ingredient",
  3: "NOVA 3 — Processed food",
  4: "NOVA 4 — Ultra-processed",
};

const COSMETIC_CATEGORIES = new Set([
  "Artificial colour",
  "Natural colour",
  "Flavouring agent",
  "Artificial sweetener",
  "Emulsifier",
  "Stabilizer",
  "Thickener",
  "Flavour enhancer",
  "Humectant",
  "Bulking agent",
  "Anti-caking agent",
]);

/**
 * NOVA engine — classifies the DEGREE OF PROCESSING only.
 * It is never a safety verdict and never a healthiness score.
 */
export function classifyNova(ingredients: MatchedIngredient[]): NovaResult {
  const reasons: string[] = [];
  const known = ingredients.filter((i) => i.knowledge);

  const cosmetic = known.filter((i) =>
    COSMETIC_CATEGORIES.has(i.knowledge!.category),
  );
  const industrial = known.filter(
    (i) => i.knowledge!.processing_indicator === "industrial-ingredient",
  );
  const culinary = known.filter(
    (i) => i.knowledge!.processing_indicator === "processed-culinary-ingredient",
  );
  const maxRelevance = known.reduce(
    (max, i) => Math.max(max, i.knowledge!.nova_relevance),
    1,
  );

  let novaClass: 1 | 2 | 3 | 4 = 1;

  if (cosmetic.length >= 2 || industrial.length >= 2 || maxRelevance >= 4) {
    novaClass = 4;
  } else if (industrial.length === 1 || cosmetic.length === 1 || maxRelevance === 3) {
    novaClass = 3;
  } else if (culinary.length > 0 || maxRelevance === 2) {
    novaClass = 2;
  }

  if (cosmetic.length > 0) {
    reasons.push(
      `${cosmetic.length} cosmetic/technological ingredient${cosmetic.length > 1 ? "s" : ""} detected (${cosmetic
        .slice(0, 4)
        .map((i) => i.knowledge!.canonical_name)
        .join(", ")}).`,
    );
  }
  if (industrial.length > 0) {
    reasons.push(
      `${industrial.length} ingredient${industrial.length > 1 ? "s are" : " is"} typically produced by industrial processing.`,
    );
  }
  if (culinary.length > 0) {
    reasons.push(
      `${culinary.length} processed culinary ingredient${culinary.length > 1 ? "s" : ""} such as sugar, salt or oil.`,
    );
  }
  if (ingredients.length >= 10) {
    reasons.push(`The label declares ${ingredients.length} ingredients, which is typical of formulated products.`);
  }
  const unknown = ingredients.length - known.length;
  if (unknown > 0) {
    reasons.push(
      `${unknown} ingredient${unknown > 1 ? "s were" : " was"} not confidently identified, so this classification may change after review.`,
    );
  }
  if (reasons.length === 0) {
    reasons.push("No processing markers were detected in the identified ingredients.");
  }

  const plain: Record<number, string> = {
    1: "This looks like whole or barely altered food.",
    2: "This looks like an ingredient used for cooking, such as sugar, oil or salt.",
    3: "This looks like a food made by adding salt, sugar, oil or preservatives to whole foods.",
    4: "This looks like an industrially formulated product that uses ingredients you would not normally cook with at home.",
  };

  return {
    novaClass,
    label: NOVA_LABELS[novaClass]!,
    plainLanguage: plain[novaClass]!,
    reasons,
    caveat:
      "This classification describes the degree of industrial processing. It does not by itself prove that the product is unsafe or unhealthy.",
  };
}
