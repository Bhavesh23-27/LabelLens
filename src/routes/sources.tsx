import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Fingerprint,
  GraduationCap,
  Microscope,
  Scale,
  ShieldCheck,
} from "lucide-react";

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
      { title: "Data Sources & Methodology — LabelLens" },
      {
        name: "description",
        content:
          "How LabelLens works: NOVA food-processing classification, FSSAI regulatory rules, deterministic matching, and confidence scoring — all with full source traceability.",
      },
      { property: "og:title", content: "Data Sources & Methodology — LabelLens" },
      {
        property: "og:description",
        content:
          "Full traceability for the ingredient and food-safety knowledge base behind LabelLens.",
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

function MethodologyCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function Citation({
  label,
  reference,
  href,
}: {
  label: string;
  reference: string;
  href?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-4">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{reference}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View source
        </a>
      ) : null}
    </div>
  );
}

function SourcesPage() {
  const { data } = useSuspenseQuery(sourcesQuery);
  const verifiedSources = data.sources.filter((s) => !s.is_seed_data);
  const seedSources = data.sources.filter((s) => s.is_seed_data);

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Transparency</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Data sources & methodology</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          LabelLens is built on two independent, publicly documented systems: a food-processing
          classification (NOVA) and a food-additive regulatory framework (FSSAI). Every claim is tied to a
          source, and every limitation is shown, not hidden.
        </p>

        {/* Core credibility statement */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="panel p-5 text-center">
            <Microscope className="mx-auto size-6 text-primary" />
            <p className="mt-3 font-display font-semibold">Deterministic analysis</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The same ingredient text always produces the same result.
            </p>
          </div>
          <div className="panel p-5 text-center">
            <ShieldCheck className="mx-auto size-6 text-primary" />
            <p className="mt-3 font-display font-semibold">Source-traceable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              FSSAI rules and NOVA markers are referenced on every report.
            </p>
          </div>
          <div className="panel p-5 text-center">
            <Scale className="mx-auto size-6 text-primary" />
            <p className="mt-3 font-display font-semibold">Confidence-aware</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We say when we are uncertain instead of guessing.
            </p>
          </div>
        </section>

        {/* Methodology */}
        <section className="mt-14" aria-labelledby="methodology">
          <h2 id="methodology" className="flex items-center gap-2 font-display text-2xl font-semibold">
            <GraduationCap className="size-5 text-primary" aria-hidden="true" />
            How LabelLens decides
          </h2>
          <p className="mt-2 text-muted-foreground">
            A result is not an opinion. It is the output of a fixed pipeline.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <MethodologyCard icon={Fingerprint} title="1. Match the ingredient">
              <p>
                We try to match each label entry in order: by its INS/E number, by an official alias, by
                its canonical name, and finally by a conservative fuzzy text comparison. If none match,
                the ingredient is marked as unknown — never silently replaced.
              </p>
            </MethodologyCard>
            <MethodologyCard icon={BookOpen} title="2. Look up FSSAI rules">
              <p>
                Matched ingredients are checked against our FSSAI rule table. Each rule records whether
                the substance is permitted, permitted under conditions, restricted, or not permitted, plus
                the regulation reference and last verification date.
              </p>
            </MethodologyCard>
            <MethodologyCard icon={Microscope} title="3. Classify processing (NOVA)">
              <p>
                NOVA classifies foods by the type and purpose of processing, not by nutrient content. We
                use documented NOVA markers — industrial additives, cosmetic ingredients, and refined
                processing steps — to place a product in group 1, 2, 3 or 4.
              </p>
            </MethodologyCard>
            <MethodologyCard icon={Database} title="4. Compute confidence and score">
              <p>
                Confidence depends on how the ingredient was matched, whether the OCR text was clear, and
                whether the full ingredients block was found. The Insight Score combines transparency,
                processing, and regulatory signals into a single 0–100 number.
              </p>
            </MethodologyCard>
          </div>
        </section>

        {/* Citations */}
        <section className="mt-14" aria-labelledby="citations">
          <h2 id="citations" className="flex items-center gap-2 font-display text-2xl font-semibold">
            <FileText className="size-5 text-primary" aria-hidden="true" />
            What we cite
          </h2>
          <p className="mt-2 text-muted-foreground">
            These are the authoritative references behind the classifications.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Citation
              label="NOVA food classification"
              reference="Monteiro CA, Cannon G, Levy RB, et al. Ultra-processed foods: what they are and how to identify them. Public Health Nutrition, 2019;22(5):936-941."
              href="https://www.cambridge.org/core/journals/public-health-nutrition/article/ultraprocessed-foods-what-they-are-and-how-to-identify-them/6F2A7738A32D21D380D9D78C47F4F3A4"
            />
            <Citation
              label="FSSAI food additives rules"
              reference="Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 — including schedules for colours, flavours, emulsifiers, preservatives and sweeteners."
              href="https://www.fssai.gov.in/regulations/"
            />
            <Citation
              label="Open Food Facts"
              reference="A collaborative, open database of food products used for barcode lookups and cross-checking ingredient lists."
              href="https://world.openfoodfacts.org/"
            />
            <Citation
              label="PAHO / WHO NOVA guidance"
              reference="Pan American Health Organization. Ultra-Processed Foods and Drink Products in Latin America: Trends, Impact on Obesity and Policy Implications. 2019."
              href="https://iris.paho.org/handle/10665.2/51669"
            />
          </div>
        </section>

        {/* Registered sources */}
        <section className="mt-14" aria-labelledby="registered-sources">
          <h2
            id="registered-sources"
            className="flex items-center gap-2 font-display text-2xl font-semibold"
          >
            <Database className="size-5 text-primary" aria-hidden="true" />
            Registered sources
          </h2>
          <p className="mt-2 text-muted-foreground">
            Records marked <StatusPill severity="attention">Seed summary</StatusPill> are structured
            summaries used to demonstrate the pipeline and must be verified against the latest official
            text before being relied on.
          </p>

          {verifiedSources.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {verifiedSources.map((source) => (
                <li key={source.id as string} className="surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{source.source_name as string}</p>
                    <StatusPill severity="neutral">{source.source_type as string}</StatusPill>
                    <StatusPill severity="verified">Verified record</StatusPill>
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
          ) : null}

          {seedSources.length > 0 ? (
            <ul className={`mt-${verifiedSources.length > 0 ? "6" : "6"} space-y-3`}>
              {seedSources.map((source) => (
                <li key={source.id as string} className="surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{source.source_name as string}</p>
                    <StatusPill severity="neutral">{source.source_type as string}</StatusPill>
                    <StatusPill severity="attention">Seed summary</StatusPill>
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
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {/* Regulatory entries */}
        <section className="mt-14" aria-labelledby="regulatory-entries">
          <h2
            id="regulatory-entries"
            className="flex items-center gap-2 font-display text-2xl font-semibold"
          >
            <Scale className="size-5 text-primary" aria-hidden="true" />
            Regulatory entries
          </h2>
          <p className="mt-2 text-muted-foreground">
            FSSAI regulation records stored in the knowledge base.
          </p>
          <ul className="mt-6 space-y-3">
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
        </section>

        {/* What we don't do */}
        <section className="mt-14" aria-labelledby="limitations">
          <h2 id="limitations" className="flex items-center gap-2 font-display text-2xl font-semibold">
            <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
            What we don't do
          </h2>
          <ul className="mt-6 space-y-3">
            <li className="surface p-4">
              <p className="font-medium">We do not give medical advice</p>
              <p className="mt-1 text-sm text-muted-foreground">
                LabelLens is a consumer information tool. It cannot diagnose, treat, or recommend diets
                for medical conditions.
              </p>
            </li>
            <li className="surface p-4">
              <p className="font-medium">We do not certify safety</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A "permitted" result means the ingredient is referenced in FSSAI rules as allowed under
                the stated conditions. It does not replace a laboratory test or an official inspection.
              </p>
            </li>
            <li className="surface p-4">
              <p className="font-medium">We do not claim to see everything</p>
              <p className="mt-1 text-sm text-muted-foreground">
                OCR can miss text, and labels can omit ingredients. The analysis is only as complete as
                the text you provide.
              </p>
            </li>
          </ul>
        </section>

        <Disclaimer className="mt-10" />
      </div>
    </PageShell>
  );
}
