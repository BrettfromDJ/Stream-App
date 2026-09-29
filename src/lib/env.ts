/**
 * Central place for environment access.
 * Server-only secrets are read lazily inside server modules and never exported to the client.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Without Supabase the app runs in a read-only preview with sample content. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
