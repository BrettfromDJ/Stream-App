import "server-only";
import { ProviderError } from "@/lib/providers/http";

/**
 * Minimal OpenAI client (Chat Completions + JSON schema output).
 * The key never leaves the server. OPENAI_MODEL / OPENAI_SMART_MODEL can pin models; otherwise we
 * try sensible defaults in order until one is available on the account.
 */

const API = "https://api.openai.com/v1/chat/completions";
export type ModelTier = "fast" | "smart";

/** Tried in order until one is available on the account. */
const DEFAULT_MODELS: Record<ModelTier, string[]> = {
  // Browsing ("books about gold mining"): quick and cheap.
  fast: ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"],
  // Naming one specific title from a plot description: needs broader knowledge and some thought.
  smart: ["gpt-4.1", "gpt-5", "gpt-4o", "gpt-5-mini"],
};

const ENV_MODEL: Record<ModelTier, string> = { fast: "OPENAI_MODEL", smart: "OPENAI_SMART_MODEL" };

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function models(tier: ModelTier) {
  const pinned = process.env[ENV_MODEL[tier]]?.trim();
  return pinned ? [pinned] : DEFAULT_MODELS[tier];
}

// Remembers which default model worked per tier, so later calls skip the ones that didn't.
const working: Partial<Record<ModelTier, string>> = {};

interface ChatResponse {
  choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
}

/** Asks for a JSON object matching `schema`. Identical requests are cached for a day. */
export async function chatJson<T>(opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: object;
  timeoutMs?: number;
  tier?: ModelTier;
}): Promise<T> {
  const tier = opts.tier ?? "fast";
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new ProviderError("openai", "not_configured");

  const remembered = working[tier];
  const candidates = remembered ? [remembered] : models(tier);
  let lastError = "";
  for (const model of candidates) {
    let res: Response;
    try {
      res = await fetch(API, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
          response_format: { type: "json_schema", json_schema: { name: opts.schemaName, strict: true, schema: opts.schema } },
          // Reasoning models (gpt-5*, o*) think at length by default; recommendations don't need it.
          ...(/^(gpt-5|o\d)/.test(model) ? { reasoning_effort: tier === "smart" ? "low" : "minimal" } : {}),
        }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
        next: { revalidate: 60 * 60 * 24 },
      });
    } catch (err) {
      const timedOut = (err as Error).name === "TimeoutError" || (err as Error).name === "AbortError";
      throw new ProviderError("openai", "unavailable", timedOut ? "The AI took too long to answer. Try again in a moment." : (err as Error).message);
    }

    if (!res.ok) {
      const err = await errorOf(res);
      console.error(`[openai] ${model}: HTTP ${res.status} ${err.code ?? ""} ${err.message}`);
      if (res.status === 401 || res.status === 403) throw new ProviderError("openai", "not_configured", `OpenAI rejected the API key. ${err.message}`);
      if (res.status === 429) {
        throw new ProviderError(
          "openai",
          "rate_limited",
          err.code === "insufficient_quota" ? "Your OpenAI account is out of credit — add some under Billing." : `OpenAI is rate limiting requests. ${err.message}`,
        );
      }
      if (res.status === 400 || res.status === 404) {
        // Usually "model not found / not available on this account": try the next one.
        lastError = `${model}: ${err.message}`;
        continue;
      }
      throw new ProviderError("openai", "unavailable", `OpenAI error ${res.status}. ${err.message}`);
    }

    const data = (await res.json()) as ChatResponse;
    const choice = data.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      const why = choice?.message?.refusal ?? (choice?.finish_reason === "length" ? "The answer was cut off (too long)." : "Empty response.");
      console.error(`[openai] ${model}: ${why}`);
      throw new ProviderError("openai", "unavailable", why);
    }
    if (!process.env[ENV_MODEL[tier]]) working[tier] = model;
    try {
      return JSON.parse(content) as T;
    } catch {
      throw new ProviderError("openai", "unavailable", "Invalid JSON from model");
    }
  }
  throw new ProviderError("openai", "unavailable", lastError || "No model available");
}

async function errorOf(res: Response): Promise<{ message: string; code?: string }> {
  const text = await res.text().catch(() => "");
  try {
    const e = (JSON.parse(text) as { error?: { message?: string; code?: string } }).error;
    return { message: (e?.message ?? text).slice(0, 300), code: e?.code };
  } catch {
    return { message: text.slice(0, 300) };
  }
}
