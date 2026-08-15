import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { PageShell } from "@/components/labellens/site-layout";
import { StatusPill } from "@/components/labellens/status";
import { adminOverview } from "@/lib/labellens.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Knowledge Base Admin — LabelLens" },
      {
        name: "description",
        content: "Administrator view of the LabelLens knowledge base: coverage, unmatched ingredients and analysis quality metrics.",
      },
      { property: "og:title", content: "Knowledge Base Admin — LabelLens" },
      { property: "og:description", content: "Coverage, review queue and quality metrics for the LabelLens knowledge base." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const overview = useServerFn(adminOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => overview(),
    retry: false,
  });

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <h1 className="text-3xl font-semibold">Knowledge base admin</h1>
        <p className="mt-2 text-muted-foreground">
          Administrator-only view. Ingredients that could not be matched are queued here so the
          knowledge base grows from real labels instead of guesses.
        </p>

        {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Loading…</p> : null}
        {error ? (
          <p className="surface mt-8 p-5 text-sm text-muted-foreground">
            This page requires administrator access.
          </p>
        ) : null}

        {data ? (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Scans", data.stats.scans],
                ["Analyses", data.stats.analyses],
                ["Ingredients in KB", data.stats.ingredients],
                ["Unmatched queue", data.stats.unknowns],
                ["Avg Insight Score", data.stats.averageScore],
                ["Avg confidence", `${Math.round((data.stats.averageConfidence ?? 0) * 100)}%`],
              ].map(([label, value]) => (
                <div key={String(label)} className="surface p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-2 font-display text-2xl font-semibold">{String(value)}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-12 font-display text-xl font-semibold">Review queue</h2>
            <ul className="mt-4 space-y-2">
              {data.unknowns.length === 0 ? (
                <li className="surface p-4 text-sm text-muted-foreground">
                  Nothing awaiting review.
                </li>
              ) : null}
              {data.unknowns.map((row) => (
                <li key={row.id as string} className="surface flex items-center justify-between gap-3 p-4">
                  <span>
                    <span className="font-medium">{row.raw_name as string}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      seen {String(row.occurrences ?? 1)}×
                    </span>
                  </span>
                  <StatusPill severity={row.status === "resolved" ? "verified" : "attention"}>
                    {(row.status as string) ?? "pending"}
                  </StatusPill>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
