import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { PROCESS_PROMPT } from "../src/shared/prompt";
import { AiProcessSchema } from "../src/shared/schema";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export class AiUnavailableError extends Error {}

/**
 * Ask Claude for a structured process model. The response is constrained to the
 * JSON schema derived from AiProcessSchema; the caller still sanitizes it.
 */
export async function generateWithClaude(description: string): Promise<unknown> {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(AiProcessSchema),
    },
    system: PROCESS_PROMPT,
    messages: [
      {
        role: "user",
        content: `Process description:\n<description>\n${description}\n</description>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new AiUnavailableError("The AI declined to process this description.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiUnavailableError("The process is too large to generate in one pass. Try splitting it.");
  }
  if (!response.parsed_output) {
    throw new AiUnavailableError("The AI returned a response that could not be read.");
  }
  return response.parsed_output;
}
