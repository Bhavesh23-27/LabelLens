import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AnalysisDashboard } from "@/components/labellens/analysis-dashboard";
import { PageShell } from "@/components/labellens/site-layout";
import { Button } from "@/components/ui/button";
import type { AnalysisReport } from "@/lib/engine/types";
import { getAnalysis } from "@/lib/labellens.functions";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [
      { title: "Saved Label Analysis — LabelLens" },
      {
        name: "description",
        content: "A saved LabelLens analysis: Insight Score, processing level, ingredient explanations and referenced regulatory information.",
      },
      { property: "og:title", content: "Saved Label Analysis — LabelLens" },
      { property: "og:description", content: "Full ingredient-level analysis with sources and confidence." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const { id } = useParams({ from: "/_authenticated/analysis/$id" });
  const fetchAnalysis = useServerFn(getAnalysis);
  const { data, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchAnalysis({ data: { id } }),
  });

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/saved">Back to my scans</Link>
        </Button>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading analysis…</p> : null}

        {data && !data.ok ? (
          <p className="surface p-6 text-sm text-muted-foreground">{data.message}</p>
        ) : null}

        {data && data.ok ? (
          <AnalysisDashboard
            report={(data.analysis as unknown as { report: AnalysisReport }).report}
          />
        ) : null}

      </div>
    </PageShell>
  );
}
