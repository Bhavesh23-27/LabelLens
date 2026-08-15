import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  buildKnowledgeIndex,
  type KnowledgeIndex,
} from "@/lib/engine/matcher";
import type { SourceAttribution } from "@/lib/engine/types";

/**
 * Server-side publishable client. Used for the PUBLIC, read-only knowledge base
 * (ingredients, aliases, regulations, sources) which has narrow anon SELECT
 * policies. Never used for user data.
 */
export function createPublicClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers });
      },
    },
  });
}

const INGREDIENT_COLUMNS =
  "id,canonical_name,common_name,scientific_name,ins_number,e_number,category,functional_class,description,consumer_explanation,why_used,allergen_flag,allergen_group,vegetarian_status,vegan_status,processing_indicator,nova_relevance,fssai_status,risk_level,sugar_alias,confidence,source_reference,updated_at";

export type LoadedKnowledge = {
  index: KnowledgeIndex;
  sources: SourceAttribution[];
  updatedAt: string | null;
};

/** Loads the deterministic knowledge layer used by the analysis engine. */
export async function loadKnowledge(
  client: SupabaseClient,
): Promise<LoadedKnowledge> {
  const [ingredients, aliases, rules, sources] = await Promise.all([
    client.from("ingredients").select(INGREDIENT_COLUMNS),
    client.from("ingredient_aliases").select("ingredient_id,alias"),
    client
      .from("fssai_ingredient_rules")
      .select(
        "ingredient_id,permission_status,condition,maximum_level,unit,regulation_reference,source_version,last_verified_at",
      ),
    client
      .from("data_sources")
      .select(
        "source_name,source_type,source_reference,source_version,retrieved_at,license_information,is_seed_data",
      ),
  ]);

  if (ingredients.error) throw new Error(`DATABASE_UNAVAILABLE: ${ingredients.error.message}`);

  const rows = (ingredients.data ?? []) as (Record<string, unknown> & {
    updated_at: string;
  })[];
  const updatedAt =
    rows.map((r) => r.updated_at).sort().at(-1) ?? null;

  return {
    index: buildKnowledgeIndex(
      rows as never,
      (aliases.data ?? []) as never,
      (rules.data ?? []) as never,
    ),
    sources: (sources.data ?? []) as SourceAttribution[],
    updatedAt,
  };
}
