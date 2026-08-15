import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageShell } from "@/components/labellens/site-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My LabelLens Account" },
      { name: "description", content: "Manage your LabelLens account and saved ingredient analyses." },
      { property: "og:title", content: "My LabelLens Account" },
      { property: "og:description", content: "Manage your LabelLens account and saved analyses." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-14 md:px-6">
        <h1 className="text-3xl font-semibold">Your account</h1>
        <div className="surface mt-6 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Signed in as
          </p>
          <p className="mt-1 font-medium">{user?.email ?? "—"}</p>
        </div>
        <div className="surface mt-4 p-5">
          <h2 className="font-display text-lg font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved analyses are private to your account. Label photos are used only to extract text
            during an analysis and are not stored.
          </p>
        </div>
        <Button
          className="mt-6"
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
            navigate({ to: "/" });
          }}
        >
          Sign out
        </Button>
      </div>
    </PageShell>
  );
}
