import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  History as HistoryIcon,
  Home,
  ScanLine,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { LabelLensLogo, LabelLensMark } from "@/components/labellens/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/scan", label: "Scan a product" },
  { to: "/explore", label: "Ingredient index" },
  { to: "/compare", label: "Compare" },
];

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/scan", label: "Scan", icon: ScanLine },
  { to: "/saved", label: "My scans", icon: HistoryIcon },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/account", label: "Profile", icon: UserRound },
] as const;

export function SiteHeader() {
  const { isAuthenticated, isAdmin } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <LabelLensLogo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin">
                <ShieldCheck className="mr-1.5 size-4" aria-hidden="true" />
                Admin
              </Link>
            </Button>
          ) : null}
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/saved">My scans</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" aria-label="Account">
                <Link to="/account">
                  <UserRound className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/scan">
              <ScanLine className="size-4" aria-hidden="true" />
              Scan
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[0.68rem] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", item.to === "/scan" && "size-6")} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const { isAdmin, isAuthenticated } = useAuth();
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <LabelLensMark />
            <span className="font-display text-lg font-semibold">LabelLens</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            An ingredient-intelligence platform that turns packaged-food labels into plain
            language, backed by a structured ingredient and food-safety knowledge base.
          </p>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold">Product</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/scan" className="hover:text-foreground">Scan a product</Link></li>
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/explore" className="hover:text-foreground">Ingredient index</Link></li>
            <li><Link to="/compare" className="hover:text-foreground">Compare products</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-semibold">Transparency</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/sources" className="hover:text-foreground">Data sources</Link></li>
            {isAdmin ? (
              <li><Link to="/admin" className="hover:text-foreground">Knowledge base admin</Link></li>
            ) : null}
            {isAuthenticated ? (
              <li><Link to="/account" className="hover:text-foreground">Your account</Link></li>
            ) : (
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-6 md:px-6">
        <p className="mx-auto max-w-6xl text-xs leading-relaxed text-muted-foreground">
          LabelLens provides informational analysis based on available label data and referenced
          food-safety sources. It is not a substitute for professional medical, dietary or
          regulatory advice. Regulatory information may change, so always verify the latest
          official requirements.
        </p>
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={cn("flex-1 pb-24 md:pb-0", className)}>{children}</main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <Shield className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        Informational analysis only, based on the label text you provided and referenced
        food-safety sources. Not medical, dietary or regulatory advice, and not an official
        certification.
      </span>
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon = SlidersHorizontal,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: typeof SlidersHorizontal;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Icon className="size-3.5" aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{title}</h2>
      {description ? (
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
