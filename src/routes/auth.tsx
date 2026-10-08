import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/hooks/useAuth";
import { LabelLensLogo } from "@/components/labellens/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in to LabelLens" },
      {
        name: "description",
        content:
          "Sign in to save your ingredient analyses, revisit past scans and compare packaged products over time.",
      },
      { property: "og:title", content: "Sign in to LabelLens" },
      {
        property: "og:description",
        content: "Save and revisit your ingredient analyses with a free LabelLens account.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

function safePath(value: string | undefined) {
  if (!value) return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const destination = safePath(search.redirect);
  const { isAuthenticated, loading } = useAuth();
  const [useBroker, setUseBroker] = useState(true);

  useEffect(() => {
    const host = window.location.hostname;
    setUseBroker(host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com"));
  }, []);


  // Already signed in (including right after a Google redirect back here) — move on.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: destination, replace: true });
    }
  }, [loading, isAuthenticated, destination, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${destination}`,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your inbox to confirm your email, then sign in.");
        setMode("signin");
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: destination, replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/auth?redirect=${encodeURIComponent(destination)}`;
      const notReady =
        "Google sign-in isn't available on this site yet. Please sign in with email and password.";

      // Own hosting (Vercel, localhost, custom domain): use the standard Google flow
      // directly, but check first that it is configured so users never hit an error page.
      if (!useBroker) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
        });
        if (error || !data?.url) {
          toast.error(error && !/secret|provider/i.test(error.message) ? error.message : notReady);
          return;
        }
        try {
          const probe = await fetch(data.url, { redirect: "manual" });
          if (probe.type !== "opaqueredirect" && !probe.ok && probe.status >= 400) {
            toast.error(notReady);
            return;
          }
        } catch {
          // Network/CORS quirk — fall through and let the browser try.
        }
        window.location.assign(data.url);
        return;
      }


      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo,
      });
      if (result.error) {
        toast.error("Google sign-in didn't complete. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: destination, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4 py-14">
      <LabelLensLogo />
      <div className="surface mt-8 w-full max-w-md p-6 md:p-8">
        <h1 className="font-display text-2xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saving scans is optional — analysis works without an account. Sign in to keep a history
          and compare products.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={handleGoogle}
          disabled={busy}
        >
          Continue with Google
        </Button>


        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or use email
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={72}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to LabelLens?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
