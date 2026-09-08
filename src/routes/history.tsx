import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AnalysisDashboard } from "@/components/labellens/analysis-dashboard";
import { PageShell } from "@/components/labellens/site-layout";
import { NovaBadge, StatusPill } from "@/components/labellens/status";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { clearLocalScans, getLocalScans, removeLocalScan, type LocalScan } from "@/lib/local-history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "My Scan History — LabelLens" },
      {
        name: "description",
        content:
          "Every label you analysed on this device, with its Insight Score, processing level and full ingredient breakdown.",
      },
      { property: "og:title", content: "My Scan History — LabelLens" },
      { property: "og:description", content: "Reopen any label you analysed on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [scans, setScans] = useState<LocalScan[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setScans(getLocalScans());
    setReady(true);
  }, []);

  const open = scans.find((scan) => scan.id === openId) ?? null;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <h1 className="text-3xl font-semibold">Scan history</h1>
        <p className="mt-2 text-muted-foreground">
          Every label you analysed on this device, newest first. Kept privately in this browser — no
          account needed.
        </p>

        {isAuthenticated ? (
          <Button asChild variant="outline" className="mt-4">
            <Link to="/saved">Scans saved to my account</Link>
          </Button>
        ) : null}

        {ready && scans.length === 0 ? (
          <div className="surface mt-8 p-6">
            <p className="font-medium">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Analyse a label and it will show up here automatically.
            </p>
            <Button asChild className="mt-4">
              <Link to="/scan">Scan a product</Link>
            </Button>
          </div>
        ) : null}

        {scans.length > 0 ? (
          <>
            <ul className="mt-8 space-y-3">
              {scans.map((scan) => (
                <li key={scan.id} className="surface flex items-center gap-4 p-4">
                  <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft">
                    <span className="font-display text-lg font-semibold text-primary">{scan.score}</span>
                    <span className="text-[0.6rem] text-muted-foreground">/100</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === scan.id ? null : scan.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-medium">
                      {scan.productName ?? "Unnamed product"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {scan.brand ?? "Brand not given"} · {new Date(scan.savedAt).toLocaleString()}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <NovaBadge novaClass={scan.novaClass} />
                      {openId === scan.id ? <StatusPill severity="verified">Open</StatusPill> : null}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove this scan"
                    onClick={() => {
                      removeLocalScan(scan.id);
                      setScans(getLocalScans());
                      if (openId === scan.id) setOpenId(null);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                clearLocalScans();
                setScans([]);
                setOpenId(null);
              }}
            >
              Clear history
            </Button>
          </>
        ) : null}

        {open ? (
          <div className="mt-10">
            <AnalysisDashboard report={open.report} />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
