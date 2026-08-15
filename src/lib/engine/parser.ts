import type { ParsedIngredient } from "./types";

/** OCR noise cleanup — never destructive enough to change ingredient meaning. */
export function cleanOcrText(input: string): string {
  return input
    .replace(/\r/g, "\n")
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[·•∙]/g, ",")
    .replace(/\bl\s?NS\b/gi, "INS")
    .replace(/\bINS[.:]?\s*/gi, "INS ")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const INGREDIENT_HEADERS =
  /(ingredients?|composition|ingredient\s+list)\s*[:\-—]/i;
const STOP_SECTIONS =
  /(nutrition(al)?\s+(information|facts)|allergen\s+(information|advice)|contains\b|may\s+contain\b|best\s+before|store\s+in|manufactured\s+by|marketed\s+by|net\s+(wt|weight)|fssai\s+lic)/i;

/** Detects the likely ingredient-list region inside a block of label text. */
export function extractIngredientSection(text: string): {
  section: string;
  found: boolean;
  mayContain: string[];
} {
  const cleaned = cleanOcrText(text);
  const mayContain: string[] = [];
  const mayMatch = cleaned.match(
    /(may\s+contain[^.;]*|contains\s*[:]?[^.;]*allergen[^.;]*)/gi,
  );
  if (mayMatch) mayContain.push(...mayMatch.map((m) => m.trim()));

  const headerMatch = cleaned.match(INGREDIENT_HEADERS);
  let section = cleaned;
  let found = false;

  if (headerMatch && headerMatch.index !== undefined) {
    section = cleaned.slice(headerMatch.index + headerMatch[0].length);
    found = true;
  }

  const stop = section.match(STOP_SECTIONS);
  if (stop && stop.index !== undefined && stop.index > 12) {
    section = section.slice(0, stop.index);
  }

  section = section.trim().replace(/[.;]\s*$/, "");
  if (!found) found = section.split(",").length >= 2;
  return { section, found, mayContain };
}

/** Splits on top-level commas only, so parentheses stay intact. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(" || char === "[") depth++;
    if (char === ")" || char === "]") depth = Math.max(0, depth - 1);
    if ((char === "," || char === ";") && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter((p) => p.length > 1);
}

const CLASS_NAMES = [
  "emulsifier",
  "stabilizer",
  "stabiliser",
  "thickener",
  "preservative",
  "antioxidant",
  "acidity regulator",
  "acidulant",
  "raising agent",
  "anticaking agent",
  "anti-caking agent",
  "flavour enhancer",
  "flavor enhancer",
  "humectant",
  "sweetener",
  "artificial sweetener",
  "colour",
  "color",
  "artificial colour",
  "natural colour",
  "flavouring",
  "flavour",
  "flavoring",
  "flavor",
  "firming agent",
  "sequestrant",
  "glazing agent",
  "bulking agent",
  "fortifying agent",
  "processing aid",
];

function titleCase(value: string): string {
  return value
    .split(" ")
    .map((w) =>
      w.length > 2 && w === w.toLowerCase()
        ? w.charAt(0).toUpperCase() + w.slice(1)
        : w,
    )
    .join(" ");
}

function parseSingle(raw: string): ParsedIngredient {
  const original = raw.trim();
  let working = original;

  // percentage
  let percentage: number | null = null;
  const pct = working.match(/(\d+(?:\.\d+)?)\s?%/);
  if (pct?.[1]) percentage = Number(pct[1]);
  working = working.replace(/\(?\s*\d+(?:\.\d+)?\s?%\s*\)?/g, " ").trim();

  // class name prefix, e.g. "Emulsifier (Lecithin - INS 322)"
  let categoryHint: string | null = null;
  const lower = working.toLowerCase();
  for (const cls of CLASS_NAMES) {
    if (lower.startsWith(cls)) {
      categoryHint = titleCase(cls);
      break;
    }
  }

  // inner content of the first parenthesis group
  const inner = working.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/);
  const innerText = inner?.[1]?.trim() ?? "";
  const outerText = working.replace(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, "").trim();

  // INS / E number, from anywhere in the entry
  const insMatch = working.match(
    /\b(?:INS|E)\s*[-.]?\s*(\d{3}\s?\(?[a-zA-Z]{0,3}\)?(?:\([iv]+\))?)/i,
  );
  const bareNumber =
    !insMatch && categoryHint
      ? working.match(/\b(\d{3}(?:\s?\([iv]+\))?[a-z]?)\b/i)
      : null;
  const insNumber = (insMatch?.[1] ?? bareNumber?.[1] ?? null)
    ?.replace(/\s+/g, "")
    .toLowerCase() ?? null;

  // Candidate display name: prefer a named substance over a bare class name
  const candidates: string[] = [];
  if (innerText) {
    for (const chunk of innerText.split(/[-–—/]|,/)) {
      const c = chunk
        .replace(/\b(?:INS|E)\s*[-.]?\s*\d{3}[^,]*/gi, "")
        .replace(/[^A-Za-z0-9()\s.'-]/g, " ")
        .trim();
      if (c.length > 2 && !/^\d+$/.test(c)) candidates.push(c);
    }
  }
  if (outerText.length > 2) candidates.push(outerText);

  const preferred =
    candidates.find(
      (c) => !CLASS_NAMES.includes(c.toLowerCase()) && !/^\d/.test(c),
    ) ??
    candidates[0] ??
    outerText ??
    original;

  const displayName = titleCase(
    preferred
      .replace(/\s{2,}/g, " ")
      .replace(/^[-–—\s]+|[-–—\s]+$/g, "")
      .trim(),
  );

  // Compound ingredient children: "Chocolate (sugar, cocoa butter, milk solids)"
  const children: ParsedIngredient[] =
    innerText && innerText.includes(",") && !insNumber
      ? splitTopLevel(innerText).map((c) => parseSingle(c))
      : [];

  return {
    raw: original,
    displayName: displayName || original,
    insNumber,
    categoryHint,
    percentage,
    children,
  };
}

/**
 * Parses an ingredient declaration into structured ingredients.
 * Handles comma separation, nested parentheses, class names, INS/E numbers,
 * percentages and compound ingredients.
 */
export function parseIngredients(text: string): {
  ingredients: ParsedIngredient[];
  sectionFound: boolean;
  mayContain: string[];
  section: string;
} {
  const { section, found, mayContain } = extractIngredientSection(text);
  const ingredients = splitTopLevel(section)
    .map((entry) => parseSingle(entry))
    .filter((i) => i.displayName.length > 1);
  return { ingredients, sectionFound: found, mayContain, section };
}
