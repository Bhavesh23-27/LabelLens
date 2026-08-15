import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Database,
  Gauge,
  ScanBarcode,
  ScanLine,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import heroImage from "@/assets/hero-scan.jpg";
import { Disclaimer, PageShell, SectionHeading } from "@/components/labellens/site-layout";
import { StatusPill } from "@/components/labellens/status";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LabelLens — Understand What's Really in Your Food" },
      {
        name: "description",
        content:
          "Scan a barcode or paste a packaged-food ingredient list and get a traceable, ingredient-by-ingredient analysis: what each additive does, processing level and referenced food-safety information.",
      },
      { property: "og:title", content: "LabelLens — Understand What's Really in Your Food" },
      {
        property: "og:description",
        content:
          "Deterministic ingredient intelligence with plain-language explanations. Every finding shows its source and confidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const PILLARS = [
  {
    icon: Database,
    title: "Structured knowledge, not guesswork",
    body: "Ingredients are matched to a curated database using INS numbers and aliases. Unmatched entries are flagged, not invented.",
  },
  {
    icon: Scale,
    title: "Regulatory checks by rules",
    body: "Permitted-use information comes from stored FSSAI-referenced rules with version and verification dates — never from a language model.",
  },
  {
    icon: Gauge,
    title: "A score you can audit",
    body: "The Insight Score shows every dimension and its points, so you can see exactly why a product scored what it did.",
  },
  {
    icon: Sparkles,
    title: "AI only for explaining",
    body: "AI turns verified findings into readable language at the final step, and says when it doesn't know.",
  },
];

const HERO_STATS = [
  { value: "5 stages", label: "OCR → parse → match → rules → explain" },
  { value: "NOVA 1–4", label: "Processing level, transparently derived" },
  { value: "0 invented facts", label: "Unknowns are flagged, never guessed" },
];

function Home() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="aurora absolute inset-0" aria-hidden="true" />
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-6 md:py-24">
          <div className="animate-rise">
            <StatusPill severity="verified">Traceable ingredient intelligence</StatusPill>
            <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.02] sm:text-6xl">
              Understand what's really{" "}
              <span className="shimmer-text">in your food.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Scan a barcode or a photo of the panel. LabelLens identifies every ingredient, checks
              referenced food-safety information and explains it in plain language — showing its
              working at each step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="glow-primary">
                <Link to="/scan">
                  <ScanBarcode className="size-4" aria-hidden="true" />
                  Scan a product
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              No account needed to run an analysis. Sign in only if you want to save it.
            </p>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-2xl"
              aria-hidden="true"
            />
            <img
              src={heroImage}
              alt="A phone showing a LabelLens ingredient analysis beside a packaged food carton"
              width={1280}
              height={1024}
              className="relative w-full rounded-[1.75rem] border border-primary/15 object-cover shadow-[var(--shadow-lift)]"
            />
            <div className="glass animate-float-slow absolute -bottom-6 left-3 w-52 p-4 sm:left-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Insight score
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">62 / 100</p>
              <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">
                4 additives · NOVA 4 · every point explained
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 md:px-6">
          <ul className="grid gap-3 sm:grid-cols-3">
            {HERO_STATS.map((stat) => (
              <li key={stat.value} className="panel hover-lift px-5 py-4">
                <p className="font-display text-xl font-semibold text-primary">{stat.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6">
        <SectionHeading
          eyebrow="Why it's different"
          icon={Database}
          title="Clarity you can check, not a verdict you must trust"
          description="Most label apps hand you a number. LabelLens shows the ingredient match, the rule it applied, the source it came from and how confident it is."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="panel hover-lift p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <pillar.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mesh-soft border-y border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6">
          <SectionHeading
            eyebrow="Three steps"
            icon={ScanLine}
            title="From barcode to understanding in under a minute"
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Capture the product", "Scan the barcode, photograph the panel, or paste the text."],
              [
                "Ingredients identified",
                "Each entry is matched, checked against stored rules and scored.",
              ],
              ["Understand and decide", "Read plain-language findings, then ask follow-up questions."],
            ].map(([title, body], index) => (
              <li key={title} className="panel hover-lift relative p-6">
                <span className="font-display text-4xl font-semibold text-primary/25">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="glow-primary">
              <Link to="/scan">Analyse a label now</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/explore">Browse the ingredient index</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6">
        <SectionHeading
          eyebrow="Trust"
          icon={Scale}
          title="Honest about limits"
          description="LabelLens will tell you when a label is unreadable, when an ingredient isn't in the knowledge base and when regulatory information is insufficient. Missing information is never presented as a warning."
        />
        <Disclaimer className="mt-8 max-w-3xl" />
      </section>
    </PageShell>
  );
}
