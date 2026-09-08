import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { PageShell } from "@/components/labellens/site-layout";
import { NovaBadge, StatusPill } from "@/components/labellens/status";
import { Button } from "@/components/ui/button";
import { listHistory } from "@/lib/labellens.functions";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "My Saved Label Analyses — LabelLens" },
      {
        name: "description",
        content: "Revisit every ingredient analysis you have saved, with scores, processing level and findings.",
      },
      { property: "og:title", content: "My Saved Label Analyses — LabelLens" },
      { property: "og:description", content: "Your saved LabelLens ingredient analyses in one place." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const fetchHistory = useServerFn(listHistory);
  const { data, isLoading } = useQuery({ queryKey: ["history"], queryFn: () => fetchHistory() });
  const rows = data ?? [];

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <h1 className="text-3xl font-semibold">My scans</h1>
        <p className="mt-2 text-muted-foreground">
          Saved analyses, newest first. Demo analyses are labelled so they are never mistaken for
          real scans.
        </p>

        {isLoading ? <p className="mt-8 text-sm text-muted-foreground">Loading…</p> : null}

        {!isLoading && rows.length === 0 ? (
          <div className="surface mt-8 p-6">
            <p className="font-medium">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run an analysis and choose “Save to my history”.
            </p>
            <Button asChild className="mt-4">
              <Link to="/scan">Scan a product</Link>
            </Button>
          </div>
        ) : null}

        <ul className="mt-8 space-y-3">
          {rows.map((row) => {
            const scan = row.product_scans as { product_name?: string | null; brand?: string | null } | null;
            return (
              <li key={row.id as string}>
                <Link
                  to="/analysis/$id"
                  params={{ id: row.id as string }}
                  className="surface flex items-center gap-4 p-4 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft">
                    <span className="font-display text-lg font-semibold text-primary">
                      {row.insight_score as number}
                    </span>
                    <span className="text-[0.6rem] text-muted-foreground">/100</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {scan?.product_name ?? "Unnamed product"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {scan?.brand ?? "Brand not given"} ·{" "}
                      {new Date(row.created_at as string).toLocaleDateString()}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      <NovaBadge novaClass={row.nova_class as number} />
                      {row.is_demo ? <StatusPill severity="attention">Demo</StatusPill> : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </PageShell>
  );
}
