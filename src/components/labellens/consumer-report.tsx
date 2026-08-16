import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Database,
  ExternalLink,
  Leaf,
  ScanText,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { StatusPill, regulatoryPresentation } from "@/components/labellens/status";
import type { AnalysisReport, MatchedIngredient } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

/* --------------------------- plain-language layer --------------------------- */

type Band = {
  key: "good" | "okay" | "occasional" | "limit";
  headline: string;
  recommendation: string;
  severity: "verified" | "attention" | "concern";
};

function band(score: number, novaClass: number): Band {
  if (score >= 75 && novaClass <= 2)
    return {
      key: "good",
      headline: "A clean, simple label",
      recommendation:
        "Nothing on this label stands out as a concern. Fine as a regular part of your food shopping.",
      severity: "verified",
    };
  if (score >= 60)
    return {
      key: "okay",
      headline: "Reasonable, with a few things to note",
      recommendation:
        "Fine to eat regularly in normal portions. Read the notes below so you know what you're getting.",
      severity: "verified",
    };
  if (score >= 40)
    return {
      key: "occasional",
      headline: "Better as an occasional food",
      recommendation:
        "This is a processed product with several added ingredients. Enjoy it sometimes rather than every day.",
      severity: "attention",
    };
  return {
    key: "limit",
    headline: "Heavily processed — keep it a treat",
    recommendation:
      "Lots of added ingredients and processing markers. Worth limiting, especially if you eat products like this often.",
    severity: "concern",
  };
}

function ingredientMeaning(item: MatchedIngredient): string {
  const k = item.knowledge;
  if (!k)
    return "We don't have a verified explanation for this one yet, so we won't guess. It's queued for review.";
  const text = k.consumer_explanation ?? k.why_used ?? k.description;
  if (text) return text;
  return `${k.category}${k.functional_class ? ` — used as ${k.functional_class.toLowerCase()}` : ""}.`;
}

function ingredientSource(item: MatchedIngredient): {
  url: string | null;
  label: string | null;
} {
  const ref =
    item.regulatory?.regulation_reference ?? item.knowledge?.source_reference ?? null;
  if (!ref) return { url: null, label: null };
  if (/^https?:\/\//i.test(ref)) return { url: ref, label: "View source" };
  return { url: null, label: ref };
}

function buildInsights(report: AnalysisReport) {
  const insights: { icon: "leaf" | "alert" | "check"; title: string; detail: string }[] = [];

  insights.push({
    icon: report.nova.novaClass >= 4 ? "alert" : report.nova.novaClass <= 2 ? "check" : "leaf",
    title: `How processed is it? ${report.nova.label}`,
    detail: report.nova.plainLanguage,
  });

  const sugar = report.flags.find((f) => f.code === "ADDED_SUGAR");
  insights.push(
    sugar
      ? {
          icon: "alert",
          title:
            sugar.ingredients.length > 1
              ? `Sugar appears under ${sugar.ingredients.length} different names`
              : "Contains an added sugar",
          detail: `${sugar.ingredients.join(", ")}. Split across several names, sugar can look like a smaller part of the product than it is.`,
        }
      : {
          icon: "check",
          title: "No added sugar found on the label",
          detail: "We checked the ingredient names against known sugar aliases and found none.",
        },
  );

  const additives = report.ingredients.filter((i) => i.knowledge?.ins_number);
  insights.push(
    additives.length > 0
      ? {
          icon: additives.length >= 5 ? "alert" : "leaf",
          title: `${additives.length} numbered additive${additives.length === 1 ? "" : "s"} declared`,
          detail: `${additives
            .map((i) => i.knowledge?.canonical_name ?? i.parsed.displayName)
            .slice(0, 6)
            .join(", ")}. Numbered additives are legal to use — we show what each one does below.`,
        }
      : {
          icon: "check",
          title: "No numbered additives declared",
          detail: "The label lists only named food ingredients.",
        },
  );

  insights.push(
    report.allergens.detected.length > 0
      ? {
          icon: "alert",
          title: `Possible allergen${report.allergens.detected.length === 1 ? "" : "s"}: ${report.allergens.detected
            .map((a) => a.group)
            .join(", ")}`,
          detail: report.allergens.note,
        }
      : {
          icon: "check",
          title: "No common allergen ingredient identified",
          detail: report.allergens.note,
        },
  );

  for (const finding of report.nutritionFindings.slice(0, 2)) {
    insights.push({
      icon: finding.severity === "verified" ? "check" : "alert",
      title: finding.label,
      detail: finding.detail,
    });
  }

  return insights;
}

function TrustPanel({ report }: { report: AnalysisReport }) {
  const identified = report.ingredients.filter((i) => i.knowledge).length;
  const fssaiMatched = report.ingredients.filter((i) => i.regulatory).length;
  const verifiedSources = report.sources.filter((s) => !s.is_seed_data).length;
  const totalSources = report.sources.length;

  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2">
        <Database className="size-4 text-primary" aria-hidden="true" />
        <h3 className="font-display font-semibold">Why trust this result?</h3>
      </div>
      <ul className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">{fssaiMatched}</strong> of{" "}
            <strong className="text-foreground">{report.ingredients.length}</strong> ingredients matched a
            referenced FSSAI rule.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Database className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            Based on{" "}
            <strong className="text-foreground">
              {totalSources} source{totalSources === 1 ? "" : "s"}
            </strong>
            {verifiedSources > 0 ? ` (${verifiedSources} verified)` : ""}.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            Confidence: <strong className="text-foreground">{report.confidence.note}</strong>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ScrollText className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            Knowledge base updated{" "}
            {report.knowledgeBaseUpdatedAt
              ? new Date(report.knowledgeBaseUpdatedAt).toLocaleDateString()
              : "—"}
            .
          </span>
        </li>
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        LabelLens uses a deterministic pipeline — NOVA for processing and FSSAI for regulatory rules.{" "}
        <Link to="/sources" className="text-primary hover:underline">
          See our methodology and sources
        </Link>
        .
      </p>
    </div>
  );
}

