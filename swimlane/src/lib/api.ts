import type { GenerateResponse } from "../shared/schema";

export class GenerateError extends Error {}

const TIMEOUT_MS = 180_000;

/** Call the server; every failure becomes a GenerateError with a user-readable message. */
export async function generateProcess(description: string, signal?: AbortSignal): Promise<GenerateResponse> {
  if (import.meta.env.VITE_PREVIEW === "1") return generateInBrowser(description);
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

/** Static preview builds have no server: run the offline parser and the same validation in the browser. */
async function generateInBrowser(description: string): Promise<GenerateResponse> {
  const [{ parseProcessOffline }, { sanitizeProcess }, { GenerateRequestSchema }] = await Promise.all([
    import("../../server/offlineParser"),
    import("../shared/normalize"),
    import("../shared/schema"),
  ]);
  const input = GenerateRequestSchema.safeParse({ description });
  if (!input.success) throw new GenerateError(input.error.issues[0]?.message ?? "Invalid description.");
  try {
    const { process, warnings } = sanitizeProcess(parseProcessOffline(input.data.description));
    return { process, source: "offline", warnings };
  } catch {
    throw new GenerateError("No process steps could be identified. Try rephrasing the description.");
  }
}
