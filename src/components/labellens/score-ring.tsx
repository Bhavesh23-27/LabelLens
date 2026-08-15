import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 132,
  label = "Insight Score",
  className,
}: {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const stroke =
    score >= 70 ? "var(--verified)" : score >= 45 ? "var(--attention)" : "var(--concern)";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`${label}: ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: "stroke-dashoffset 900ms ease-out" }}
        />
      </svg>
      <span className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-semibold leading-none">{score}</span>
        <span className="mt-1 text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
          / 100
        </span>
      </span>
    </div>
  );
}
