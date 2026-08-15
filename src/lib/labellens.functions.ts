import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnalysisReport, NutritionFacts } from "@/lib/engine/types";

/* ---------------------------------- schemas --------------------------------- */

const nutritionSchema = z
  .object({
    energy_kcal: z.number().nullable().optional(),
    protein_g: z.number().nullable().optional(),
    carbohydrate_g: z.number().nullable().optional(),
    total_sugars_g: z.number().nullable().optional(),
    added_sugars_g: z.number().nullable().optional(),
    total_fat_g: z.number().nullable().optional(),
    saturated_fat_g: z.number().nullable().optional(),
    trans_fat_g: z.number().nullable().optional(),
    fibre_g: z.number().nullable().optional(),
    sodium_mg: z.number().nullable().optional(),
    salt_g: z.number().nullable().optional(),
    basis: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const analyzeSchema = z.object({
  text: z.string().trim().min(3, "Please provide an ingredient list.").max(8000),
  method: z.enum(["image", "manual", "text", "barcode", "demo"]).default("manual"),
  productName: z.string().trim().max(160).nullable().optional(),
  brand: z.string().trim().max(160).nullable().optional(),
  ocrConfidence: z.number().min(0).max(1).nullable().optional(),
  nutrition: nutritionSchema,
  isDemo: z.boolean().default(false),
});

const ocrSchema = z.object({
  imageDataUrl: z
    .string()
    .max(9_000_000, "Image is too large. Please use an image under 6 MB.")
    .refine(
      (value) => /^data:image\/(jpe?g|png|webp);base64,/.test(value),
      "Only JPG, PNG or WEBP images are supported.",
    ),
});

const reportSchema = z.object({
  report: z.custom<AnalysisReport>(
    (value) =>
      typeof value === "object" &&
      value !== null &&
      "ingredients" in (value as object) &&
      "score" in (value as object),
    "A completed analysis is required.",
  ),
});

/* ------------------------------- OCR pipeline ------------------------------- */

export const runLabelOcr = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ocrSchema.parse(input))
  .handler(async ({ data }) => {
    const { runOcr, AiUnavailableError } = await import("@/lib/ai.server");
    try {
      const result = await runOcr(data.imageDataUrl);
      if (!result.text.trim()) {
        return {
          ok: false as const,
          code: "NO_INGREDIENT_LIST",
          message:
            "We couldn't find a clear ingredient list in that image. Try a closer photo of the ingredient panel, or paste the text instead.",
        };
      }
      return {
        ok: true as const,
        text: result.text,
        confidence: result.confidence,
        provider: result.provider,
        lowConfidence: result.confidence < 0.7,
      };
    } catch (error) {
      const message =
        error instanceof AiUnavailableError
          ? error.message
          : "Couldn't read the ingredient list clearly.";
      return { ok: false as const, code: "OCR_FAILED", message };
    }
  });

/* ------------------------------ barcode lookup ------------------------------ */

export const lookupBarcode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => barcodeSchema.parse(input))
  .handler(async ({ data }) => {
    const { lookupBarcodeOnOpenFoodFacts } = await import("@/lib/barcode.server");
    const result = await lookupBarcodeOnOpenFoodFacts(data.barcode);
    if (!result.ok) {
      return { ok: false as const, code: "BARCODE_NOT_FOUND", message: result.message };
    }
    if (!result.product.ingredientsText || result.product.ingredientsText.length < 12) {
      return {
        ok: false as const,
        code: "NO_INGREDIENT_LIST",
        message:
          "That product exists in the open database, but it has no ingredient list recorded yet. Photograph the panel instead.",
        product: result.product,
      };
    }
    return { ok: true as const, product: result.product };
  });

/* ----------------------------- analysis pipeline ---------------------------- */

export const analyzeProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => analyzeSchema.parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient, loadKnowledge } = await import("@/lib/knowledge.server");
    const { runAnalysis } = await import("@/lib/engine");
    const { extractNutritionFromText } = await import("@/lib/ai.server");

    let knowledge;
    try {
      knowledge = await loadKnowledge(createPublicClient());
    } catch {
      return {
        ok: false as const,
        code: "DATABASE_UNAVAILABLE",
        message:
          "Ingredient verification is temporarily unavailable. Please try again in a moment.",
      };
    }

    const nutrition =
      (data.nutrition as NutritionFacts | null | undefined) ??
      ((await extractNutritionFromText(data.text)) as NutritionFacts | null);

    const report = runAnalysis({
      text: data.text,
      method: data.method,
      index: knowledge.index,
      ocrConfidence: data.ocrConfidence ?? null,
      nutrition,
      productName: data.productName ?? null,
      brand: data.brand ?? null,
      sources: knowledge.sources,
      knowledgeBaseUpdatedAt: knowledge.updatedAt,
      isDemo: data.isDemo,
    });

    if (report.ingredients.length === 0) {
      return {
        ok: false as const,
        code: "NO_INGREDIENT_LIST",
        message:
          "We couldn't find a clear ingredient list in that text. Ingredients are usually separated by commas.",
      };
    }

    // Unknown-ingredient review queue (admin-managed knowledge growth).
    if (report.unknownNames.length > 0) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        for (const raw of report.unknownNames.slice(0, 25)) {
          const name = raw.toLowerCase().slice(0, 120);
          const existing = await supabaseAdmin
            .from("unknown_ingredients")
            .select("id,occurrences")
            .eq("raw_name", name)
            .maybeSingle();
          if (existing.data) {
            await supabaseAdmin
              .from("unknown_ingredients")
              .update({
                occurrences: (existing.data.occurrences ?? 1) + 1,
                last_seen_at: new Date().toISOString(),
              })
              .eq("id", existing.data.id);
          } else {
            await supabaseAdmin.from("unknown_ingredients").insert({ raw_name: name });
          }
        }
      } catch (error) {
        console.error("unknown ingredient queue failed", error);
      }
    }

    return { ok: true as const, report };
  });

