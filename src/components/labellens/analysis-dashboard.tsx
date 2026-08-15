import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  FlaskConical,
  Info,
  MessageCircleQuestion,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { ConsumerReport } from "@/components/labellens/consumer-report";
import { ScoreRing } from "@/components/labellens/score-ring";
import {
  ConfidenceBadge,
  NovaBadge,
  StatusPill,
  regulatoryPresentation,
} from "@/components/labellens/status";
import { Disclaimer } from "@/components/labellens/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { askLabelLens } from "@/lib/labellens.functions";
import type { AnalysisReport, MatchedIngredient } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

function Card({
  title,
  value,
  hint,
  children,
}: {
  title: string;
  value?: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      {value ? <p className="mt-2 font-display text-2xl font-semibold">{value}</p> : null}
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}

function IngredientRow({ item }: { item: MatchedIngredient }) {
  const [open, setOpen] = useState(false);
  const knowledge = item.knowledge;
  const reg = regulatoryPresentation(item.regulatory?.permission_status ?? knowledge?.fssai_status);
  const confidenceLevel =
    item.confidence >= 0.8 ? "high" : item.confidence >= 0.6 ? "medium" : "low";

  return (
    <li className="overflow-hidden border-b border-border/70 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {knowledge?.canonical_name ?? item.parsed.displayName}
            </span>
            {item.parsed.insNumber ? (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[0.68rem] font-medium text-secondary-foreground">
                INS {item.parsed.insNumber}
              </span>
            ) : null}
            {!knowledge ? <StatusPill severity="neutral">Identification uncertain</StatusPill> : null}
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            {knowledge?.category ?? item.parsed.categoryHint ?? "Category unknown"}
            {item.parsed.percentage !== null ? ` · ${item.parsed.percentage}% declared` : ""}
          </span>
        </span>
        <StatusPill severity={reg.severity} className="hidden sm:inline-flex">
          {reg.label}
        </StatusPill>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="animate-rise space-y-4 bg-secondary/30 px-4 pb-5 pt-1 text-sm">
          <p className="text-xs text-muted-foreground">
            On the label: “{item.parsed.raw}”
          </p>
          <div>
            <p className="font-display font-semibold">What does it do?</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {knowledge?.consumer_explanation ??
                "LabelLens does not yet hold a verified explanation for this entry. It has been queued for review instead of guessed."}
            </p>
          </div>
          {knowledge?.why_used ? (
            <div>
              <p className="font-display font-semibold">Why is this used?</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">{knowledge.why_used}</p>
            </div>
          ) : null}
          <div>
            <p className="font-display font-semibold">Verified information</p>
            <div className="mt-2 space-y-2 rounded-lg border border-border bg-card p-3">
              <StatusPill severity={reg.severity}>{reg.label}</StatusPill>
              <p className="text-xs leading-relaxed text-muted-foreground">{reg.plain}</p>
              {item.regulatory?.condition ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Condition: {item.regulatory.condition}
                </p>
              ) : null}
              {item.regulatory?.regulation_reference ? (
                <dl className="grid gap-1 text-[0.7rem] text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Regulation reference</dt>
                    <dd>{item.regulatory.regulation_reference}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Source version</dt>
                    <dd>{item.regulatory.source_version ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Last verified</dt>
                    <dd>
                      {item.regulatory.last_verified_at
                        ? new Date(item.regulatory.last_verified_at).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Data source</dt>
                    <dd>{knowledge?.source_reference ?? "LabelLens knowledge base"}</dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill severity="neutral">
              Processing relevance: NOVA {knowledge?.nova_relevance ?? "?"}
            </StatusPill>
            <ConfidenceBadge level={confidenceLevel} />
            <StatusPill severity="neutral">Matched by: {item.matchMethod}</StatusPill>
            {knowledge?.allergen_flag ? (
              <StatusPill severity="concern">
                Allergen: {knowledge.allergen_group ?? "see pack"}
              </StatusPill>
            ) : null}
          </div>
          {confidenceLevel === "low" ? (
            <p className="text-xs text-attention-foreground">
              Please verify this ingredient manually against the pack.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function AskPanel({ report }: { report: AnalysisReport }) {
  const ask = useServerFn(askLabelLens);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ q: string; a: string }[]>([]);

  const mutation = useMutation({
    mutationFn: async (q: string) => ask({ data: { report, question: q } }),
    onSuccess: (result, q) => {
      setThread((prev) => [
        ...prev,
        { q, a: result.ok ? result.answer : result.message },
      ]);
      setQuestion("");
    },
  });

  const suggestions = [
    "Which ingredients should I pay attention to?",
    "Is this product highly processed?",
    "Why is this sweetener used?",
  ];

  return (
    <section className="surface p-5" aria-labelledby="ask-labellens">
      <h2 id="ask-labellens" className="flex items-center gap-2 font-display text-lg font-semibold">
        <MessageCircleQuestion className="size-4 text-primary" aria-hidden="true" />
        Ask LabelLens
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Answers use only this product's verified analysis. If the data doesn't cover your question,
        LabelLens says so instead of guessing.
      </p>

      <div className="mt-4 space-y-3">
        {thread.map((entry, index) => (
          <div key={index} className="space-y-2">
            <p className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium">{entry.q}</p>
            <p className="whitespace-pre-line rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed text-muted-foreground">
              {entry.a}
            </p>
          </div>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = question.trim();
          if (value.length >= 3) mutation.mutate(value);
        }}
      >
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about an ingredient…"
          maxLength={500}
          aria-label="Ask a question about this product"
        />
        <Button type="submit" disabled={mutation.isPending || question.trim().length < 3}>
          <Send className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Ask</span>
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => mutation.mutate(s)}
            disabled={mutation.isPending}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      {mutation.isPending ? (
        <p className="mt-3 text-xs text-muted-foreground">Checking the verified analysis…</p>
      ) : null}
    </section>
  );
}

function TechnicalSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="technical-analysis">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-5 py-4 text-left transition-colors hover:bg-secondary/50"
      >
        <span>
          <span id="technical-analysis" className="block font-display font-semibold">
            Full technical analysis
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            Score breakdown, regulatory references, NOVA reasoning, nutrition and allergen detail.
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? <div className="mt-6 space-y-8">{children}</div> : null}
    </section>
  );
}


export function AnalysisDashboard({ report }: { report: AnalysisReport }) {
  const [showDetails, setShowDetails] = useState(false);
  const identified = report.ingredients.filter((i) => i.knowledge).length;
  const additives = report.ingredients.filter((i) => i.knowledge?.ins_number).length;
  const sugarFlag = report.flags.find((f) => f.code === "ADDED_SUGAR");
  const attention = report.flags.filter((f) => f.severity !== "verified");

  return (
    <div className="space-y-8">
      {report.isDemo ? (
        <p className="flex items-center gap-2 rounded-xl border border-attention/30 bg-attention-soft px-4 py-3 text-sm font-medium text-attention-foreground">
          <FlaskConical className="size-4" aria-hidden="true" />
          Demo Analysis — this run used a bundled sample label, not a real scan.
        </p>
      ) : null}

      <section className="surface paper-grain p-6 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={report.score.total} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              LabelLens Insight Score
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {report.input.productName ?? "Ingredient analysis"}
            </h1>
            {report.input.brand ? (
              <p className="text-sm text-muted-foreground">{report.input.brand}</p>
            ) : null}
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
              {report.verdict}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <NovaBadge novaClass={report.nova.novaClass} />
              <ConfidenceBadge level={report.confidence.level} />
              <StatusPill severity="neutral">
                {report.ingredients.length} ingredients read
              </StatusPill>
            </div>
          </div>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          This score describes label transparency and processing indicators. It is not a medical
          rating and not an official certification.
        </p>
      </section>

      <ConsumerReport report={report} />

      <TechnicalSection>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Ingredients"
          value={`${identified}/${report.ingredients.length}`}
          hint="Identified in the knowledge base"
        />
        <Card title="Processing" value={`NOVA ${report.nova.novaClass}`} hint={report.nova.plainLanguage} />
        <Card
          title="Sugar findings"
          value={sugarFlag ? `${sugarFlag.ingredients.length} source${sugarFlag.ingredients.length > 1 ? "s" : ""}` : "None found"}
          hint={sugarFlag ? sugarFlag.ingredients.join(", ") : "No sugar-containing ingredient identified."}
        />
        <Card title="Additives" value={String(additives)} hint="Numbered additives declared on the label" />
        <Card
          title="Allergens"
          value={report.allergens.detected.length > 0 ? `${report.allergens.detected.length} detected` : "None detected"}
          hint={report.allergens.note}
        />
        <Card
          title="Analysis confidence"
          value={`${Math.round(report.confidence.value * 100)}%`}
          hint={report.confidence.note}
        />
      </section>

      <section className="surface p-5" aria-labelledby="processing">
        <h2 id="processing" className="font-display text-lg font-semibold">
          {report.nova.label}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{report.nova.plainLanguage}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Why?
        </p>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          {report.nova.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {reason}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg bg-secondary/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {report.nova.caveat}
        </p>
      </section>

      {report.aiExplanation ? (
        <section className="surface p-5" aria-labelledby="ai-summary">
          <h2 id="ai-summary" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            What LabelLens found
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {report.aiExplanation}
          </p>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">
            Written by AI from the verified analysis above. AI never changes the regulatory results.
          </p>
        </section>
      ) : report.aiUnavailableReason ? (
        <p className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          {report.aiUnavailableReason}
        </p>
      ) : null}

      <section aria-labelledby="worth-knowing">
        <h2 id="worth-knowing" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Info className="size-4 text-primary" aria-hidden="true" />
          Things worth knowing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These are findings to understand, not warnings to fear.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {attention.length === 0 ? (
            <li className="surface p-4 text-sm text-muted-foreground">
              No findings were raised for this label.
            </li>
          ) : null}
          {attention.map((flag) => (
            <li key={flag.code} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{flag.label}</p>
                <StatusPill severity={flag.severity}>{flag.code.replaceAll("_", " ")}</StatusPill>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{flag.detail}</p>
              {flag.ingredients.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">{flag.ingredients.join(", ")}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface overflow-hidden" aria-labelledby="ingredient-list">
        <div className="border-b border-border px-4 py-4">
          <h2 id="ingredient-list" className="font-display text-lg font-semibold">
            Understand each ingredient
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap any ingredient to see what it does and the verified information behind it.
          </p>
        </div>
        <ul>
          {report.ingredients.map((item, index) => (
            <IngredientRow key={`${item.parsed.displayName}-${index}`} item={item} />
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5" aria-labelledby="allergen-info">
          <h2 id="allergen-info" className="font-display text-lg font-semibold">
            Allergen information
          </h2>
          <div className="mt-3 space-y-3 text-sm">
            <StatusPill
              severity={
                report.allergens.status === "potential-detected"
                  ? "concern"
                  : report.allergens.status === "none-detected"
                    ? "verified"
                    : "attention"
              }
            >
              {report.allergens.status === "potential-detected"
                ? "Potential allergen detected"
                : report.allergens.status === "none-detected"
                  ? "No common allergen detected"
                  : report.allergens.status === "may-contain-declared"
                    ? "Precautionary statement found"
                    : "Allergen information unclear"}
            </StatusPill>
            {report.allergens.detected.length > 0 ? (
              <ul className="space-y-1 text-muted-foreground">
                {report.allergens.detected.map((a) => (
                  <li key={a.name}>
                    <span className="font-medium text-foreground">{a.group}</span> — from {a.name}
                  </li>
                ))}
              </ul>
            ) : null}
            {report.allergens.mayContain.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Precautionary statement on pack
                </p>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {report.allergens.mayContain.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs leading-relaxed text-muted-foreground">{report.allergens.note}</p>
          </div>
        </section>

        <section className="surface p-5" aria-labelledby="nutrition">
          <h2 id="nutrition" className="font-display text-lg font-semibold">
            Nutrition
          </h2>
          {report.nutrition ? (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                {report.nutrition.basis ?? "As printed on the label"}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ["Energy", report.nutrition.energy_kcal, "kcal"],
                    ["Protein", report.nutrition.protein_g, "g"],
                    ["Carbohydrate", report.nutrition.carbohydrate_g, "g"],
                    ["Total sugars", report.nutrition.total_sugars_g, "g"],
                    ["Added sugars", report.nutrition.added_sugars_g, "g"],
                    ["Total fat", report.nutrition.total_fat_g, "g"],
                    ["Saturated fat", report.nutrition.saturated_fat_g, "g"],
                    ["Trans fat", report.nutrition.trans_fat_g, "g"],
                    ["Dietary fibre", report.nutrition.fibre_g, "g"],
                    ["Sodium", report.nutrition.sodium_mg, "mg"],
                  ] as const
                )
                  .filter(([, value]) => typeof value === "number")
                  .map(([label, value, unit]) => (
                    <div key={label} className="rounded-lg border border-border bg-card p-3">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-display text-lg font-semibold">
                        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                      </dd>
                    </div>
                  ))}
              </dl>
              {report.nutritionFindings.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {report.nutritionFindings.map((f) => (
                    <li key={f.code} className="text-sm text-muted-foreground">
                      <StatusPill severity={f.severity}>{f.label}</StatusPill>
                      <span className="mt-1 block">{f.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No nutrition information was available in this input, so none is shown. LabelLens does
              not estimate nutrition values.
            </p>
          )}
        </section>
      </div>

      <section className="surface p-5" aria-labelledby="score-breakdown">
        <h2 id="score-breakdown" className="font-display text-lg font-semibold">
          How the score was calculated
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every dimension is deterministic and visible. Nothing here is hidden or AI-generated.
        </p>
        <ul className="mt-4 space-y-4">
          {report.score.dimensions.map((dim) => (
            <li key={dim.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{dim.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {dim.points}/{dim.max}
                </span>
              </div>
              <Progress value={(dim.points / dim.max) * 100} className="mt-2 h-2" />
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{dim.note}</p>
            </li>
          ))}
        </ul>
      </section>
      </TechnicalSection>

      <AskPanel report={report} />

      <section className="surface p-5" aria-labelledby="sources">
        <h2 id="sources" className="flex items-center gap-2 font-display text-lg font-semibold">
          <BookOpen className="size-4 text-primary" aria-hidden="true" />
          View sources
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Knowledge base last updated:{" "}
          {report.knowledgeBaseUpdatedAt
            ? new Date(report.knowledgeBaseUpdatedAt).toLocaleDateString()
            : "unknown"}
        </p>
        <ul className="mt-4 space-y-3">
          {report.sources.map((source) => (
            <li key={source.source_name} className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{source.source_name}</p>
                <StatusPill severity="neutral">{source.source_type}</StatusPill>
                {source.is_seed_data ? (
                  <StatusPill severity="attention">Demo / seed record</StatusPill>
                ) : null}
              </div>
              <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Reference</dt>
                  <dd>{source.source_reference ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Version</dt>
                  <dd>{source.source_version ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Retrieved</dt>
                  <dd>
                    {source.retrieved_at ? new Date(source.retrieved_at).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Licence</dt>
                  <dd>{source.license_information ?? "—"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface p-5" aria-labelledby="analysis-details">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <h2 id="analysis-details" className="font-display text-lg font-semibold">
              Analysis details
            </h2>
            <span className="text-sm text-muted-foreground">
              Research mode: input, matches, rules triggered and confidence.
            </span>
          </span>
          <ChevronDown className={cn("size-4 transition-transform", showDetails && "rotate-180")} aria-hidden="true" />
        </button>
        {showDetails ? (
          <div className="animate-rise mt-4 space-y-4 text-sm">
            <div>
              <p className="font-display font-semibold">1. Input</p>
              <p className="text-xs text-muted-foreground">
                Method: {report.input.method}
                {report.input.ocrConfidence !== null
                  ? ` · OCR confidence ${Math.round(report.input.ocrConfidence * 100)}%`
                  : ""}
              </p>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                {report.input.rawText}
              </pre>
            </div>
            <div>
              <p className="font-display font-semibold">2. Normalized ingredients &amp; matches</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {report.ingredients.map((item, index) => (
                  <li key={index}>
                    “{item.parsed.raw}” → {item.knowledge?.canonical_name ?? "unmatched"} ·{" "}
                    {item.matchMethod} · confidence {item.confidence.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold">3. Rules triggered</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {report.flags.map((flag) => (
                  <li key={flag.code}>
                    {flag.code} ({flag.severity})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold">4. NOVA reasoning</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {report.nova.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display font-semibold">5. Confidence</p>
              <p className="text-xs text-muted-foreground">
                {report.confidence.value} ({report.confidence.level}) — {report.confidence.note}
              </p>
            </div>
            {report.unknownNames.length > 0 ? (
              <div>
                <p className="flex items-center gap-2 font-display font-semibold">
                  <AlertTriangle className="size-4 text-attention" aria-hidden="true" />
                  Queued for review
                </p>
                <p className="text-xs text-muted-foreground">{report.unknownNames.join(", ")}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <Disclaimer />
    </div>
  );
}
