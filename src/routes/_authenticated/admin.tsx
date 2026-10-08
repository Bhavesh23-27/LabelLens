import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Trash2, UserPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/labellens/site-layout";
import { NovaBadge, StatusPill } from "@/components/labellens/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminDeleteReport,
  adminDemoteUser,
  adminListAdmins,
  adminListReports,
  adminOverview,
  adminPromoteUser,
  checkIsAdmin,
} from "@/lib/labellens.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Knowledge Base Admin — LabelLens" },
      {
        name: "description",
        content: "Administrator view of the LabelLens knowledge base: coverage, unmatched ingredients and analysis quality metrics.",
      },
      { property: "og:title", content: "Knowledge Base Admin — LabelLens" },
      { property: "og:description", content: "Coverage, review queue and quality metrics for the LabelLens knowledge base." },
    ],
  }),
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/saved" });
  },
  errorComponent: () => (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <p className="text-muted-foreground">Something went wrong loading the admin view.</p>
        <Button asChild className="mt-4">
          <Link to="/saved">Go to My scans</Link>
        </Button>
      </div>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-14 md:px-6">
        <p className="text-muted-foreground">Admin page not found.</p>
      </div>
    </PageShell>
  ),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(adminOverview);
  const fetchAdmins = useServerFn(adminListAdmins);
  const fetchReports = useServerFn(adminListReports);
  const promote = useServerFn(adminPromoteUser);
  const demote = useServerFn(adminDemoteUser);
  const deleteReport = useServerFn(adminDeleteReport);

  const [promoteEmail, setPromoteEmail] = useState("");

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
  });

  const admins = useQuery({
    queryKey: ["admin-list"],
    queryFn: () => fetchAdmins(),
  });

  const reports = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => fetchReports(),
  });

  const promoteMutation = useMutation({
    mutationFn: (email: string) => promote({ data: { email } }),
    onSuccess: () => {
      toast.success("User promoted to admin.");
      setPromoteEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not promote user.");
    },
  });

  const demoteMutation = useMutation({
    mutationFn: (userId: string) => demote({ data: { userId } }),
    onSuccess: () => {
      toast.success("Admin access removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not remove admin access.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReport({ data: { id } }),
    onSuccess: () => {
      toast.success("Report deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-reports", "admin-overview"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete report.");
    },
  });

  const data = overview.data;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-14 md:px-6">
        <div className="flex items-start gap-3">
          <Shield className="mt-1 size-6 text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-semibold">Knowledge base admin</h1>
            <p className="mt-2 text-muted-foreground">
              Administrator-only view. Manage the knowledge base, review user reports and control
              admin access.
            </p>
          </div>
        </div>

        {overview.isLoading ? <p className="mt-8 text-sm text-muted-foreground">Loading…</p> : null}

        {data ? (
          <>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Scans", data.totalScans],
                ["Analyses", data.totalAnalyses],
                ["Ingredients in KB", data.ingredientCount],
                ["Unmatched queue", data.unknownQueue.length],
                ["Avg Insight Score", data.averageScore ?? "—"],
                ["Low-confidence analyses", data.lowConfidenceAnalyses],
              ].map(([label, value]) => (
                <div key={String(label)} className="surface p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-2 font-display text-2xl font-semibold">{String(value)}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-12 font-display text-xl font-semibold">Processing distribution</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-4">
              {data.novaDistribution.map((entry) => (
                <li key={entry.novaClass} className="surface p-4">
                  <p className="text-xs text-muted-foreground">NOVA {entry.novaClass}</p>
                  <p className="mt-1 font-display text-xl font-semibold">{entry.count}</p>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-display text-xl font-semibold">Most common findings</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {data.topFlags.map((flag) => (
                <li key={flag.code}>
                  <StatusPill severity="neutral">
                    {flag.code.replaceAll("_", " ")} · {flag.count}
                  </StatusPill>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 font-display text-xl font-semibold">Review queue</h2>
            <ul className="mt-4 space-y-2">
              {data.unknownQueue.length === 0 ? (
                <li className="surface p-4 text-sm text-muted-foreground">
                  Nothing awaiting review.
                </li>
              ) : null}
              {data.unknownQueue.map((row: any) => (
                <li
                  key={row.id as string}
                  className="surface flex items-center justify-between gap-3 p-4"
                >
                  <span>
                    <span className="font-medium">{row.raw_name as string}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      seen {String(row.occurrences ?? 1)}×
                    </span>
                  </span>
                  <StatusPill severity={row.status === "resolved" ? "verified" : "attention"}>
                    {(row.status as string) ?? "pending"}
                  </StatusPill>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {/* Admin access management */}
        <section className="mt-14 border-t border-border pt-10">
          <div className="flex items-center gap-2">
            <UsersRound className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold">Admin access</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Admins can edit the knowledge base and manage reports. The first registered user is
            automatically an admin.
          </p>

          <div className="surface mt-6 p-5">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                if (!promoteEmail) return;
                if (!confirm(`Promote ${promoteEmail} to admin?`)) return;
                promoteMutation.mutate(promoteEmail);
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="promote-email">Promote by email</Label>
                <Input
                  id="promote-email"
                  type="email"
                  placeholder="user@example.com"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  disabled={promoteMutation.isPending}
                />
              </div>
              <Button type="submit" disabled={!promoteEmail || promoteMutation.isPending}>
                <UserPlus className="mr-1.5 size-4" aria-hidden="true" />
                Promote
              </Button>
            </form>
          </div>

          <ul className="mt-4 space-y-2">
            {admins.isLoading ? (
              <li className="text-sm text-muted-foreground">Loading admins…</li>
            ) : null}
            {(admins.data ?? []).map((admin: any) => (
              <li
                key={admin.id}
                className="surface flex items-center justify-between gap-3 p-4"
              >
                <span>
                  <span className="font-medium">{admin.displayName}</span>
                  <span className="ml-2 text-xs font-mono text-muted-foreground">
                    {admin.userId.slice(0, 8)}…
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={demoteMutation.isPending}
                  onClick={() => {
                    if (!confirm("Remove admin access from this user?")) return;
                    demoteMutation.mutate(admin.userId);
                  }}
                >
                  Remove admin
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* Reports */}
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-display text-xl font-semibold">Recent reports</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Latest saved analyses from users. You can remove spam or inappropriate reports.
          </p>

          <ul className="mt-6 space-y-3">
            {reports.isLoading ? (
              <li className="text-sm text-muted-foreground">Loading reports…</li>
            ) : null}
            {(reports.data ?? []).map((row: any) => {
              const scan = row.product_scans as {
                product_name?: string | null;
                brand?: string | null;
                input_method?: string | null;
                created_at?: string | null;
              } | null;
              const userId = (row.user_id as string) ?? "";
              return (
                <li
                  key={row.id as string}
                  className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {scan?.product_name ?? "Unnamed product"}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {scan?.brand ?? "Brand not given"} ·{" "}
                      {userId ? `User ${userId.slice(0, 8)}…` : "Unknown user"} ·{" "}
                      {new Date(row.created_at as string).toLocaleString()}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      <NovaBadge novaClass={row.nova_class as number} />
                      <StatusPill severity="neutral">Score {row.insight_score as number}</StatusPill>
                      {row.is_demo ? <StatusPill severity="attention">Demo</StatusPill> : null}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/analysis/$id" params={{ id: row.id as string }}>
                        Open
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (!confirm("Delete this report and its scan?")) return;
                        deleteMutation.mutate(row.id as string);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
