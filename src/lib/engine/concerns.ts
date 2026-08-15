import type {
  AllergenResult,
  AnalysisFlag,
  MatchedIngredient,
  NutritionFacts,
} from "./types";

const names = (list: MatchedIngredient[]) =>
  list.map((i) => i.knowledge?.canonical_name ?? i.parsed.displayName);

/**
 * Concern detection — deterministic rules only.
 * A flag means "worth understanding", never "harmful".
 */
export function detectConcerns(ingredients: MatchedIngredient[]): AnalysisFlag[] {
  const flags: AnalysisFlag[] = [];
  const known = ingredients.filter((i) => i.knowledge);
  const byCategory = (...categories: string[]) =>
    known.filter((i) => categories.includes(i.knowledge!.category));

  const sugars = known.filter((i) => i.knowledge!.sugar_alias);
  if (sugars.length > 0) {
    flags.push({
      code: "ADDED_SUGAR",
      label: "Sugar-containing ingredients found",
      detail:
        "One or more ingredients on this label are forms of sugar. Sugar can appear under several different names.",
      severity: "attention",
      ingredients: names(sugars),
    });
  }
  if (sugars.length >= 2) {
    flags.push({
      code: "MULTIPLE_SUGAR_ALIASES",
      label: "Multiple sugar-containing ingredients detected",
      detail:
        "Different names for sugar are listed separately, so the total sweetener content can be easy to miss when reading the list.",
      severity: "attention",
      ingredients: names(sugars),
    });
  }

  const sweeteners = byCategory("Artificial sweetener");
  if (sweeteners.length > 0) {
    flags.push({
      code: "ARTIFICIAL_SWEETENER",
      label: "Artificial sweetener present",
      detail:
        "This product uses a permitted high-intensity sweetener instead of, or along with, sugar.",
      severity: "neutral",
      ingredients: names(sweeteners),
    });
  }

  const colours = byCategory("Artificial colour");
  if (colours.length > 0) {
    flags.push({
      code: "COLOUR_ADDITIVE",
      label: "Colour additive present",
      detail:
        "Colours are added for appearance. Permitted synthetic colours may be used only in specified foods and within limits.",
      severity: "attention",
      ingredients: names(colours),
    });
  }

  const preservatives = byCategory("Preservative");
  if (preservatives.length > 0) {
    flags.push({
      code: "PRESERVATIVE",
      label: "Preservative present",
      detail:
        "Preservatives are used to keep food safe for longer by slowing spoilage.",
      severity: "neutral",
      ingredients: names(preservatives),
    });
  }

  const emulsifiers = byCategory("Emulsifier", "Stabilizer", "Thickener");
  if (emulsifiers.length > 0) {
    flags.push({
      code: "EMULSIFIER",
      label: "Texture ingredients present",
      detail:
        "Emulsifiers, stabilizers and thickeners keep the product smooth and stop it separating.",
      severity: "neutral",
      ingredients: names(emulsifiers),
    });
  }

  const enhancers = byCategory("Flavour enhancer");
  if (enhancers.length > 0) {
    flags.push({
      code: "FLAVOUR_ENHANCER",
      label: "Flavour enhancer present",
      detail: "Used to strengthen savoury taste. Permitted in specified foods within limits.",
      severity: "attention",
      ingredients: names(enhancers),
    });
  }

  const sodiumHeavy = known.filter((i) =>
    /salt|sodium/i.test(i.knowledge!.canonical_name),
  );
  if (sodiumHeavy.length >= 2) {
    flags.push({
      code: "HIGH_SODIUM",
      label: "Several sodium-containing ingredients",
      detail:
        "More than one ingredient contributes sodium. Check the nutrition panel for the actual amount.",
      severity: "attention",
      ingredients: names(sodiumHeavy),
    });
  }

  const additives = known.filter((i) => i.knowledge!.ins_number);
  if (additives.length >= 5) {
    flags.push({
      code: "ULTRA_PROCESSED_INDICATOR",
      label: "Many declared additives",
      detail: `${additives.length} numbered additives are declared, which points to a highly formulated product.`,
      severity: "attention",
      ingredients: names(additives),
    });
  }

  const conditional = known.filter(
    (i) =>
      i.regulatory?.permission_status === "permitted-under-conditions" ||
      i.knowledge!.fssai_status === "permitted-under-conditions",
  );
  if (conditional.length > 0) {
    flags.push({
      code: "REGULATORY_REVIEW_REQUIRED",
      label: "Conditionally permitted ingredients",
      detail:
        "These ingredients are permitted only in specified food categories and within prescribed limits. LabelLens cannot verify the actual quantity used from the label alone.",
      severity: "attention",
      ingredients: names(conditional),
    });
  }

  const allergens = known.filter((i) => i.knowledge!.allergen_flag);
  if (allergens.length > 0) {
    flags.push({
      code: "ALLERGEN",
      label: "Possible allergen source",
      detail: "One or more ingredients are common allergen sources.",
      severity: "concern",
      ingredients: names(allergens),
    });
  }

  const unknown = ingredients.filter((i) => !i.knowledge);
  if (unknown.length > 0) {
    flags.push({
      code: "UNKNOWN_INGREDIENT",
      label: "Identification uncertain",
      detail:
        "Some entries are not confidently identified in the LabelLens knowledge base. They have been queued for review rather than guessed.",
      severity: "neutral",
      ingredients: unknown.map((i) => i.parsed.displayName),
    });
  }

  const verifiedOnly = known.length > 0 && unknown.length === 0;
  if (verifiedOnly) {
    flags.push({
      code: "TRANSPARENT_LABEL",
      label: "Every ingredient was identified",
      detail:
        "All declared ingredients were matched to the knowledge base, so the label is readable end to end.",
      severity: "verified",
      ingredients: [],
    });
  }

  return flags;
}

