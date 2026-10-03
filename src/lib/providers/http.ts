import "server-only";

export type ProviderName = "tmdb" | "openlibrary" | "igdb" | "hardcover" | "nyt" | "steam" | "netflix" | "omdb";

export class ProviderError extends Error {
  constructor(
    public provider: ProviderName,
    public kind: "not_configured" | "rate_limited" | "not_found" | "unavailable",
    message?: string,
  ) {
    super(message ?? `${provider}: ${kind}`);
    this.name = "ProviderError";
  }
}

interface FetchJsonOptions {
  provider: ProviderName;
  /** Seconds to cache the response in the Next.js data cache. */
  revalidate: number;
  headers?: HeadersInit;
  method?: "GET" | "POST";
  /** POST bodies are part of the cache key. */
  body?: string;
  timeoutMs?: number;
  tags?: string[];
}

export async function fetchJson<T>(url: string, opts: FetchJsonOptions): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      body: opts.body,
      headers: { Accept: "application/json", ...opts.headers },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
      next: { revalidate: opts.revalidate, tags: opts.tags },
    });
  } catch (err) {
    throw new ProviderError(opts.provider, "unavailable", (err as Error).message);
  }

  if (res.status === 404) throw new ProviderError(opts.provider, "not_found");
  if (res.status === 429) throw new ProviderError(opts.provider, "rate_limited");
  if (res.status === 401 || res.status === 403) {
    throw new ProviderError(opts.provider, "not_configured", `${opts.provider} rejected the API key`);
  }
  if (!res.ok) throw new ProviderError(opts.provider, "unavailable", `HTTP ${res.status}`);

  try {
    return (await res.json()) as T;
  } catch {
    throw new ProviderError(opts.provider, "unavailable", "Invalid JSON");
  }
}

/** Runs a provider call and returns a fallback instead of throwing (for optional UI rows). */
export async function safely<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production" || !(err instanceof ProviderError && err.kind === "not_configured")) {
      console.warn("[provider]", (err as Error).message);
    }
    return fallback;
  }
}
