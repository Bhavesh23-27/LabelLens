import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Database, FileText, Gauge, ScanLine, Scale, Sparkles } from "lucide-react";

import { Disclaimer, PageShell, SectionHeading } from "@/components/labellens/site-layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How LabelLens Analyses a Food Label" },
      {
        name: "description",
        content:
          "See the five-stage LabelLens pipeline: label reading, ingredient parsing, knowledge-base matching, food-safety rule checks and plain-language explanation.",
      },
      { property: "og:title", content: "How LabelLens Analyses a Food Label" },
      {
        property: "og:description",
        content:
          "Deterministic ingredient matching and regulatory checks first, AI explanation last. Every stage is visible.",
      },
    ],
  }),
  component: HowItWorks,
});

const STAGES = [
  {
    icon: ScanLine,
    title: "1 · Label input",
    body: "Upload a photo of the ingredient panel or paste the text. Images are processed for text extraction only.",
    detail: "Vision OCR returns raw text plus a confidence value. Below 70% confidence, LabelLens tells you to verify.",
  },
  {
    icon: FileText,
    title: "2 · Ingredient parsing",
    body: "The list is split into individual ingredients, handling nested brackets, percentages and INS numbers.",
    detail: "“Emulsifier (Lecithin - INS 322)” becomes a structured entry with function, name and additive number.",
  },
  {
    icon: Database,
    title: "3 · Knowledge-base matching",
    body: "Each entry is matched against the structured ingredient database using INS numbers, aliases and conservative fuzzy matching.",
    detail: "Anything that cannot be matched with confidence is marked uncertain and queued for review — never invented.",
  },
  {
    icon: Scale,
    title: "4 · Food-safety rule check",
    body: "Matched ingredients are compared with stored FSSAI-referenced rules for permitted use and conditions.",
    detail: "Every regulatory statement carries a reference, version and last-verified date. Absence of a rule is reported as insufficient information.",
  },
  {
    icon: Gauge,
    title: "5 · Processing & scoring",
    body: "NOVA classification and the LabelLens Insight Score are computed deterministically from the matched data.",
    detail: "The score rewards label transparency and identifiable ingredients; each dimension is shown with its points.",
  },
  {
    icon: Sparkles,
    title: "6 · Plain-language explanation",
    body: "Only at the end does AI turn the verified findings into readable language.",
    detail: "AI can never change a regulatory result, invent a rule or add a health claim. If AI is unavailable, the analysis still works.",
  },
];

function HowItWorks() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Architecture
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Deterministic first. AI last. Always traceable.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          LabelLens is not a chatbot with a camera. It is a pipeline where each stage has one job,
          and where the regulatory layer is decided by stored rules rather than by a language model.
        </p>

        <ol className="mt-12 space-y-4">
          {STAGES.map((stage) => (
            <li key={stage.title} className="surface p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <stage.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold">{stage.title}</h2>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">
                    {stage.body}
                  </p>
                  <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {stage.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14">
          <SectionHeading
            eyebrow="Guardrails"
            icon={Brain}
            title="What LabelLens will never do"
            description="These constraints are enforced in code, not only in prompt text."
          />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Invent an ingredient, additive number or regulation.",
              "Diagnose conditions or give medical or dietary advice.",
              "Claim a product is banned because a rule is missing.",
              "Estimate nutrition values that were not on the label.",
              "Let AI overrule the deterministic regulatory result.",
              "Hide low confidence behind a confident-sounding answer.",
            ].map((item) => (
              <li key={item} className="surface p-4 text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/scan">Try an analysis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/sources">See the data sources</Link>
          </Button>
        </div>

        <Disclaimer className="mt-10" />
      </div>
    </PageShell>
  );
}
