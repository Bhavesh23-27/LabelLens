import type {
  AnalysisFlag,
  ConfidenceResult,
  MatchedIngredient,
  NovaResult,
  NutritionFacts,
  ScoreResult,
} from "./types";

/**
 * LabelLens Insight Score — a transparent, explainable label-readability and
 * processing indicator. It is NOT a medical rating and NOT an official
 * FSSAI score or certification.
 */
export function calculateInsightScore(input: {
  ingredients: MatchedIngredient[];
  nova: NovaResult;
  flags: AnalysisFlag[];
  nutrition: NutritionFacts | null;
  confidence: ConfidenceResult;
}): ScoreResult {
  const { ingredients, nova, flags, nutrition, confidence } = input;
  const identified = ingredients.filter((i) => i.knowledge).length;
  const total = Math.max(ingredients.length, 1);
  const identifiedRatio = identified / total;
  const has = (code: string) => flags.some((f) => f.code === code);

  const dimensions = [] as ScoreResult["dimensions"];

  // 1. Ingredient transparency (20)
  const transparency = Math.round(identifiedRatio * 20);
  dimensions.push({
    label: "Ingredient transparency",
    points: transparency,
    max: 20,
    note: `${identified} of ${total} declared ingredients were identified in the knowledge base.`,
  });

  // 2. Processing level (25)
  const processingPoints = { 1: 25, 2: 20, 3: 13, 4: 6 }[nova.novaClass];
  dimensions.push({
    label: "Processing level",
    points: processingPoints,
    max: 25,
    note: `${nova.label}. Higher processing reduces this dimension; it is not a safety judgement.`,
  });

  // 3. Added-sugar indicators (15)
  const sugarCount = flags.find((f) => f.code === "ADDED_SUGAR")?.ingredients.length ?? 0;
  const sugarPoints = Math.max(0, 15 - sugarCount * 5 - (has("HIGH_SUGAR") ? 5 : 0));
  dimensions.push({
    label: "Added-sugar indicators",
    points: sugarPoints,
    max: 15,
    note:
      sugarCount === 0
        ? "No sugar-containing ingredient was identified."
        : `${sugarCount} sugar-containing ingredient${sugarCount > 1 ? "s" : ""} identified${has("HIGH_SUGAR") ? " and the nutrition panel is in the high-sugar band" : ""}.`,
  });

  // 4. Sodium indicators (10)
  const sodiumPoints = has("HIGH_SODIUM") ? 4 : 10;
  dimensions.push({
    label: "Sodium indicators",
    points: sodiumPoints,
    max: 10,
    note: has("HIGH_SODIUM")
      ? "Sodium-related indicators were found on this label."
      : "No sodium concern was detected from the available data.",
  });

  // 5. Additive complexity (15)
  const additiveCount = ingredients.filter((i) => i.knowledge?.ins_number).length;
  const additivePoints = Math.max(0, 15 - additiveCount * 2);
  dimensions.push({
    label: "Additive complexity",
    points: additivePoints,
    max: 15,
    note: `${additiveCount} numbered additive${additiveCount === 1 ? "" : "s"} declared.`,
  });

  // 6. Allergen clarity (5)
  const allergenPoints = has("UNKNOWN_INGREDIENT") ? 2 : 5;
  dimensions.push({
    label: "Allergen clarity",
    points: allergenPoints,
    max: 5,
    note: has("UNKNOWN_INGREDIENT")
      ? "Unidentified ingredients make allergen assessment less certain."
      : "Allergen assessment could be completed from the identified ingredients.",
  });

  // 7. Regulatory match confidence (10)
  const withRules = ingredients.filter((i) => i.regulatory).length;
  const regulatoryPoints = Math.round((withRules / total) * 10);
  dimensions.push({
    label: "Regulatory match confidence",
    points: regulatoryPoints,
    max: 10,
    note: `${withRules} of ${total} ingredients could be matched to a referenced regulatory record.`,
  });

  // 8. Nutrition data quality — only scored when data exists
  if (nutrition) {
    const provided = Object.entries(nutrition).filter(
      ([key, value]) => key !== "basis" && typeof value === "number",
    ).length;
    dimensions.push({
      label: "Nutrition data quality",
      points: Math.min(10, provided),
      max: 10,
      note: `${provided} nutrition value${provided === 1 ? "" : "s"} were available for analysis.`,
    });
  }

  const rawTotal = dimensions.reduce((sum, d) => sum + d.points, 0);
  const rawMax = dimensions.reduce((sum, d) => sum + d.max, 0);
  let normalised = Math.round((rawTotal / rawMax) * 100);

  // Low analysis confidence pulls the headline score toward the middle rather
  // than presenting an uncertain result as a precise one.
  if (confidence.level === "low") normalised = Math.round(normalised * 0.9);

  return { total: Math.max(0, Math.min(100, normalised)), dimensions };
}

export function calculateConfidence(input: {
  ingredients: MatchedIngredient[];
  ocrConfidence: number | null;
  sectionFound: boolean;
}): ConfidenceResult {
  const { ingredients, ocrConfidence, sectionFound } = input;
  if (ingredients.length === 0)
    return {
      value: 0,
      level: "low",
      note: "No ingredients could be read from the input.",
    };

  const avgMatch =
    ingredients.reduce((sum, i) => sum + i.confidence, 0) / ingredients.length;
  const ocrFactor = ocrConfidence === null ? 0.95 : Math.max(0.4, ocrConfidence);
  const sectionFactor = sectionFound ? 1 : 0.85;
  const value = Number((avgMatch * ocrFactor * sectionFactor).toFixed(2));
  const level = value >= 0.8 ? "high" : value >= 0.6 ? "medium" : "low";

  return {
    value,
    level,
    note:
      level === "high"
        ? "Ingredients were matched clearly and the text was read reliably."
        : level === "medium"
          ? "Most ingredients were matched, but some entries are worth checking against the pack."
          : "Please verify these ingredients manually — the text or the matches are uncertain.",
  };
}

export function buildVerdict(input: {
  score: number;
  nova: NovaResult;
  flags: AnalysisFlag[];
  confidence: ConfidenceResult;
}): string {
  const { score, nova, flags, confidence } = input;
  const attention = flags.filter((f) => f.severity === "attention").length;
  const base =
    score >= 80
      ? "A clear label with few things worth reviewing."
      : score >= 60
        ? "Generally understandable label with some ingredients worth reviewing."
        : score >= 40
          ? "Readable label, but several processing and additive indicators are present."
          : "A heavily formulated label with many things worth understanding before you buy.";

  const processing =
    nova.novaClass === 4
      ? " Processing level is high."
      : nova.novaClass === 3
        ? " Processing level is moderate."
        : " Processing level is low.";

  const caveat =
    confidence.level === "low"
      ? " Confidence is low, so please double-check the pack."
      : attention > 0
        ? ` ${attention} finding${attention > 1 ? "s are" : " is"} worth knowing about.`
        : "";

  return base + processing + caveat;
}
