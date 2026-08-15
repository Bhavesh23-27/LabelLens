/**
 * Barcode lookup against the Open Food Facts public product database.
 * Server-only: keeps the outbound fetch off the browser (CORS + rate limits)
 * and normalises the response into LabelLens' own shapes.
 */
import type { NutritionFacts } from "@/lib/engine/types";

export type BarcodeLookup = {
  barcode: string;
  productName: string | null;
  brand: string | null;
  ingredientsText: string | null;
  nutrition: NutritionFacts | null;
  imageUrl: string | null;
  sourceLabel: string;
};

const OFF_ENDPOINT = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = [
  "code",
  "product_name",
  "product_name_en",
  "generic_name",
  "brands",
  "ingredients_text",
  "ingredients_text_en",
  "image_ingredients_url",
  "image_front_url",
  "nutriments",
  "serving_size",
].join(",");

function num(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function mapNutrition(nutriments: Record<string, unknown> | undefined): NutritionFacts | null {
  if (!nutriments) return null;
  const facts: NutritionFacts = {
    energy_kcal: num(nutriments["energy-kcal_100g"]),
    protein_g: num(nutriments["proteins_100g"]),
    carbohydrate_g: num(nutriments["carbohydrates_100g"]),
    total_sugars_g: num(nutriments["sugars_100g"]),
    added_sugars_g: null,
    total_fat_g: num(nutriments["fat_100g"]),
    saturated_fat_g: num(nutriments["saturated-fat_100g"]),
    trans_fat_g: num(nutriments["trans-fat_100g"]),
    fibre_g: num(nutriments["fiber_100g"]),
    sodium_mg: num(nutriments["sodium_100g"]) === null ? null : num(nutriments["sodium_100g"])! * 1000,
    salt_g: num(nutriments["salt_100g"]),
    basis: "per 100 g / 100 ml (Open Food Facts)",
  };
  const hasAny = Object.entries(facts).some(
    ([key, value]) => key !== "basis" && value !== null && value !== undefined,
  );
  return hasAny ? facts : null;
}

export async function lookupBarcodeOnOpenFoodFacts(
  barcode: string,
): Promise<
  | { ok: true; product: BarcodeLookup }
  | { ok: false; message: string }
> {
  let payload: Record<string, unknown>;
  try {
    const response = await fetch(`${OFF_ENDPOINT}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
      headers: {
        "User-Agent": "LabelLens/1.0 (ingredient analysis)",
        Accept: "application/json",
      },
    });
    if (response.status === 404) {
      return {
        ok: false,
        message:
          "That barcode isn't in the open product database yet. Photograph or paste the ingredient panel instead.",
      };
    }
    if (!response.ok) {
      return { ok: false, message: "The product database is unavailable right now. Please try again." };
    }
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, message: "Couldn't reach the product database. Please check your connection." };
  }

  const status = payload["status"];
  const product = payload["product"] as Record<string, unknown> | undefined;
  if (status !== 1 || !product) {
    return {
      ok: false,
      message:
        "No product found for that barcode. You can still photograph or paste the ingredient panel.",
    };
  }

  const ingredientsText = firstString(product["ingredients_text_en"], product["ingredients_text"]);

  return {
    ok: true,
    product: {
      barcode,
      productName: firstString(
        product["product_name_en"],
        product["product_name"],
        product["generic_name"],
      ),
      brand: firstString(product["brands"])?.split(",")[0]?.trim() ?? null,
      ingredientsText,
      nutrition: mapNutrition(product["nutriments"] as Record<string, unknown> | undefined),
      imageUrl: firstString(product["image_ingredients_url"], product["image_front_url"]),
      sourceLabel: "Open Food Facts (community product database)",
    },
  };
}