export const explainReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => reportSchema.parse(input))
  .handler(async ({ data }) => {
    const { generateExplanation, AiUnavailableError } = await import("@/lib/ai.server");
    try {
      return { ok: true as const, explanation: await generateExplanation(data.report) };
    } catch (error) {
      return {
        ok: false as const,
        message:
          error instanceof AiUnavailableError
            ? error.message
            : "Plain-language explanations are unavailable right now. The verified analysis is unaffected.",
      };
    }
  });

export const askLabelLens = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    reportSchema
      .extend({ question: z.string().trim().min(3).max(500) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { answerQuestion, AiUnavailableError } = await import("@/lib/ai.server");
    try {
      return { ok: true as const, answer: await answerQuestion(data.report, data.question) };
    } catch (error) {
      return {
        ok: false as const,
        message:
          error instanceof AiUnavailableError
            ? error.message
            : "I couldn't reach the explanation service just now.",
      };
    }
  });

/* --------------------------------- search ---------------------------------- */

export const searchKnowledge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().trim().max(120).default("") }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("@/lib/knowledge.server");
    const client = createPublicClient();
    const query = data.query.trim();

    let builder = client
      .from("ingredients")
      .select(
        "id,canonical_name,common_name,ins_number,e_number,category,consumer_explanation,why_used,fssai_status,risk_level,allergen_flag,nova_relevance,confidence,source_reference",
      )
      .order("canonical_name")
      .limit(40);

    if (query.length > 0) {
      const numeric = query.replace(/[^0-9a-z()]/gi, "");
      const aliasHits = await client
        .from("ingredient_aliases")
        .select("ingredient_id")
        .ilike("alias", `%${query.toLowerCase()}%`)
        .limit(40);
      const ids = (aliasHits.data ?? []).map((row) => row.ingredient_id as string);
      const filters = [
        `canonical_name.ilike.%${query}%`,
        `common_name.ilike.%${query}%`,
        `category.ilike.%${query}%`,
        `ins_number.eq.${numeric}`,
        ids.length > 0 ? `id.in.(${ids.join(",")})` : null,
      ].filter(Boolean) as string[];
      builder = builder.or(filters.join(","));
    }

    const { data: rows, error } = await builder;
    if (error) return { ok: false as const, message: "Search is temporarily unavailable." };
    return { ok: true as const, results: rows ?? [] };
  });

export const getIngredientDetail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("@/lib/knowledge.server");
    const client = createPublicClient();
    const [ingredient, aliases, rules] = await Promise.all([
      client.from("ingredients").select("*").eq("id", data.id).maybeSingle(),
      client.from("ingredient_aliases").select("alias,alias_type").eq("ingredient_id", data.id),
      client
        .from("fssai_ingredient_rules")
        .select("*, fssai_regulations(regulation_name,regulation_number,section,permitted_condition,applicable_food_category,source_reference,source_version)")
        .eq("ingredient_id", data.id),
    ]);
    if (!ingredient.data) return { ok: false as const, message: "Ingredient not found." };
    return {
      ok: true as const,
      ingredient: ingredient.data,
      aliases: aliases.data ?? [],
      rules: rules.data ?? [],
    };
  });

export const listRegulations = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("@/lib/knowledge.server");
  const client = createPublicClient();
  const [regs, sources] = await Promise.all([
    client.from("fssai_regulations").select("*").order("regulation_name").limit(200),
    client.from("data_sources").select("*").order("source_name"),
  ]);
  return { regulations: regs.data ?? [], sources: sources.data ?? [] };
});

/* --------------------------- history (authenticated) ------------------------ */

