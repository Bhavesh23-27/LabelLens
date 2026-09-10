import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ScoreRing } from "@/components/labellens/score-ring";
import { Disclaimer, PageShell } from "@/components/labellens/site-layout";
import { NovaBadge, StatusPill } from "@/components/labellens/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_LABELS } from "@/lib/demo-labels";
import type { AnalysisReport } from "@/lib/engine/types";
import { analyzeProduct, runLabelOcr } from "@/lib/labellens.functions";


export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Two Packaged Products — LabelLens" },
      {
        name: "description",
        content:
          "Paste two ingredient lists side by side and compare Insight Score, processing level, additives and allergen findings.",
      },
      { property: "og:title", content: "Compare Two Packaged Products — LabelLens" },
      {
        property: "og:description",
        content: "A like-for-like ingredient comparison of two labels, with the reasoning shown for both.",
      },
    ],
  }),
  component: ComparePage,
});

type Side = { name: string; text: string };
type SideKey = "A" | "B";

const MAX_BYTES = 8 * 1024 * 1024;

function ComparePage() {
  const analyze = useServerFn(analyzeProduct);
  const ocr = useServerFn(runLabelOcr);
  const [left, setLeft] = useState<Side>({ name: "", text: "" });
  const [right, setRight] = useState<Side>({ name: "", text: "" });
  const [reports, setReports] = useState<[AnalysisReport, AnalysisReport] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<SideKey | null>(null);
  const [previews, setPreviews] = useState<{ A: string | null; B: string | null }>({
    A: null,
    B: null,
  });
  const galleryRefs = {
    A: useRef<HTMLInputElement>(null),
    B: useRef<HTMLInputElement>(null),
  };
  const cameraRefs = {
    A: useRef<HTMLInputElement>(null),
    B: useRef<HTMLInputElement>(null),
  };

  /** Reads a label photo for one side and fills its ingredient list. */
  async function readLabel(key: SideKey, dataUrl: string) {
    const setSide = key === "A" ? setLeft : setRight;
    setReading(key);
    setError(null);
    try {
      let text = "";
      const result = await ocr({ data: { imageDataUrl: dataUrl } });
      if (result.ok) {
        text = result.text;
        if (result.lowConfidence) {
          toast.warning(`Product ${key}: the photo was hard to read — please check the text.`);
        }
      } else {
        const { runBrowserOcr } = await import("@/lib/ocr-browser");
        const local = await runBrowserOcr(dataUrl);
        text = local.text;
      }
      if (!text || text.trim().length < 12) {
        setError(
          `We couldn't read enough text from the Product ${key} photo. Try a sharper, well-lit close-up of the ingredients list, or type it instead.`,
        );
        return;
      }
      setSide((prev) => ({ ...prev, text: text.trim() }));
      toast.success(`Product ${key}: label text extracted.`);
    } catch {
      setError(`Couldn't read the Product ${key} photo. Please try again or type the list.`);
    } finally {
      setReading(null);
    }
  }

  function handleFile(key: SideKey, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image of the ingredient panel.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is larger than 8 MB. Try a smaller photo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setPreviews((prev) => ({ ...prev, [key]: dataUrl }));
      void readLabel(key, dataUrl);
    };
    reader.readAsDataURL(file);
  }


  const run = useMutation({
    mutationFn: async () => {
      const [a, b] = await Promise.all(
        [left, right].map((side) =>
          analyze({
            data: {
              text: side.text,
              method: "text" as const,
              productName: side.name.trim() || null,
              isDemo: false,
            },
          }),
        ),
      );
      if (!a?.ok || !b?.ok) throw new Error(a?.ok ? b!.message : a!.message);
      return [a.report as AnalysisReport, b.report as AnalysisReport] as [AnalysisReport, AnalysisReport];
    },
    onSuccess: (value) => {
      setError(null);
      setReports(value);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Comparison failed."),
  });

  function fillDemo() {
    setLeft({ name: DEMO_LABELS[0]!.productName, text: DEMO_LABELS[0]!.text });
    setRight({ name: DEMO_LABELS[3]!.productName, text: DEMO_LABELS[3]!.text });
  }

  const ready = left.text.trim().length > 15 && right.text.trim().length > 15;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-14 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Compare</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Two products, one view</h1>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
          Paste both ingredient lists. LabelLens runs the same deterministic pipeline on each so the
          comparison is like for like.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {([
            ["Product A", left, setLeft] as const,
            ["Product B", right, setRight] as const,
          ]).map(([title, side, setSide]) => (
            <div key={title} className="surface space-y-3 p-5">
              <h2 className="font-display text-lg font-semibold">{title}</h2>
              <div className="space-y-2">
                <Label htmlFor={`${title}-name`}>Product name (optional)</Label>
                <Input
                  id={`${title}-name`}
                  value={side.name}
                  maxLength={160}
                  onChange={(event) => setSide({ ...side, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${title}-text`}>Ingredient list</Label>
                <Textarea
                  id={`${title}-text`}
                  rows={8}
                  maxLength={6000}
                  value={side.text}
                  onChange={(event) => setSide({ ...side, text: event.target.value })}
                  placeholder="INGREDIENTS: …"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={!ready || run.isPending} onClick={() => run.mutate()}>
            {run.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Compare products
          </Button>
          <Button variant="ghost" onClick={fillDemo} disabled={run.isPending}>
            Use sample labels
          </Button>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-attention/30 bg-attention-soft px-4 py-3 text-sm text-attention-foreground">
            {error}
          </p>
        ) : null}

        {reports ? (
          <div className="surface mt-10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Side-by-side result
            </p>
            {(() => {
              const [a, b] = reports;
              const nameA = a.input.productName ?? "Product A";
              const nameB = b.input.productName ?? "Product B";
              const gap = Math.abs(a.score.total - b.score.total);
              const leader = a.score.total >= b.score.total ? nameA : nameB;
              const other = a.score.total >= b.score.total ? nameB : nameA;
              const leadReport = a.score.total >= b.score.total ? a : b;
              const otherReport = a.score.total >= b.score.total ? b : a;
              const addOf = (r: AnalysisReport) =>
                r.ingredients.filter((i) => i.knowledge?.ins_number).length;
              return (
                <>
                  <h2 className="mt-3 font-display text-xl font-semibold sm:text-2xl">
                    {gap <= 4
                      ? `${nameA} and ${nameB} look about the same`
                      : `${leader} reads better than ${other}`}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {gap <= 4
                      ? `Both labels land within ${gap} point${gap === 1 ? "" : "s"} of each other, so the choice comes down to the individual findings below.`
                      : `${leader} scores ${gap} point${gap === 1 ? "" : "s"} higher: ${addOf(leadReport)} numbered additive${addOf(leadReport) === 1 ? "" : "s"} against ${addOf(otherReport)}, and processing level ${leadReport.nova.novaClass} against ${otherReport.nova.novaClass}${leadReport.nova.novaClass > otherReport.nova.novaClass ? " — so check the findings on both before choosing" : ""}.`}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This is a label-readability comparison, not a health verdict.
                  </p>
                </>
              );
            })()}
          </div>
        ) : null}

        {reports ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reports.map((report, index) => {
              const additives = report.ingredients.filter((i) => i.knowledge?.ins_number).length;
              return (
                <div key={index} className="surface p-5">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={report.score.total} size={96} />
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold">
                        {report.input.productName ?? `Product ${index === 0 ? "A" : "B"}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <NovaBadge novaClass={report.nova.novaClass} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {report.verdict}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border bg-card p-3">
                      <dt className="text-xs text-muted-foreground">Ingredients</dt>
                      <dd className="font-display text-lg font-semibold">
                        {report.ingredients.length}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <dt className="text-xs text-muted-foreground">Additives</dt>
                      <dd className="font-display text-lg font-semibold">{additives}</dd>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <dt className="text-xs text-muted-foreground">Allergens</dt>
                      <dd className="font-display text-lg font-semibold">
                        {report.allergens.detected.length}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3">
                      <dt className="text-xs text-muted-foreground">Confidence</dt>
                      <dd className="font-display text-lg font-semibold">
                        {Math.round(report.confidence.value * 100)}%
                      </dd>
                    </div>
                  </dl>
                  <ul className="mt-4 space-y-2">
                    {report.flags
                      .filter((flag) => flag.severity !== "verified")
                      .slice(0, 4)
                      .map((flag) => (
                        <li key={flag.code}>
                          <StatusPill severity={flag.severity}>{flag.label}</StatusPill>
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : null}

        <Disclaimer className="mt-10" />
      </div>
    </PageShell>
  );
}
