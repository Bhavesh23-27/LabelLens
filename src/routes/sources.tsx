import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Disclaimer, PageShell } from "@/components/labellens/site-layout";
import { StatusPill } from "@/components/labellens/status";
import { listRegulations } from "@/lib/labellens.functions";

const sourcesQuery = queryOptions({
  queryKey: ["regulations"],
  queryFn: () => listRegulations(),
});

export const Route = createFileRoute("/sources")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sourcesQuery),
  head: () => ({
    meta: [
      { title: "Data Sources & Regulatory References — LabelLens" },
      {
        name: "description",
        content:
          "Every regulatory statement in LabelLens is traceable: source name, reference, version, retrieval date and licence information.",
      },
      { property: "og:title", content: "Data Sources & Regulatory References — LabelLens" },
      {
        property: "og:description",
        content: "Full traceability for the ingredient and food-safety knowledge base behind LabelLens.",
      },
    ],
  }),
  errorComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Sources couldn't be loaded</h1>
        <p className="mt-2 text-muted-foreground">
          The knowledge base is temporarily unavailable. Please try again shortly.
        </p>
      </div>
    </PageShell>
  ),
  component: SourcesPage,
});

function SourcesPage() {
  const { data } = useSuspenseQuery(sourcesQuery);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Transparency
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Data sources</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          LabelLens only makes regulatory statements it can attribute. Records marked as seed data
          are structured summaries used to demonstrate the pipeline and must be verified against the
          latest official text before being relied on.
        </p>

        <h2 className="mt-12 font-display text-xl font-semibold">Registered sources</h2>
        <ul className="mt-4 space-y-3">
          {data.sources.map((source) => (
            <li key={source.id as string} className="surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{source.source_name as string}</p>
                <StatusPill severity="neutral">{source.source_type as string}</StatusPill>
                {source.is_seed_data ? (
                  <StatusPill severity="attention">Seed summary</StatusPill>
                ) : (
                  <StatusPill severity="verified">Verified record</StatusPill>
                )}
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                <div>
                  <dt className="font-semibold">Reference</dt>
                  <dd>{(source.source_reference as string) ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Version</dt>
                  <dd>{(source.source_version as string) ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Retrieved</dt>
                  <dd>
                    {source.retrieved_at
                      ? new Date(source.retrieved_at as string).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Licence</dt>
                  <dd>{(source.license_information as string) ?? "—"}</dd>
                </div>
              </dl>
              {source.notes ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {source.notes as string}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-xl font-semibold">Regulatory entries</h2>
        <ul className="mt-4 space-y-3">
          {data.regulations.map((reg) => (
            <li key={reg.id as string} className="surface p-4">
              <p className="font-medium">{reg.regulation_name as string}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(reg.regulation_number as string) ?? "—"}
                {reg.section ? ` · ${reg.section as string}` : ""}
              </p>
              {reg.summary ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {reg.summary as string}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {(reg.source_reference as string) ?? "Reference unavailable"}
                {reg.source_version ? ` · ${reg.source_version as string}` : ""}
              </p>
            </li>
          ))}
        </ul>

        <Disclaimer className="mt-10" />
      </div>
    </PageShell>
  );
}
