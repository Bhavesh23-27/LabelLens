/**
 * LabelLens analysis engine — shared types.
 *
 * The engine is deliberately split into independent modules that mirror the
 * project block diagram:
 *   input -> preprocessing -> OCR -> parser -> normalization -> knowledge base
 *   -> regulatory engine -> NOVA engine -> nutrition engine -> concern detection
 *   -> confidence engine -> AI explanation -> report
 */

export type ParsedIngredient = {
  /** Text exactly as it appeared on the label. */
  raw: string;
  /** Cleaned display name, e.g. "Lecithin". */
  displayName: string;
  /** INS / E number if declared, e.g. "322". */
  insNumber: string | null;
  /** Class name declared on the label, e.g. "Emulsifier". */
  categoryHint: string | null;
  /** Declared percentage, e.g. 12.5 for "Sugar (12.5%)". */
  percentage: number | null;
  /** Sub-ingredients of a compound ingredient. */
  children: ParsedIngredient[];
};

export type KnowledgeIngredient = {
  id: string;
  canonical_name: string;
  common_name: string | null;
  scientific_name: string | null;
  ins_number: string | null;
  e_number: string | null;
  category: string;
  functional_class: string | null;
  description: string | null;
  consumer_explanation: string | null;
  why_used: string | null;
  allergen_flag: boolean;
  allergen_group: string | null;
  vegetarian_status: string;
  vegan_status: string;
  processing_indicator: string;
  nova_relevance: number;
  fssai_status: string;
  risk_level: string;
  sugar_alias: boolean;
  confidence: number;
  source_reference: string | null;
};

export type RegulatoryFinding = {
  permission_status: string;
  condition: string | null;
  maximum_level: number | null;
  unit: string | null;
  regulation_reference: string | null;
  source_version: string | null;
  last_verified_at: string | null;
};

export type MatchedIngredient = {
  parsed: ParsedIngredient;
  matched: boolean;
  matchMethod: "ins" | "alias" | "canonical" | "fuzzy" | "none";
  confidence: number;
  knowledge: KnowledgeIngredient | null;
  regulatory: RegulatoryFinding | null;
};

export type FlagSeverity = "verified" | "attention" | "concern" | "neutral";

export type AnalysisFlag = {
  code: string;
  label: string;
  detail: string;
  severity: FlagSeverity;
  ingredients: string[];
};

export type NovaResult = {
  novaClass: 1 | 2 | 3 | 4;
  label: string;
  plainLanguage: string;
  reasons: string[];
  caveat: string;
};

export type ScoreDimension = {
  label: string;
  points: number;
  max: number;
  note: string;
};

export type ScoreResult = {
  total: number;
  dimensions: ScoreDimension[];
};

export type AllergenResult = {
  status:
    | "none-detected"
    | "potential-detected"
    | "unclear"
    | "may-contain-declared";
  detected: { name: string; group: string }[];
  mayContain: string[];
  note: string;
};

export type NutritionFacts = {
  energy_kcal?: number | null;
  protein_g?: number | null;
  carbohydrate_g?: number | null;
  total_sugars_g?: number | null;
  added_sugars_g?: number | null;
  total_fat_g?: number | null;
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  fibre_g?: number | null;
  sodium_mg?: number | null;
  salt_g?: number | null;
  basis?: string | null;
};

export type ConfidenceResult = {
  value: number;
  level: "high" | "medium" | "low";
  note: string;
};

export type SourceAttribution = {
  source_name: string;
  source_type: string;
  source_reference: string | null;
  source_version: string | null;
  retrieved_at: string | null;
  license_information: string | null;
  is_seed_data: boolean;
};

export type AnalysisReport = {
  input: {
    method: "image" | "manual" | "text" | "barcode" | "demo";
    rawText: string;
    ocrConfidence: number | null;
    productName: string | null;
    brand: string | null;
  };
  ingredients: MatchedIngredient[];
  unknownNames: string[];
  nova: NovaResult;
  flags: AnalysisFlag[];
  score: ScoreResult;
  allergens: AllergenResult;
  nutrition: NutritionFacts | null;
  nutritionFindings: AnalysisFlag[];
  confidence: ConfidenceResult;
  verdict: string;
  sources: SourceAttribution[];
  knowledgeBaseUpdatedAt: string | null;
  isDemo: boolean;
  generatedAt: string;
  aiExplanation: string | null;
  aiUnavailableReason: string | null;
};
