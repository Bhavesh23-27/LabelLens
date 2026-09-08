import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/labellens.functions";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function resolveAdmin(user: User | null) {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const result = await checkIsAdmin();
        if (!active) return;
        setIsAdmin(result.isAdmin);
      } catch {
        if (!active) return;
        setIsAdmin(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      resolveAdmin(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      resolveAdmin(next?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = session?.user ?? null;
  return {
    session,
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: isAdmin ?? false,
  };
}
