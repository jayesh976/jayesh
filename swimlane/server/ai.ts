import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AiProcessSchema } from "../src/shared/schema";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

const SYSTEM_PROMPT = `You convert plain-language descriptions of business and industrial processes into a structured swimlane process model.

Lanes are the departments, teams, roles or external parties responsible for steps. Nodes are the steps. Connections are the flow between steps.

Rules:
- Only create lanes that the description supports. Never invent departments. Use the user's own names for them.
- Only create steps that the description supports. Never add activities the user did not describe or clearly imply.
- Keep labels concise (at most about 6 words), in verb-object form for activities ("Verify order"), in professional business wording, preserving the user's terminology. No sentences or paragraphs in labels.
- Use one "start" node where the process begins and an "end" node for each way it can finish.
- Use "decision" nodes for conditions, phrased as a question ending in "?" ("Stock available?"). Label each outgoing connection of a decision "Yes" or "No" (or the stated outcome). Every other connection has label null.
- Use "document" nodes only for documents or records that the description explicitly names as inputs or outputs.
- Place every step in the lane of the party that performs it. A decision belongs to the party that makes it.
- Represent loops and parallel paths only when the description clearly indicates them.
- If the description is ambiguous, choose the most reasonable interpretation, set uncertain=true on the affected steps, and state the assumption in summary.notes.
- Ids must be unique short strings. Every connection must reference existing node ids, and every node must reference an existing lane id.
- summary.inputs lists the inputs to the process (orders, materials, documents, requests); summary.outputs lists what it produces.`;

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
    system: SYSTEM_PROMPT,
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