const ALLERGEN_KEYWORDS = [
  ["milk", "Milk"],
  ["dairy", "Milk"],
  ["butter", "Milk"],
  ["cheese", "Milk"],
  ["whey", "Milk"],
  ["casein", "Milk"],
  ["wheat", "Gluten (wheat)"],
  ["maida", "Gluten (wheat)"],
  ["barley", "Gluten"],
  ["rye", "Gluten"],
  ["oats", "Gluten (oats)"],
  ["soy", "Soy"],
  ["soya", "Soy"],
  ["peanut", "Peanut"],
  ["groundnut", "Peanut"],
  ["almond", "Tree nuts"],
  ["cashew", "Tree nuts"],
  ["walnut", "Tree nuts"],
  ["pistachio", "Tree nuts"],
  ["egg", "Egg"],
  ["fish", "Fish"],
  ["prawn", "Crustacean"],
  ["shrimp", "Crustacean"],
  ["sesame", "Sesame"],
  ["mustard", "Mustard"],
  ["sulphite", "Sulphites"],
  ["sulfite", "Sulphites"],
] as const;

export function detectAllergens(
  ingredients: MatchedIngredient[],
  mayContainStatements: string[],
): AllergenResult {
  const detected = new Map<string, string>();

  for (const item of ingredients) {
    if (item.knowledge?.allergen_flag && item.knowledge.allergen_group) {
      detected.set(item.knowledge.canonical_name, item.knowledge.allergen_group);
      continue;
    }
    const haystack = `${item.parsed.raw} ${item.parsed.displayName}`.toLowerCase();
    for (const [keyword, group] of ALLERGEN_KEYWORDS) {
      if (haystack.includes(keyword)) {
        detected.set(item.parsed.displayName, group);
        break;
      }
    }
  }

  const detectedList = [...detected.entries()].map(([name, group]) => ({
    name,
    group,
  }));
  const unclear = ingredients.some((i) => !i.knowledge);

  let status: AllergenResult["status"] = "none-detected";
  if (detectedList.length > 0) status = "potential-detected";
  else if (mayContainStatements.length > 0) status = "may-contain-declared";
  else if (unclear) status = "unclear";

  return {
    status,
    detected: detectedList,
    mayContain: mayContainStatements,
    note:
      status === "potential-detected"
        ? "These findings come from the ingredient list itself. Precautionary 'may contain' statements are shown separately."
        : status === "may-contain-declared"
          ? "No allergen was identified in the ingredient list, but the label carries a precautionary statement."
          : status === "unclear"
            ? "Some ingredients were not identified, so allergen information cannot be confirmed from the label alone."
            : "No common allergen was detected in the identified ingredients. Always check the pack for the official allergen declaration.",
  };
}

/** Nutrition engine — reports only what was actually provided. */
export function analyseNutrition(
  nutrition: NutritionFacts | null,
): AnalysisFlag[] {
  if (!nutrition) return [];
  const flags: AnalysisFlag[] = [];
  const per100 = (nutrition.basis ?? "per 100 g").toLowerCase().includes("100");

  if (per100 && typeof nutrition.total_sugars_g === "number") {
    if (nutrition.total_sugars_g >= 22.5)
      flags.push({
        code: "HIGH_SUGAR",
        label: "High in total sugars",
        detail: `${nutrition.total_sugars_g} g of sugars per 100 g is in the high band used by common front-of-pack guidance.`,
        severity: "attention",
        ingredients: [],
      });
  }
  if (per100 && typeof nutrition.sodium_mg === "number") {
    if (nutrition.sodium_mg >= 600)
      flags.push({
        code: "HIGH_SODIUM",
        label: "High in sodium",
        detail: `${nutrition.sodium_mg} mg of sodium per 100 g is in the high band used by common front-of-pack guidance.`,
        severity: "attention",
        ingredients: [],
      });
  }
  if (per100 && typeof nutrition.saturated_fat_g === "number") {
    if (nutrition.saturated_fat_g >= 5)
      flags.push({
        code: "HIGH_SATURATED_FAT",
        label: "High in saturated fat",
        detail: `${nutrition.saturated_fat_g} g of saturated fat per 100 g is in the high band used by common front-of-pack guidance.`,
        severity: "attention",
        ingredients: [],
      });
  }
  if (typeof nutrition.fibre_g === "number" && nutrition.fibre_g >= 6) {
    flags.push({
      code: "GOOD_FIBRE",
      label: "Good source of fibre",
      detail: `${nutrition.fibre_g} g of fibre per 100 g is comparatively high.`,
      severity: "verified",
      ingredients: [],
    });
  }
  return flags;
}