export const saveAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    reportSchema
      .extend({
        productName: z.string().trim().max(160).nullable().optional(),
        brand: z.string().trim().max(160).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const report = data.report;

    const scan = await supabase
      .from("product_scans")
      .insert({
        user_id: userId,
        product_name: data.productName ?? report.input.productName,
        brand: data.brand ?? report.input.brand,
        input_method: report.input.method,
        extracted_text: report.input.rawText,
        ocr_confidence: report.input.ocrConfidence,
        is_demo: report.isDemo,
      })
      .select("id")
      .single();

    if (scan.error) throw new Error(scan.error.message);

    const analysis = await supabase
      .from("analysis_results")
      .insert({
        scan_id: scan.data.id,
        user_id: userId,
        insight_score: report.score.total,
        nova_class: report.nova.novaClass,
        verdict: report.verdict,
        confidence: report.confidence.value,
        ingredient_count: report.ingredients.length,
        additive_count: report.ingredients.filter((i) => i.knowledge?.ins_number).length,
        report: JSON.parse(JSON.stringify(report)),
        flags: JSON.parse(JSON.stringify(report.flags)),
        nutrition: report.nutrition ? JSON.parse(JSON.stringify(report.nutrition)) : null,

        ai_explanation: report.aiExplanation,
        is_demo: report.isDemo,
      })
      .select("id")
      .single();

    if (analysis.error) throw new Error(analysis.error.message);
    return { id: analysis.data.id as string };
  });

export const listHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("analysis_results")
      .select(
        "id,insight_score,nova_class,verdict,confidence,ingredient_count,additive_count,flags,is_demo,created_at,product_scans(product_name,brand,input_method)",
      )
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("analysis_results")
      .select("*, product_scans(product_name,brand,input_method,created_at)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { ok: false as const, message: "Analysis not found." };
    return { ok: true as const, analysis: row };
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("analysis_results")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ---------------------------------- admin ---------------------------------- */

async function assertAdmin(context: { supabase: { rpc: Function }; userId: string }) {
  const { data } = await (context.supabase.rpc as Function)("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden: administrator access required.");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [scans, analyses, ingredients, unknowns, freshness] = await Promise.all([
      supabaseAdmin.from("product_scans").select("id,input_method,ocr_confidence,is_demo"),
      supabaseAdmin.from("analysis_results").select("insight_score,nova_class,confidence,flags,ingredient_count"),
      supabaseAdmin.from("ingredients").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("unknown_ingredients")
        .select("*")
        .order("occurrences", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("ingredients")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    const scanRows = scans.data ?? [];
    const analysisRows = (analyses.data ?? []) as {
      insight_score: number | null;
      nova_class: number | null;
      confidence: number | null;
      flags: { code: string }[] | null;
      ingredient_count: number | null;
    }[];

    const flagCounts = new Map<string, number>();
    for (const row of analysisRows) {
      for (const flag of row.flags ?? []) {
        flagCounts.set(flag.code, (flagCounts.get(flag.code) ?? 0) + 1);
      }
    }

    return {
      totalScans: scanRows.length,
      imageScans: scanRows.filter((s) => s.input_method === "image").length,
      manualScans: scanRows.filter((s) => s.input_method === "manual").length,
      demoScans: scanRows.filter((s) => s.is_demo).length,
      lowConfidenceScans: scanRows.filter(
        (s) => typeof s.ocr_confidence === "number" && s.ocr_confidence < 0.7,
      ).length,
      totalAnalyses: analysisRows.length,
      averageScore:
        analysisRows.length > 0
          ? Math.round(
              analysisRows.reduce((sum, r) => sum + (r.insight_score ?? 0), 0) /
                analysisRows.length,
            )
          : null,
      lowConfidenceAnalyses: analysisRows.filter(
        (r) => typeof r.confidence === "number" && r.confidence < 0.6,
      ).length,
      novaDistribution: [1, 2, 3, 4].map((cls) => ({
        novaClass: cls,
        count: analysisRows.filter((r) => r.nova_class === cls).length,
      })),
      topFlags: [...flagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([code, count]) => ({ code, count })),
      ingredientCount: ingredients.count ?? 0,
      unknownQueue: unknowns.data ?? [],
      knowledgeBaseUpdatedAt: freshness.data?.[0]?.updated_at ?? null,
    };
  });

export const adminSaveIngredient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        canonical_name: z.string().trim().min(2).max(160),
        common_name: z.string().trim().max(160).nullable().optional(),
        ins_number: z.string().trim().max(20).nullable().optional(),
        category: z.string().trim().min(2).max(80),
        why_used: z.string().trim().max(400).nullable().optional(),
        consumer_explanation: z.string().trim().max(800).nullable().optional(),
        fssai_status: z.enum([
          "permitted",
          "permitted-under-conditions",
          "restricted",
          "not-permitted",
          "unknown",
          "not-applicable",
        ]),
        allergen_flag: z.boolean().default(false),
        sugar_alias: z.boolean().default(false),
        nova_relevance: z.number().int().min(1).max(4).default(1),
        source_reference: z.string().trim().max(300).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...fields } = data;
    const payload: Record<string, unknown> = { is_seed_data: false };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) payload[key] = value;
    }
    const result = id
      ? await supabaseAdmin.from("ingredients").update(payload as never).eq("id", id)
      : await supabaseAdmin.from("ingredients").insert(payload as never);

    if (result.error) throw new Error(result.error.message);
    return { ok: true as const };
  });

export const adminResolveUnknown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "reviewed", "added", "ignored"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("unknown_ingredients")
      .update({ status: data.status, reviewed_by: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });
