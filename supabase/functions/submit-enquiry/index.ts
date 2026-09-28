import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LIMITS: Record<string, [number, number, boolean]> = {
  name: [1, 120, true],
  company: [0, 160, false],
  phone: [6, 30, true],
  email: [0, 200, false],
  category: [1, 120, true],
  quantity: [0, 200, false],
  location: [0, 200, false],
  details: [1, 5000, true],
};
const MAX_PER_WINDOW = 5;
const WINDOW_MINUTES = 10;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  // Honeypot: real visitors never see or fill this field.
  if (typeof input.website === "string" && input.website.trim() !== "") return json(200, { ok: true });

  const row: Record<string, string | null> = {};
  for (const [key, [min, max, required]] of Object.entries(LIMITS)) {
    const raw = typeof input[key] === "string" ? (input[key] as string).trim() : "";
    if (required && raw.length < min) return json(400, { error: `Please fill in the ${key} field.`, field: key });
    if (raw.length > max) return json(400, { error: `The ${key} field is too long.`, field: key });
    row[key] = raw === "" ? null : raw;
  }
  if (!/^[+()\d\s-]{6,30}$/.test(row.phone!) || (row.phone!.match(/\d/g) || []).length < 7) {
    return json(400, { error: "Please enter a valid phone number.", field: "phone" });
  }
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return json(400, { error: "Please enter a valid email address.", field: "email" });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ipHash = await sha256(ip + "|" + Deno.env.get("SUPABASE_URL"));
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_WINDOW) {
    return json(429, { error: "Too many requests. Please wait a few minutes or call us directly." });
  }

  const { data, error } = await supabase.from("enquiries").insert({ ...row, ip_hash: ipHash }).select("id, created_at").single();
  if (error) {
    console.error("insert failed", error);
    return json(500, { error: "We could not save your requirement. Please call or WhatsApp us." });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const to = Deno.env.get("NOTIFY_EMAIL") || "shreemahaganapati72@gmail.com";
    const from = Deno.env.get("RESEND_FROM") || "Shree Mahaganpati Website <onboarding@resend.dev>";
    const lines: [string, string | null][] = [
      ["Name", row.name], ["Company", row.company], ["Phone", row.phone], ["Email", row.email],
      ["Category", row.category], ["Quantity", row.quantity], ["Delivery location", row.location],
    ];
    const html =
      `<h2 style="font-family:Arial,sans-serif;color:#0f2a5c">New requirement from the website</h2>` +
      `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">` +
      lines.map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#3d4f69">${k}</td><td style="padding:6px 0;font-weight:bold">${esc(v || "—")}</td></tr>`).join("") +
      `</table><h3 style="font-family:Arial,sans-serif;color:#0f2a5c">Requirement details</h3>` +
      `<p style="font-family:Arial,sans-serif;font-size:14px;white-space:pre-wrap">${esc(row.details!)}</p>`;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `Requirement: ${row.category} — ${row.name}${row.company ? ` (${row.company})` : ""}`,
          html,
          ...(row.email ? { reply_to: row.email } : {}),
        }),
      });
      if (res.ok) await supabase.from("enquiries").update({ email_notified: true }).eq("id", data.id);
      else console.error("resend failed", res.status, await res.text());
    } catch (e) {
      console.error("resend error", e);
    }
  }

  return json(200, { ok: true, id: data.id });
});
