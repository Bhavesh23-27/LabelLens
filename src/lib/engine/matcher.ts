import type {
  KnowledgeIngredient,
  MatchedIngredient,
  ParsedIngredient,
  RegulatoryFinding,
} from "./types";

export type AliasRow = { ingredient_id: string; alias: string };

export type KnowledgeIndex = {
  byId: Map<string, KnowledgeIngredient>;
  byAlias: Map<string, string>;
  byIns: Map<string, string>;
  rulesByIngredient: Map<string, RegulatoryFinding>;
};

const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9()\s]/g, " ")
    .replace(/\b(edible|refined|powder(ed)?|solids|extract|natural)\b/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

export function buildKnowledgeIndex(
  ingredients: KnowledgeIngredient[],
  aliases: AliasRow[],
  rules: (RegulatoryFinding & { ingredient_id: string })[],
): KnowledgeIndex {
  const byId = new Map<string, KnowledgeIngredient>();
  const byAlias = new Map<string, string>();
  const byIns = new Map<string, string>();
  const rulesByIngredient = new Map<string, RegulatoryFinding>();

  for (const ing of ingredients) {
    byId.set(ing.id, ing);
    byAlias.set(normalise(ing.canonical_name), ing.id);
    if (ing.common_name) byAlias.set(normalise(ing.common_name), ing.id);
    if (ing.scientific_name) byAlias.set(normalise(ing.scientific_name), ing.id);
    if (ing.ins_number) byIns.set(ing.ins_number.toLowerCase(), ing.id);
    if (ing.e_number)
      byIns.set(ing.e_number.toLowerCase().replace(/^e/, ""), ing.id);
  }
  for (const alias of aliases) byAlias.set(normalise(alias.alias), alias.ingredient_id);
  for (const rule of rules) {
    if (!rulesByIngredient.has(rule.ingredient_id))
      rulesByIngredient.set(rule.ingredient_id, rule);
  }
  return { byId, byAlias, byIns, rulesByIngredient };
}

/** Conservative token-overlap similarity; only used as a last resort. */
function fuzzyLookup(
  name: string,
  index: KnowledgeIndex,
): { id: string; score: number } | null {
  const target = normalise(name);
  const targetTokens = new Set(target.split(" ").filter((t) => t.length > 2));
  if (targetTokens.size === 0) return null;

  let best: { id: string; score: number } | null = null;
  for (const [alias, id] of index.byAlias) {
    const tokens = alias.split(" ").filter((t) => t.length > 2);
    if (tokens.length === 0) continue;
    let hits = 0;
    for (const token of tokens) if (targetTokens.has(token)) hits++;
    const score = hits / Math.max(tokens.length, targetTokens.size);
    if (score > (best?.score ?? 0)) best = { id, score };
  }
  return best && best.score >= 0.67 ? best : null;
}

/**
 * Normalization + knowledge-base lookup. Deterministic only: no AI is used to
 * decide identity, and an unconfident match is reported as unidentified rather
 * than guessed.
 */
export function matchIngredient(
  parsed: ParsedIngredient,
  index: KnowledgeIndex,
): MatchedIngredient {
  const attach = (
    id: string,
    matchMethod: MatchedIngredient["matchMethod"],
    confidence: number,
  ): MatchedIngredient => {
    const knowledge = index.byId.get(id) ?? null;
    return {
      parsed,
      matched: Boolean(knowledge),
      matchMethod,
      confidence: Math.min(0.99, confidence * (knowledge?.confidence ?? 1)),
      knowledge,
      regulatory: knowledge ? index.rulesByIngredient.get(id) ?? null : null,
    };
  };

  if (parsed.insNumber) {
    const byIns =
      index.byIns.get(parsed.insNumber) ??
      index.byIns.get(parsed.insNumber.replace(/\(.*\)/, ""));
    if (byIns) return attach(byIns, "ins", 0.97);
  }

  const exact = index.byAlias.get(normalise(parsed.displayName));
  if (exact) return attach(exact, "alias", 0.94);

  const rawExact = index.byAlias.get(normalise(parsed.raw));
  if (rawExact) return attach(rawExact, "alias", 0.9);

  const fuzzy = fuzzyLookup(parsed.displayName, index);
  if (fuzzy) return attach(fuzzy.id, "fuzzy", 0.62 + fuzzy.score * 0.2);

  return {
    parsed,
    matched: false,
    matchMethod: "none",
    confidence: 0.3,
    knowledge: null,
    regulatory: null,
  };
}

export function matchAll(
  parsedList: ParsedIngredient[],
  index: KnowledgeIndex,
): MatchedIngredient[] {
  const flat: ParsedIngredient[] = [];
  for (const item of parsedList) {
    if (item.children.length > 0) flat.push(...item.children);
    else flat.push(item);
  }
  const seen = new Set<string>();
  const unique = flat.filter((item) => {
    const key = normalise(item.displayName) + (item.insNumber ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.map((item) => matchIngredient(item, index));
}