/* --------------------------------- component -------------------------------- */

export function ConsumerReport({ report }: { report: AnalysisReport }) {
  const verdict = band(report.score.total, report.nova.novaClass);
  const insights = buildInsights(report);
  const checkedAgainstFssai = report.ingredients.filter((i) => i.regulatory).length;
  const notPermitted = report.ingredients.filter(
    (i) =>
      (i.regulatory?.permission_status ?? i.knowledge?.fssai_status) === "not-permitted" ||
      (i.regulatory?.permission_status ?? i.knowledge?.fssai_status) === "restricted",
  );

  return (
    <div className="space-y-6">
      {/* Bottom line */}
      <section
        className="panel p-6 md:p-8"
        aria-labelledby="bottom-line"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          In plain words
        </p>
        <h2 id="bottom-line" className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
          {verdict.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
          {verdict.recommendation}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusPill severity={verdict.severity}>
            {verdict.key === "good"
              ? "Good everyday choice"
              : verdict.key === "okay"
                ? "Okay in normal portions"
                : verdict.key === "occasional"
                  ? "Occasional food"
                  : "Best kept as a treat"}
          </StatusPill>
          <StatusPill severity="neutral">NOVA group {report.nova.novaClass}</StatusPill>
          <StatusPill severity="neutral">
            {report.ingredients.length} ingredient{report.ingredients.length === 1 ? "" : "s"} read
          </StatusPill>
          {report.input.method === "image" && report.input.ocrConfidence !== null ? (
            <StatusPill
              severity={
                report.input.ocrConfidence >= 0.8
                  ? "verified"
                  : report.input.ocrConfidence >= 0.6
                    ? "attention"
                    : "concern"
              }
            >
              <ScanText className="size-3" aria-hidden="true" />
              OCR {Math.round(report.input.ocrConfidence * 100)}%
              {report.input.ocrConfidence < 0.6 ? " — please check" : ""}
            </StatusPill>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                {checkedAgainstFssai} of {report.ingredients.length} ingredients
              </span>{" "}
              matched a referenced FSSAI record in our database.
              {notPermitted.length > 0
                ? ` ${notPermitted.length} needs a closer look.`
                : " Nothing flagged as not permitted."}
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4">
            <ScrollText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">NOVA {report.nova.novaClass}</span> —{" "}
              {report.nova.label.toLowerCase()}. This is the standard food-processing classification
              used in nutrition research.
            </p>
          </div>
        </div>
      </section>

      <TrustPanel report={report} />

      {/* Health insights */}
      <section aria-labelledby="health-insights">
        <h2 id="health-insights" className="font-display text-xl font-semibold">
          What this means for you
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {insights.map((insight) => {
            const Icon =
              insight.icon === "check" ? CheckCircle2 : insight.icon === "alert" ? AlertTriangle : Leaf;
            return (
              <li key={insight.title} className="surface flex gap-3 p-4">
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    insight.icon === "alert" ? "text-attention-foreground" : "text-primary",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-medium">{insight.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {insight.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Ingredient meanings, plain */}
      <section className="surface overflow-hidden" aria-labelledby="plain-ingredients">
        <div className="border-b border-border px-5 py-4">
          <h2 id="plain-ingredients" className="font-display text-lg font-semibold">
            Every ingredient, in plain English
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What it is, why it's in there, and what our FSSAI records say about it.
          </p>
        </div>
        <ul className="divide-y divide-border/70">
          {report.ingredients.map((item, index) => {
            const reg = regulatoryPresentation(
              item.regulatory?.permission_status ?? item.knowledge?.fssai_status,
            );
            const source = ingredientSource(item);
            return (
              <li key={`${item.parsed.displayName}-${index}`} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {item.knowledge?.canonical_name ?? item.parsed.displayName}
                  </p>
                  {item.parsed.insNumber ? (
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.68rem] text-secondary-foreground">
                      INS {item.parsed.insNumber}
                    </span>
                  ) : null}
                  {item.knowledge ? (
                    <StatusPill severity="verified">
                      <Database className="size-3" aria-hidden="true" />
                      Matched in database
                    </StatusPill>
                  ) : (
                    <StatusPill severity="neutral">
                      <ScanText className="size-3" aria-hidden="true" />
                      Not identified
                    </StatusPill>
                  )}
                  <StatusPill severity={reg.severity}>{reg.label}</StatusPill>
                  {item.knowledge?.allergen_flag ? (
                    <StatusPill severity="concern">
                      Allergen: {item.knowledge.allergen_group ?? "see pack"}
                    </StatusPill>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {ingredientMeaning(item)}
                </p>
                {source.label ? (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" aria-hidden="true" />
                        {source.label}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <ScrollText className="size-3" aria-hidden="true" />
                        Source: {source.label}
                      </span>
                    )}
                    {item.regulatory?.condition ? (
                      <span className="text-border">·</span>
                    ) : null}
                    {item.regulatory?.condition ? (
                      <span>Condition: {item.regulatory.condition}</span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {notPermitted.length > 0 ? (
        <p className="flex items-start gap-2 rounded-xl border border-concern/30 bg-concern-soft px-4 py-3 text-sm leading-relaxed text-concern-foreground">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Our records mark{" "}
          {notPermitted
            .map((i) => i.knowledge?.canonical_name ?? i.parsed.displayName)
            .join(", ")}{" "}
          as restricted or conditional under FSSAI rules. Check the pack and the conditions in the
          detailed analysis below.
        </p>
      ) : null}
    </div>
  );
}
