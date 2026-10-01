import "./env";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import Anthropic from "@anthropic-ai/sdk";
import { Hono } from "hono";
import { GenerateRequestSchema, type GenerateResponse } from "../src/shared/schema";
import { ProcessValidationError, sanitizeProcess } from "../src/shared/normalize";
import { aiConfigured, AiUnavailableError, generateWithClaude } from "./ai";
import { parseProcessOffline } from "./offlineParser";

export const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true, ai: aiConfigured() }));

app.post("/api/generate", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "The request could not be read." }, 400);
  }
  const input = GenerateRequestSchema.safeParse(body);
  if (!input.success) {
    return c.json({ error: input.error.issues[0]?.message ?? "Invalid description." }, 400);
  }
  const description = input.data.description;

  try {
    const source = aiConfigured() ? "ai" : "offline";
    const raw = source === "ai" ? await generateWithClaude(description) : parseProcessOffline(description);
    const { process, warnings } = sanitizeProcess(raw);
    return c.json({ process, source, warnings } satisfies GenerateResponse);
  } catch (error) {
    if (error instanceof ProcessValidationError) {
      console.warn("[generate] invalid process:", error.message, error.details);
      return c.json({ error: `${error.message} Try rephrasing the description.` }, 422);
    }
    if (error instanceof AiUnavailableError) {
      return c.json({ error: error.message }, 502);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return c.json({ error: "The AI service is busy. Please try again in a moment." }, 503);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[generate] AI authentication failed; check ANTHROPIC_API_KEY");
      return c.json({ error: "The AI service is not configured correctly." }, 503);
    }
    if (error instanceof Anthropic.APIConnectionError || error instanceof Anthropic.APIError) {
      console.error("[generate] AI request failed:", error.message);
      return c.json({ error: "The AI service could not be reached. Please try again." }, 502);
    }
    console.error("[generate] unexpected error:", error);
    return c.json({ error: "Something went wrong while generating the diagram." }, 500);
  }
});

if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const port = Number(process.env.PORT) || 8787;
if (!process.env.VITEST) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`API listening on http://localhost:${port} (${aiConfigured() ? "AI" : "offline parser"} mode)`);
  });
}
