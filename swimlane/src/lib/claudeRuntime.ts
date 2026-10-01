/**
 * Minimal typing for the claude.ai artifact runtime, present only when the
 * hosted preview runs inside a Claude viewer. Everything here may be absent.
 */
export interface SampleError {
  code: string;
  message: string;
  text?: string;
}

interface SampleFn {
  (input: string, options?: { signal?: AbortSignal; modelTier?: "quick" | "default" | "complex"; cache?: boolean }): Promise<{ text: string }>;
  json<T = unknown>(input: string, options?: { signal?: AbortSignal; modelTier?: "quick" | "default" | "complex"; cache?: boolean }): Promise<T>;
}

interface Downloads {
  save(request: { filename: string; data: Blob | string }): Promise<{ status: "saved" | "delivered" }>;
}

interface ClaudeRuntime {
  use(name: "sample"): Promise<SampleFn | null>;
  use(name: "downloads"): Promise<Downloads | null>;
}

const runtime = (): ClaudeRuntime | undefined => (window as unknown as { claude?: ClaudeRuntime }).claude;

export async function useSample(): Promise<SampleFn | null> {
  try {
    return (await runtime()?.use("sample")) ?? null;
  } catch {
    return null;
  }
}

export async function useDownloads(): Promise<Downloads | null> {
  try {
    return (await runtime()?.use("downloads")) ?? null;
  } catch {
    return null;
  }
}

export const isSampleError = (e: unknown): e is SampleError =>
  typeof e === "object" && e !== null && typeof (e as SampleError).code === "string";
