import type { AnalysisReport } from "@/lib/engine/types";

export type LocalScan = {
  id: string;
  savedAt: string;
  productName: string | null;
  brand: string | null;
  score: number;
  novaClass: 1 | 2 | 3 | 4;
  report: AnalysisReport;
};

const KEY = "labellens.scan-history.v1";
const LIMIT = 25;

function canUse() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLocalScans(): LocalScan[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalScan[]) : [];
  } catch {
    return [];
  }
}

function write(scans: LocalScan[]) {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(scans.slice(0, LIMIT)));
  } catch {
    /* storage full or blocked — history is best-effort */
  }
}

export function addLocalScan(report: AnalysisReport, productName?: string | null, brand?: string | null) {
  if (!canUse()) return null;
  const entry: LocalScan = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    productName: (productName?.trim() || report.input.productName) ?? null,
    brand: (brand?.trim() || report.input.brand) ?? null,
    score: report.score.total,
    novaClass: report.nova.novaClass,
    report,
  };
  write([entry, ...getLocalScans()]);
  return entry;
}

export function removeLocalScan(id: string) {
  write(getLocalScans().filter((scan) => scan.id !== id));
}

export function clearLocalScans() {
  if (!canUse()) return;
  window.localStorage.removeItem(KEY);
}
