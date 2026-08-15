import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Camera,
  FlaskConical,
  Image as ImageIcon,
  Loader2,
  Save,
  Type as TypeIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AnalysisDashboard } from "@/components/labellens/analysis-dashboard";
import { PIPELINE_STEPS, PipelineProgress } from "@/components/labellens/pipeline";
import { Disclaimer, PageShell } from "@/components/labellens/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { DEMO_LABELS } from "@/lib/demo-labels";
import type { AnalysisReport } from "@/lib/engine/types";
import {
  analyzeProduct,
  explainReport,
  runLabelOcr,
  saveAnalysis,
} from "@/lib/labellens.functions";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan a Food Label — LabelLens Ingredient Analysis" },
      {
        name: "description",
        content:
          "Upload a photo of an ingredient panel or paste the text to get a traceable ingredient-by-ingredient analysis, NOVA processing level and Insight Score.",
      },
      { property: "og:title", content: "Scan a Food Label — LabelLens" },
      {
        property: "og:description",
        content:
          "Photo or paste. LabelLens reads the label, matches ingredients to a structured knowledge base and explains what each one does.",
      },
    ],
  }),
  component: ScanPage,
});

const MAX_BYTES = 8 * 1024 * 1024;

function ScanPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const ocr = useServerFn(runLabelOcr);
  const analyze = useServerFn(analyzeProduct);
  const explain = useServerFn(explainReport);
  const save = useServerFn(saveAnalysis);

  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [step, setStep] = useState(-1);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [skipFirst, setSkipFirst] = useState(false);

  async function runPipeline(options: {
    imageDataUrl?: string;
    rawText?: string;
    method: "image" | "text" | "demo";
    isDemo?: boolean;
    ocrConfidence?: number | null;
    name?: string;
    brandName?: string;
  }) {
    setReport(null);
    setNotice(null);
    setSkipFirst(options.method === "text");
    setStep(options.method === "text" ? 2 : 0);

    let labelText = options.rawText ?? "";
    let confidence = options.ocrConfidence ?? null;

    if (options.imageDataUrl) {
      setStep(1);
      const result = await ocr({ data: { imageDataUrl: options.imageDataUrl } });
      if (!result.ok) {
        setStep(-1);
        setNotice(result.message);
        return;
      }
      labelText = result.text;
      confidence = result.confidence;
      if (result.lowConfidence) {
        setNotice(
          "The text was hard to read (low OCR confidence). Please check the ingredient list below against the pack.",
        );
      }
      setText(result.text);
    }

    setStep(2);
    await new Promise((r) => setTimeout(r, 250));
    setStep(4);
    const analysis = await analyze({
      data: {
        text: labelText,
        method: options.method === "demo" ? "demo" : options.method,
        ocrConfidence: confidence,
        productName: options.name?.trim() || null,
        brand: options.brandName?.trim() || null,
        isDemo: Boolean(options.isDemo),
      },
    });

    if (!analysis.ok) {
      setStep(-1);
      setNotice(analysis.message);
      return;
    }

    setStep(6);
    const next = analysis.report as AnalysisReport;
    const explanation = await explain({ data: { report: next } });
    const withExplanation: AnalysisReport = explanation.ok
      ? { ...next, aiExplanation: explanation.explanation }
      : { ...next, aiUnavailableReason: explanation.message };

    setStep(PIPELINE_STEPS.length);
    setReport(withExplanation);
  }

  const pipeline = useMutation({
    mutationFn: runPipeline,
    onError: () => {
      setStep(-1);
      setNotice("Something went wrong during analysis. Please try again.");
    },
  });

  const saving = useMutation({
    mutationFn: async () => {
      if (!report) throw new Error("No analysis");
      return save({
        data: {
          report,
          productName: productName.trim() || report.input.productName,
          brand: brand.trim() || report.input.brand,
        },
      });
    },
    onSuccess: (result) => {
      toast.success("Analysis saved to your history.");
      navigate({ to: "/analysis/$id", params: { id: result.id } });
    },
    onError: () => toast.error("Couldn't save this analysis."),
  });

  function handleFile(file: File) {
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
      setPreview(dataUrl);
      pipeline.mutate({ imageDataUrl: dataUrl, method: "image", name: productName, brandName: brand });
    };
    reader.readAsDataURL(file);
  }

  const busy = pipeline.isPending;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Analyse a label
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          What's actually in this product?
        </h1>
        <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
          Photograph the ingredient panel or paste the text. LabelLens reads it, matches each
          ingredient to a structured knowledge base and shows the reasoning behind every finding.
        </p>

        {!report ? (
          <div className="surface mt-8 p-5 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product">Product name (optional)</Label>
                <Input
                  id="product"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  maxLength={160}
                  placeholder="Chocolate cream wafer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand (optional)</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  maxLength={160}
                  placeholder="Brand name"
                />
              </div>
            </div>

            <Tabs defaultValue="photo" className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="photo" className="flex-1">
                  <Camera className="size-4" aria-hidden="true" />
                  Photo
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex-1">
                  <TypeIcon className="size-4" aria-hidden="true" />
                  Paste text
                </TabsTrigger>
                <TabsTrigger value="demo" className="flex-1">
                  <FlaskConical className="size-4" aria-hidden="true" />
                  Demo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="photo" className="mt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40"
                >
                  <ImageIcon className="size-8 text-primary" aria-hidden="true" />
                  <span className="font-medium">Upload or take a photo of the ingredient panel</span>
                  <span className="text-xs text-muted-foreground">
                    JPG or PNG up to 8 MB · fill the frame with the ingredient list
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                    event.target.value = "";
                  }}
                />
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected ingredient label"
                    className="mt-4 max-h-56 w-full rounded-xl object-contain"
                  />
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  Images are used only to extract label text for this analysis.
                </p>
              </TabsContent>

              <TabsContent value="paste" className="mt-4 space-y-3">
                <Label htmlFor="label-text">Ingredient list (and nutrition, if printed)</Label>
                <Textarea
                  id="label-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={9}
                  maxLength={6000}
                  placeholder="INGREDIENTS: Refined wheat flour, Sugar, Edible vegetable oil…"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy || text.trim().length < 15}
                    onClick={() =>
                      pipeline.mutate({
                        rawText: text,
                        method: "text",
                        name: productName,
                        brandName: brand,
                      })
                    }
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                    Analyse ingredients
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setText(DEMO_LABELS[0]!.text)}
                  >
                    Paste a sample label
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="demo" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Demo mode runs the full pipeline on bundled sample labels. Results are clearly
                  marked as demo analyses.
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {DEMO_LABELS.map((demo) => (
                    <li key={demo.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setProductName(demo.productName);
                          setBrand(demo.brand);
                          setText(demo.text);
                          pipeline.mutate({
                            rawText: demo.text,
                            method: "demo",
                            isDemo: true,
                            ocrConfidence: demo.ocrConfidence,
                            name: demo.productName,
                            brandName: demo.brand,
                          });
                        }}
                        className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/30"
                      >
                        <p className="font-medium">{demo.productName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{demo.category}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>

            <Disclaimer className="mt-6" />
          </div>
        ) : null}

        {notice ? (
          <p className="mt-6 flex items-start gap-2 rounded-xl border border-attention/30 bg-attention-soft px-4 py-3 text-sm text-attention-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {notice}
          </p>
        ) : null}

        {busy ? (
          <div className="surface mt-8 p-5">
            <div className="relative mb-5 h-24 overflow-hidden rounded-xl bg-primary-soft/50">
              <div className="animate-scanline absolute inset-x-0 h-0.5 bg-primary/70" />
              <p className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary">
                Reading the label…
              </p>
            </div>
            <PipelineProgress activeStep={step} skipFirst={skipFirst} />
          </div>
        ) : null}

        {report ? (
          <div className="mt-10 space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReport(null);
                  setStep(-1);
                  setPreview(null);
                }}
              >
                Analyse another product
              </Button>
              {isAuthenticated ? (
                <Button onClick={() => saving.mutate()} disabled={saving.isPending}>
                  <Save className="size-4" aria-hidden="true" />
                  Save to my history
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => navigate({ to: "/auth" })}>
                  Sign in to save this analysis
                </Button>
              )}
            </div>
            <AnalysisDashboard report={report} />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
