import type { AiProcess } from "../src/shared/schema";

/**
 * Rule-based fallback used when no ANTHROPIC_API_KEY is configured, so the app
 * runs end to end offline. It understands simple English process descriptions
 * ("X does Y and Z. If A is B, W does V. If A is not B, ..."). The UI tells the
 * user when this parser was used instead of the AI.
 */

const DEPARTMENTS = [
  "quality control", "quality assurance", "customer service", "human resources", "accounts payable",
  "accounts receivable", "production planning", "purchasing", "procurement", "customer", "client", "sales",
  "warehouse", "stores", "production", "manufacturing", "quality", "qc", "qa", "dispatch", "shipping",
  "logistics", "finance", "accounts", "accounting", "hr", "management", "manager", "supervisor", "supplier",
  "vendor", "it", "maintenance", "engineering", "planning", "admin", "legal", "marketing", "support",
  "operations", "security", "receiving", "billing", "packing", "transport",
].sort((a, b) => b.length - a.length);

const ARTICLES = new Set(["the", "a", "an", "all", "any", "their", "its"]);
const NEGATIVE_WORDS = /^(not\b|no\b|un|fails?\b|failed\b|rejected\b|declined\b|denied\b|missing\b|insufficient\b|out of stock\b|incorrect\b|invalid\b)/;
const CONDITION = /^(?:if|when|in case|once)\s+(.+?),\s*(?:then\s+)?(.+)$/i;
const OTHERWISE = /^(?:otherwise|else|if not|if no)\s*,?\s*(.+)$/i;

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const words = (s: string) => s.split(/\s+/).filter(Boolean);
const stripArticles = (s: string) => words(s).filter((w) => !ARTICLES.has(w.toLowerCase())).join(" ");
const shorten = (s: string, n = 6) => words(s).slice(0, n).join(" ");

