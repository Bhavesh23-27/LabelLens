import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export const PIPELINE_STEPS = [
  "Uploading label",
  "Reading text (OCR)",
  "Identifying ingredients",
  "Checking ingredient knowledge base",
  "Comparing regulatory information",
  "Analysing processing level",
  "Generating explanation",
] as const;

export function PipelineProgress({
  activeStep,
  skipFirst = false,
}: {
  /** index into PIPELINE_STEPS; equal to length when finished */
  activeStep: number;
  skipFirst?: boolean;
}) {
  const steps = skipFirst ? PIPELINE_STEPS.slice(2) : PIPELINE_STEPS;
  const offset = skipFirst ? 2 : 0;

  return (
    <ol className="space-y-3" aria-live="polite">
      {steps.map((step, index) => {
        const stepIndex = index + offset;
        const done = activeStep > stepIndex;
        const active = activeStep === stepIndex;
        return (
          <li
            key={step}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
              done && "border-verified/25 bg-verified-soft/60 text-foreground",
              active && "border-primary/40 bg-primary-soft/50 text-foreground",
              !done && !active && "border-border/70 bg-card text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.7rem] font-semibold",
                done && "border-verified bg-verified text-verified-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border",
              )}
            >
              {done ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : active ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                stepIndex + 1
              )}
            </span>
            <span className="font-medium">{step}</span>
          </li>
        );
      })}
      <li
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold",
          activeStep >= PIPELINE_STEPS.length
            ? "border-verified/30 bg-verified-soft text-verified"
            : "border-border/70 bg-card text-muted-foreground",
        )}
      >
        <span className="flex size-6 items-center justify-center rounded-full border border-current">
          <Check className="size-3.5" aria-hidden="true" />
        </span>
        Analysis complete
      </li>
    </ol>
  );
}
