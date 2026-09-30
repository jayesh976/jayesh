import type { GenerateResponse } from "../shared/schema";

export class GenerateError extends Error {}

const TIMEOUT_MS = 180_000;

/** Call the server; every failure becomes a GenerateError with a user-readable message. */
export async function generateProcess(description: string, signal?: AbortSignal): Promise<GenerateResponse> {
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
