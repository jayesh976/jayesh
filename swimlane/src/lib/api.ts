import type { GenerateResponse } from "../shared/schema";

export class GenerateError extends Error {}

const TIMEOUT_MS = 180_000;

/** Call the server; every failure becomes a GenerateError with a user-readable message. */
export async function generateProcess(description: string, signal?: AbortSignal): Promise<GenerateResponse> {
  if (import.meta.env.VITE_PREVIEW === "1") return generateInBrowser(description, signal);
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) throw new GenerateError("Generation was cancelled.");
    if (timeout.aborted) throw new GenerateError("Generation took too long. Try a shorter description.");
    throw new GenerateError("Could not reach the server. Check your connection and try again.");
  }
  const body = (await response.json().catch(() => null)) as (GenerateResponse & { error?: string }) | null;
  if (!response.ok || !body) {
    throw new GenerateError(body?.error ?? "Something went wrong while generating the diagram.");
  }
  return body;
}

/** Codes after which Claude cannot be used in this view, so the offline parser takes over. */
const UNAVAILABLE = new Set(["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"]);

/**
 * Static preview builds have no server. Inside a Claude viewer they ask Claude
 * through the viewer's own account; otherwise, or if that is declined, they use
 * the offline parser. Either way the result goes through the same validation.
 */
async function generateInBrowser(description: string, signal?: AbortSignal): Promise<GenerateResponse> {
  const [{ parseProcessOffline }, { sanitizeProcess, ProcessValidationError }, { GenerateRequestSchema }, { PROCESS_PROMPT, PROCESS_JSON_SHAPE }, runtime] =
    await Promise.all([
      import("../../server/offlineParser"),
      import("../shared/normalize"),
      import("../shared/schema"),
      import("../shared/prompt"),
      import("./claudeRuntime"),
    ]);
  const input = GenerateRequestSchema.safeParse({ description });
  if (!input.success) throw new GenerateError(input.error.issues[0]?.message ?? "Invalid description.");

  const offline = (): GenerateResponse => {
    try {
      const { process, warnings } = sanitizeProcess(parseProcessOffline(input.data.description));
      return { process, source: "offline", warnings };
    } catch {
      throw new GenerateError("No process steps could be identified. Try rephrasing the description.");
    }
  };

  const sample = await runtime.useSample();
  if (!sample) return offline();

  let raw: unknown;
  try {
    raw = await sample.json(
      `${PROCESS_PROMPT}\n\n${PROCESS_JSON_SHAPE}\n\nProcess description:\n<description>\n${input.data.description}\n</description>`,
      { signal, cache: false },
    );
  } catch (e) {
    const code = runtime.isSampleError(e) ? e.code : "upstream_error";
    if (UNAVAILABLE.has(code)) return offline();
    if (code === "cancelled") throw new GenerateError("Generation was cancelled.");
    if (code === "rate_limited") throw new GenerateError("Claude is busy for your account right now. Try again in a minute.");
    if (code === "session_expired") throw new GenerateError("Your Claude session expired. Sign in again and retry.");
    if (code === "refused") throw new GenerateError("Claude declined this description. Try rewording it.");
    if (code === "prompt_too_large") throw new GenerateError("The description is too long. Shorten it and try again.");
    if (code === "invalid_json") throw new GenerateError("Claude's answer could not be read as a diagram. Try again.");
    throw new GenerateError("Could not reach Claude. Try again.");
  }
  try {
    const { process, warnings } = sanitizeProcess(raw);
    return { process, source: "ai", warnings };
  } catch (e) {
    if (e instanceof ProcessValidationError) throw new GenerateError(`${e.message} Try again or rephrase the description.`);
    throw e;
  }
}
