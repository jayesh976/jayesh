import { beforeAll, describe, expect, it } from "vitest";

let app: typeof import("../server/index").app;

beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  ({ app } = await import("../server/index"));
});

const post = (body: unknown) =>
  app.request("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

describe("POST /api/generate", () => {
  it("returns a validated process from the offline parser when no key is set", async () => {
    const res = await post({ description: "Customer sends an order. Sales checks the order and confirms it." });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("offline");
    expect(body.process.lanes.map((l: { name: string }) => l.name)).toEqual(["Customer", "Sales"]);
  });

  it("rejects empty and oversized input with a readable message", async () => {
    const empty = await post({ description: "   " });
    expect(empty.status).toBe(400);
    expect((await empty.json()).error).toMatch(/full sentence/);
    const long = await post({ description: "a".repeat(9000) });
    expect(long.status).toBe(400);
    expect((await long.json()).error).toMatch(/too long/);
  });

  it("rejects malformed JSON", async () => {
    const res = await app.request("/api/generate", { method: "POST", body: "{" });
    expect(res.status).toBe(400);
  });
});
