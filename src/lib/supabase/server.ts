import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy keeps the session fresh.
        }
      },
    },
  });
}

export interface SessionUser {
  id: string;
  email: string | null;
  /** TMDB watch-provider IDs the user subscribes to (stored in auth user metadata). */
  services: number[];
}

/** Verified current user (deduped per request). Null when signed out or in preview mode. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const meta = (data.claims.user_metadata ?? {}) as { services?: unknown };
  const services = Array.isArray(meta.services) ? meta.services.filter((n): n is number => Number.isInteger(n)).slice(0, 30) : [];
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null, services };
});
