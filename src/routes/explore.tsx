import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useState } from "react";

import { Disclaimer, PageShell } from "@/components/labellens/site-layout";
import { StatusPill, regulatoryPresentation } from "@/components/labellens/status";
import { Input } from "@/components/ui/input";
import { searchKnowledge } from "@/lib/labellens.functions";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Ingredient Index — Additives, INS Numbers & What They Do" },
      {
        name: "description",
        content:
          "Search the LabelLens ingredient knowledge base by name, INS number or category to learn what each additive does and its regulatory status.",
      },
      { property: "og:title", content: "Ingredient Index — LabelLens" },
      {
        property: "og:description",
        content: "Look up any additive or ingredient and see its function, processing relevance and referenced status.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  const search = useServerFn(searchKnowledge);
  const [query, setQuery] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["knowledge-search", query],
    queryFn: () => search({ data: { query } }),
  });

  const results = data?.ok ? data.results : [];

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-14 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Ingredient index
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Look up an ingredient or INS number
        </h1>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
          Every entry comes from the structured LabelLens knowledge base. Where verified information
          is missing, the entry says so rather than filling the gap.
        </p>

        <div className="relative mt-8 max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Lecithin, 621, sweetener, emulsifier…"
            maxLength={120}
            className="pl-9"
            aria-label="Search ingredients"
          />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {isFetching ? "Searching…" : `${results.length} entr${results.length === 1 ? "y" : "ies"}`}
        </p>

        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {results.map((row) => {
            const reg = regulatoryPresentation(row.fssai_status as string);
            return (
              <li key={row.id as string} className="surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{row.canonical_name as string}</p>
                  {row.ins_number ? (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.68rem] font-medium">
                      INS {row.ins_number as string}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(row.category as string) ?? "Category unknown"}
                  {row.common_name ? ` · also “${row.common_name as string}”` : ""}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {(row.consumer_explanation as string) ??
                    "No verified explanation is stored for this entry yet."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill severity={reg.severity}>{reg.label}</StatusPill>
                  <StatusPill severity="neutral">NOVA {String(row.nova_relevance ?? "?")}</StatusPill>
                  {row.allergen_flag ? <StatusPill severity="concern">Allergen</StatusPill> : null}
                </div>
              </li>
            );
          })}
        </ul>

        {!isFetching && results.length === 0 ? (
          <p className="surface mt-6 p-5 text-sm text-muted-foreground">
            Nothing matched that search. The ingredient may not be in the knowledge base yet — that
            does not mean it is unsafe or banned.
          </p>
        ) : null}

        <Disclaimer className="mt-10" />
      </div>
    </PageShell>
  );
}
