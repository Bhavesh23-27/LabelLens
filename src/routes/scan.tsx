import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  Loader2,
  Save,
  ScanBarcode,
  Sparkles,
  Type as TypeIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { AnalysisDashboard } from "@/components/labellens/analysis-dashboard";
import { BarcodeScanner, cameraScanSupported } from "@/components/labellens/barcode-scanner";
import { PIPELINE_STEPS, PipelineProgress } from "@/components/labellens/pipeline";
import { Disclaimer, PageShell } from "@/components/labellens/site-layout";
import { StatusPill } from "@/components/labellens/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { SAMPLE_PASTE } from "@/lib/demo-labels";
import type { AnalysisReport, NutritionFacts } from "@/lib/engine/types";
import {
  analyzeProduct,
  explainReport,
  lookupBarcode,
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
          "Scan a barcode, upload a photo of the ingredient panel or paste the text to get a traceable ingredient-by-ingredient analysis, NOVA processing level and Insight Score.",
      },
      { property: "og:title", content: "Scan a Food Label — LabelLens" },
      {
        property: "og:description",
        content:
          "Barcode, photo or paste. LabelLens reads the label, matches ingredients to a structured knowledge base and explains what each one does.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScanPage,
});

const MAX_BYTES = 8 * 1024 * 1024;

const INPUT_TABS = [
  { value: "barcode", label: "Barcode", icon: ScanBarcode, hint: "Fastest" },
  { value: "photo", label: "Photo", icon: Camera, hint: "Most accurate" },
  { value: "paste", label: "Paste text", icon: TypeIcon, hint: "Always works" },
] as const;

function ScanPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const ocr = useServerFn(runLabelOcr);
  const analyze = useServerFn(analyzeProduct);
  const explain = useServerFn(explainReport);
  const save = useServerFn(saveAnalysis);
  const barcodeLookup = useServerFn(lookupBarcode);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [barcode, setBarcode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [barcodeSource, setBarcodeSource] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [skipFirst, setSkipFirst] = useState(false);

  async function runPipeline(options: {
    imageDataUrl?: string;
    rawText?: string;
    method: "image" | "text" | "barcode";
    ocrConfidence?: number | null;
    nutrition?: NutritionFacts | null;
    name?: string;
    brandName?: string;
  }) {
    setReport(null);
    setNotice(null);
    const textOnly = options.method !== "image";
    setSkipFirst(textOnly);
    setStep(textOnly ? 2 : 0);

    let labelText = options.rawText ?? "";
    let confidence = options.ocrConfidence ?? null;

    if (options.imageDataUrl) {
      setStep(1);
      let text = "";
      let conf = 0;
      let lowConfidence = false;
      const result = await ocr({ data: { imageDataUrl: options.imageDataUrl } });

      if (result.ok) {
        text = result.text;
        conf = result.confidence;
        lowConfidence = Boolean(result.lowConfidence);
      } else {
        // No server OCR provider available — fall back to on-device OCR.
        try {
          const { runBrowserOcr } = await import("@/lib/ocr-browser");
          const local = await runBrowserOcr(options.imageDataUrl);
          if (!local.text || local.text.length < 12) {
            setStep(-1);
            setNotice(
              "We couldn't read enough text from that photo. Try a sharper, well-lit close-up of the ingredients list, or paste the text instead.",
            );
            return;
          }
          text = local.text;
          conf = local.confidence;
          lowConfidence = local.confidence < 0.7;
        } catch {
          setStep(-1);
          setNotice(result.message);
          return;
        }
      }

      labelText = text;
      confidence = conf;
      if (lowConfidence) {
        setNotice(
          "The text was hard to read (low OCR confidence). Please check the ingredient list below against the pack.",
        );
      }
      setText(text);
    }


    setStep(2);
    await new Promise((r) => setTimeout(r, 250));
    setStep(4);
    const analysis = await analyze({
      data: {
        text: labelText,
        method: options.method,
        ocrConfidence: confidence,
        productName: options.name?.trim() || null,
        brand: options.brandName?.trim() || null,
        nutrition: options.nutrition ?? null,
        isDemo: false,
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

  const lookup = useMutation({
    mutationFn: async (code: string) => barcodeLookup({ data: { barcode: code } }),
    onSuccess: (result) => {
      if (!result.ok) {
        setNotice(result.message);
        return;
      }
      const product = result.product;
      setNotice(null);
      setBarcodeSource(product.sourceLabel);
      if (product.productName) setProductName(product.productName);
      if (product.brand) setBrand(product.brand);
      setText(product.ingredientsText ?? "");
      if (product.imageUrl) setPreview(product.imageUrl);
      pipeline.mutate({
        rawText: product.ingredientsText ?? "",
        method: "barcode",
        nutrition: product.nutrition,
        name: product.productName ?? "",
        brandName: product.brand ?? "",
      });
    },
    onError: () => setNotice("Couldn't look up that barcode. Please try again."),
  });

  const handleDetected = useCallback(
    (code: string) => {
      setCameraOpen(false);
      setBarcode(code);
      lookup.mutate(code);
    },
    [lookup],
  );

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
      toast.success("Analysis saved to My scans.");
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

  const busy = pipeline.isPending || lookup.isPending;

  return (
    <PageShell>
      <div className="relative overflow-hidden">
        <div className="aurora absolute inset-x-0 top-0 h-[22rem]" aria-hidden="true" />
        <div className="grid-lines absolute inset-x-0 top-0 h-[22rem]" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-16">
          <div className="max-w-2xl">
            <StatusPill severity="verified">Live analysis pipeline</StatusPill>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.03] sm:text-5xl">
              What's actually in{" "}
              <span className="shimmer-text">this product?</span>
            </h1>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              Scan the barcode, photograph the ingredient panel, or paste the text. LabelLens matches
              every ingredient to a structured knowledge base and shows the reasoning behind each
              finding.
            </p>
          </div>

          {!report ? (
            <div className="glass mt-9 p-5 md:p-7">
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

              <Tabs defaultValue="barcode" className="mt-7">
                <TabsList className="h-auto w-full gap-1 rounded-2xl bg-secondary/70 p-1.5">
                  {INPUT_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex-1 flex-col gap-0.5 rounded-xl py-2.5 data-[state=active]:glow-primary"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <tab.icon className="size-4" aria-hidden="true" />
                        {tab.label}
                      </span>
                      <span className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {tab.hint}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="barcode" className="mt-5 space-y-4">
                  {cameraOpen ? (
                    <BarcodeScanner onDetected={handleDetected} onClose={() => setCameraOpen(false)} />
                  ) : (
                    <div className="mesh-soft relative overflow-hidden rounded-2xl border border-primary/15 px-5 py-7 text-center">
                      <div className="animate-float-slow mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <ScanBarcode className="size-7" aria-hidden="true" />
                      </div>
                      <p className="mt-4 font-medium">Look the product up by its barcode</p>
                      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                        We fetch the recorded ingredient list from the open product database, then run
                        the full LabelLens pipeline on it.
                      </p>
                      <div className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
                        <Input
                          value={barcode}
                          inputMode="numeric"
                          maxLength={14}
                          onChange={(event) => setBarcode(event.target.value.replace(/[^0-9]/g, ""))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && barcode.length >= 8 && !busy) {
                              lookup.mutate(barcode);
                            }
                          }}
                          placeholder="e.g. 8901058000000"
                          aria-label="Barcode number"
                          className="text-center font-mono tracking-[0.18em] sm:text-left"
                        />
                        <Button
                          disabled={busy || barcode.length < 8}
                          onClick={() => lookup.mutate(barcode)}
                        >
                          {lookup.isPending ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Sparkles className="size-4" aria-hidden="true" />
                          )}
                          Look up
                        </Button>
                      </div>
                      {cameraScanSupported() ? (
                        <Button
                          variant="ghost"
                          className="mt-3"
                          disabled={busy}
                          onClick={() => setCameraOpen(true)}
                        >
                          <Camera className="size-4" aria-hidden="true" />
                          Scan with camera instead
                        </Button>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Camera scanning isn't supported in this browser — type the digits printed
                          under the bars.
                        </p>
                      )}
                    </div>
                  )}
                  {barcodeSource ? (
                    <p className="text-xs text-muted-foreground">
                      Product details sourced from {barcodeSource}. Always confirm against the pack.
                    </p>
                  ) : null}
                </TabsContent>

                <TabsContent value="photo" className="mt-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => fileRef.current?.click()}
                      className="hover-lift group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 bg-secondary/40 px-6 py-10 text-center"
                    >
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <ImageIcon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="font-medium">Upload from gallery</span>
                      <span className="text-xs text-muted-foreground">Pick a saved ingredient-panel photo</span>
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => cameraRef.current?.click()}
                      className="hover-lift group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 bg-secondary/40 px-6 py-10 text-center"
                    >
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Camera className="size-6" aria-hidden="true" />
                      </span>
                      <span className="font-medium">Take a photo</span>
                      <span className="text-xs text-muted-foreground">Open the camera and snap the label</span>
                    </button>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleFile(file);
                      event.target.value = "";
                    }}
                  />
                  <input
                    ref={cameraRef}
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
                      className="mt-4 max-h-56 w-full rounded-xl border border-border object-contain"
                    />
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Images are used only to extract label text for this analysis. Fill the frame with the ingredient list for best OCR results.
                  </p>
                </TabsContent>

                <TabsContent value="paste" className="mt-5 space-y-3">
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
                    <Button variant="ghost" disabled={busy} onClick={() => setText(SAMPLE_PASTE)}>
                      Paste an example label
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <Disclaimer className="mt-6" />
            </div>
          ) : null}

          {notice ? (
            <p className="mt-6 flex items-start gap-2 rounded-2xl border border-attention/30 bg-attention-soft px-4 py-3 text-sm text-attention-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {notice}
            </p>
          ) : null}

          {busy ? (
            <div className="panel mt-8 p-5">
              <div className="relative mb-5 h-24 overflow-hidden rounded-xl bg-primary-soft/50">
                <div className="animate-scanline absolute inset-x-0 h-0.5 bg-primary/70" />
                <p className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary">
                  {lookup.isPending ? "Finding this product…" : "Reading the label…"}
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
                    setBarcodeSource(null);
                  }}
                >
                  Analyse another product
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/saved">View my scans</Link>
                </Button>
                {isAuthenticated ? (
                  <Button onClick={() => saving.mutate()} disabled={saving.isPending}>
                    <Save className="size-4" aria-hidden="true" />
                    Save to My scans
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
      </div>
    </PageShell>
  );
}