function baseVerb(word: string): string {
  const w = word.toLowerCase();
  if (/ies$/.test(w)) return `${w.slice(0, -3)}y`;
  if (/(ch|sh|ss|x|z|o)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
  return w;
}

function findActor(clause: string): { actor: string; rest: string } | null {
  const text = clause.replace(/^the\s+/i, "");
  const lower = text.toLowerCase();
  for (const dept of DEPARTMENTS) {
    if (lower.startsWith(`${dept} `) && /^[a-z]+s\b/.test(lower.slice(dept.length + 1).replace(/^(team|department|dept)\s+/, ""))) {
      const rest = text.slice(dept.length + 1).replace(/^(team|department|dept)\s+/i, "");
      return { actor: text.slice(0, dept.length), rest };
    }
  }
  // Capitalized proper-noun actor followed by a verb, e.g. "Finance Director approves ...".
  const m = text.match(/^((?:[A-Z][\w&-]*\s+){1,3}?)([a-z]+s)\b(.*)$/);
  if (m && m[1].trim().split(/\s+/).every((w) => /^[A-Z]/.test(w))) {
    return { actor: m[1].trim(), rest: `${m[2]}${m[3]}` };
  }
  return null;
}

/** "verifies the order and checks inventory" -> ["Verify order", "Check inventory"]. */
function actionsFrom(rest: string, actor: string): string[] {
  const parts = rest
    .split(/,?\s+(?:and then|then|and)\s+|,\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const labels: { verb: string; object: string }[] = parts.map((p) => {
    const [verb, ...obj] = words(p);
    return { verb: cap(baseVerb(verb)), object: shorten(stripArticles(obj.join(" ")), 5) };
  });
  // A bare verb borrows the next object: "prepares and ships the order".
  for (let i = labels.length - 2; i >= 0; i--) if (!labels[i].object) labels[i].object = labels[i + 1].object;
  return labels.map(({ verb, object }) => (object ? `${verb} ${object}` : `${verb} ${actor.toLowerCase()}`));
}

function passiveLabel(clause: string): string {
  const text = stripArticles(clause.replace(/\b(is|are|gets|get)\s+/gi, ""));
  return cap(shorten(text, 6));
}

function parseCondition(text: string): { key: string; question: string; negative: boolean } {
  const clean = stripArticles(text.toLowerCase());
  const copula = clean.match(/^(.+?)\s+(?:is|are|was|has been|gets|get)\s+(.+)$/);
  let subject: string;
  let predicate: string;
  if (copula) {
    subject = copula[1];
    predicate = copula[2];
  } else {
    const w = words(clean);
    subject = w.slice(0, -1).join(" ") || w[0];
    predicate = w.length > 1 ? w[w.length - 1] : "ok";
  }
  const negative = NEGATIVE_WORDS.test(predicate);
  let positive = predicate;
  if (negative) {
    if (/^not\s+/.test(predicate)) positive = predicate.replace(/^not\s+/, "");
    else if (/^un/.test(predicate)) positive = predicate.slice(2);
    else if (/^insufficient/.test(predicate)) positive = "sufficient";
    else if (/^(out of stock|missing)/.test(predicate)) positive = "available";
    else positive = "approved";
  } else if (/^(passes|pass|passed|succeeds)$/.test(predicate)) {
    positive = "approved";
  }
  return { key: subject, question: `${cap(subject)} ${positive}?`, negative };
}

export function parseProcessOffline(description: string): AiProcess {
  const sentences = description
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?;])\s+/)
    .map((s) => s.replace(/[.!?;]+$/, "").trim())
    .filter(Boolean);

  const lanes: AiProcess["lanes"] = [];
  const laneByName = new Map<string, string>();
  const nodes: AiProcess["nodes"] = [];
  const connections: AiProcess["connections"] = [];
  const decisions = new Map<string, { id: string; laneId: string; yesUsed: boolean; noUsed: boolean }>();
  const openEnds: string[] = [];
  const notes: string[] = [];
  let counter = 0;
  let tail: string | null = null;
  let pendingLabel: string | null = null;
  let currentLane: string | null = null;
  let pendingStart: string | null = null;
  let lastDecision: string | null = null;

  const lane = (name: string) => {
    const key = name.toLowerCase();
    let id = laneByName.get(key);
    if (!id) {
      id = key.replace(/[^a-z0-9]+/g, "_");
      laneByName.set(key, id);
      lanes.push({ id, name: name.split(" ").map(cap).join(" ") });
    }
    return id;
  };
  const addNode = (type: AiProcess["nodes"][number]["type"], laneId: string, text: string, uncertain = false) => {
    const id = `n${++counter}`;
    nodes.push({ id, type, laneId, text, uncertain });
    return id;
  };
  const connect = (source: string | null, target: string, label: string | null = null) => {
    if (source) connections.push({ source, target, label });
  };
  const ensureStart = (laneId: string) => {
    if (nodes.length) return;
    tail = addNode("start", laneId, pendingStart ? pendingStart : "Start");
  };

  /** Adds the steps of one clause; returns [first, last] node ids. */
  const addClause = (clause: string): [string, string] => {
    const found = findActor(clause);
    if (found) {
      const laneId = lane(found.actor);
      ensureStart(laneId);
      currentLane = laneId;
      const ids = actionsFrom(found.rest, found.actor).map((label) => addNode("process", laneId, label));
      for (let i = 1; i < ids.length; i++) connect(ids[i - 1], ids[i]);
      return [ids[0], ids[ids.length - 1]];
    }
    const laneId = currentLane ?? lane("Process");
    ensureStart(laneId);
    const id = addNode("process", laneId, passiveLabel(clause), true);
    notes.push(`"${passiveLabel(clause)}" has no stated department; placed in ${lanes.find((l) => l.id === laneId)?.name}.`);
    return [id, id];
  };

  const addBranch = (decisionKey: string, question: string, negative: boolean, clause: string) => {
    let rec = decisions.get(decisionKey);
    if (!rec) {
      const laneId = currentLane ?? lane("Process");
      ensureStart(laneId);
      const id = addNode("decision", laneId, question);
      connect(tail, id, pendingLabel);
      pendingLabel = null;
      rec = { id, laneId, yesUsed: false, noUsed: false };
      decisions.set(decisionKey, rec);
      tail = id;
    }
    lastDecision = decisionKey;
    // A branch without a named actor stays with whoever made the decision.
    currentLane = rec.laneId;
    const [first, last] = addClause(clause);
    connect(rec.id, first, negative ? "No" : "Yes");
    if (negative) {
      rec.noUsed = true;
      openEnds.push(last);
      if (!rec.yesUsed) {
        tail = rec.id;
        pendingLabel = "Yes";
      }
    } else {
      rec.yesUsed = true;
      tail = last;
      pendingLabel = null;
    }
  };

  sentences.forEach((sentence, index) => {
    const cond = sentence.match(CONDITION);
    const otherwise = sentence.match(OTHERWISE);
    if (otherwise && lastDecision) {
      addBranch(lastDecision, "", true, otherwise[1]);
    } else if (cond) {
      const { key, question, negative } = parseCondition(cond[1]);
      addBranch(key, question, negative, cond[2]);
    } else if (index === 0 && !findActor(sentence)) {
      pendingStart = passiveLabel(sentence);
    } else {
      const [first, last] = addClause(sentence);
      connect(tail, first, pendingLabel);
      pendingLabel = null;
      tail = last;
    }
  });

  if (!nodes.length) {
    const laneId = lane("Process");
    tail = addNode("start", laneId, pendingStart ?? "Start");
  }

  const laneOf = (id: string) => nodes.find((n) => n.id === id)!.laneId;
  const finish = (from: string, label: string | null) => {
    const end = addNode("end", laneOf(from), "End");
    connect(from, end, label);
  };
  if (tail) finish(tail, pendingLabel);
  for (const id of openEnds) finish(id, null);

  for (const rec of decisions.values()) {
    if (rec.yesUsed && rec.noUsed) continue;
    const text = nodes.find((n) => n.id === rec.id)!.text;
    notes.push(`"${text}" has no ${rec.yesUsed ? "No" : "Yes"} path in the description.`);
  }

  const firstStep = nodes.find((n) => n.type === "process") ?? nodes[0];
  const lastSteps = connections
    .filter((c) => nodes.find((n) => n.id === c.target)?.type === "end")
    .map((c) => nodes.find((n) => n.id === c.source)!.text);

  return {
    title: `${shorten(firstStep.text.replace(/^\w+\s+/, ""), 4) || "Business"} process`.replace(/^./, (c) => c.toUpperCase()),
    lanes,
    nodes,
    connections,
    summary: {
      inputs: [pendingStart ?? firstStep.text],
      outputs: lastSteps,
      notes: [
        "Generated by the offline rule-based parser. Configure an AI key for better results.",
        ...notes,
      ],
    },
  };
}
