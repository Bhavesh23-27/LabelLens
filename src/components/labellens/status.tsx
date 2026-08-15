import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { FlagSeverity } from "@/lib/engine/types";

const SEVERITY_CLASS: Record<FlagSeverity, string> = {
  verified: "bg-verified-soft text-verified border-verified/25",
  attention: "bg-attention-soft text-attention-foreground border-attention/30",
  concern: "bg-concern-soft text-concern border-concern/25",
  neutral: "bg-neutralinfo-soft text-muted-foreground border-border",
};

export function StatusPill({
  severity = "neutral",
  children,
  className,
}: {
  severity?: FlagSeverity;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        SEVERITY_CLASS[severity],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Maps a regulatory permission status to restrained semantic colour + wording. */
export function regulatoryPresentation(status: string | null | undefined): {
  label: string;
  severity: FlagSeverity;
  plain: string;
} {
  switch (status) {
    case "permitted":
      return {
        label: "Permitted",
        severity: "verified",
        plain: "Referenced regulatory information lists this as permitted, subject to good manufacturing practice.",
      };
    case "permitted-under-conditions":
      return {
        label: "Permitted under conditions",
        severity: "attention",
        plain: "Permitted only in specified food categories and within prescribed limits. The label alone does not show the quantity used.",
      };
    case "restricted":
      return {
        label: "Restricted",
        severity: "concern",
        plain: "Referenced regulatory information places restrictions on this substance.",
      };
    case "not-permitted":
      return {
        label: "Not permitted",
        severity: "concern",
        plain: "Referenced regulatory information records this as not permitted for the stated use.",
      };
    case "not-applicable":
      return {
        label: "Not applicable",
        severity: "neutral",
        plain: "No additive-specific rule applies to this ingredient.",
      };
    default:
      return {
        label: "Insufficient information",
        severity: "neutral",
        plain: "The LabelLens knowledge base does not hold verified regulatory information for this entry. Not found does not mean banned.",
      };
  }
}

export function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const map = {
    high: { severity: "verified" as FlagSeverity, text: "High confidence" },
    medium: { severity: "attention" as FlagSeverity, text: "Medium confidence" },
    low: { severity: "concern" as FlagSeverity, text: "Low confidence" },
  };
  return <StatusPill severity={map[level].severity}>{map[level].text}</StatusPill>;
}

export function NovaBadge({ novaClass }: { novaClass: number }) {
  const severity: FlagSeverity =
    novaClass >= 4 ? "attention" : novaClass === 3 ? "attention" : "verified";
  const names: Record<number, string> = {
    1: "Minimally processed",
    2: "Culinary ingredient",
    3: "Processed",
    4: "Ultra-processed",
  };
  return (
    <StatusPill severity={severity} className="font-semibold">
      NOVA {novaClass} · {names[novaClass] ?? "Unclassified"}
    </StatusPill>
  );
}
