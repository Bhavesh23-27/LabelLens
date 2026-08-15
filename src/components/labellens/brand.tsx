import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function LabelLensMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-[0.7rem] bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="M14.8 14.8 20 20" strokeLinecap="round" />
        <path d="M8 9.4h5M8 12h3.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function LabelLensLogo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-2.5", className)} aria-label="LabelLens home">
      <LabelLensMark className="transition-transform group-hover:-rotate-6" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight">LabelLens</span>
        <span className="text-[0.64rem] uppercase tracking-[0.18em] text-muted-foreground">
          Understand what you eat
        </span>
      </span>
    </Link>
  );
}
