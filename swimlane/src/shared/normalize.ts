import { AiProcessSchema, type AiProcess } from "./schema";

const MAX_LABEL = 60;
const MAX_TITLE = 80;

export class ProcessValidationError extends Error {
  constructor(message: string, readonly details: string[] = []) {
    super(message);
    this.name = "ProcessValidationError";
  }
}

/** Collapse whitespace, strip markup-looking characters and clamp length. */
export function cleanText(value: string, max = MAX_LABEL): string {
  const text = value.replace(/[<>{}]/g, "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "item"
  );
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}_${n++}`;
  used.add(id);
  return id;
}

/**
 * Parse, schema-validate, sanitize and normalize an untrusted process description
 * coming from the AI. Recoverable problems are fixed and reported as warnings;
 * unrecoverable ones throw ProcessValidationError.
 */
export function sanitizeProcess(raw: unknown): { process: AiProcess; warnings: string[] } {
  const parsed = AiProcessSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ProcessValidationError(
      "The generated process did not match the expected structure.",
      parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  }
  const input = parsed.data;
  const warnings: string[] = [];

  // Lanes: unique ids, non-empty names, no duplicate names.
  const laneIds = new Set<string>();
  const laneIdMap = new Map<string, string>();
  const laneByName = new Map<string, string>();
  const lanes: AiProcess["lanes"] = [];
  for (const lane of input.lanes) {
    const name = cleanText(lane.name, 40);
    if (!name) continue;
    const existing = laneByName.get(name.toLowerCase());
    if (existing) {
      laneIdMap.set(lane.id, existing);
      warnings.push(`Merged duplicate department "${name}".`);
      continue;
    }
    const id = uniqueId(slug(lane.id || name), laneIds);
    laneIdMap.set(lane.id, id);
    laneByName.set(name.toLowerCase(), id);
    lanes.push({ id, name });
  }

  // Nodes: unique ids, valid lane, non-empty text.
  const nodeIds = new Set<string>();
  const nodeIdMap = new Map<string, string>();
  const nodes: AiProcess["nodes"] = [];
  for (const node of input.nodes) {
    const text = cleanText(node.text);
    if (!text) {
      warnings.push(`Dropped a step with no label (${node.id}).`);
      continue;
    }
    let laneId = laneIdMap.get(node.laneId);
    if (!laneId) {
      // Unknown lane: create it rather than silently moving the step elsewhere.
      const name = cleanText(node.laneId.replace(/[_-]+/g, " "), 40).replace(/\b[a-z]/g, (c) => c.toUpperCase()) || "Unassigned";
      laneId = laneByName.get(name.toLowerCase());
      if (!laneId) {
        laneId = uniqueId(slug(name), laneIds);
        laneByName.set(name.toLowerCase(), laneId);
        lanes.push({ id: laneId, name });
        warnings.push(`Added missing department "${name}".`);
      }
      laneIdMap.set(node.laneId, laneId);
    }
    if (nodeIdMap.has(node.id)) warnings.push(`Renamed duplicate step id "${node.id}".`);
    const id = uniqueId(slug(node.id), nodeIds);
    if (!nodeIdMap.has(node.id)) nodeIdMap.set(node.id, id);
    nodes.push({
      id,
      type: node.type,
      laneId,
      text: node.type === "decision" && !text.endsWith("?") ? `${text}?` : text,
      uncertain: node.uncertain,
    });
  }

  if (nodes.length === 0) {
    throw new ProcessValidationError("No process steps could be identified in the description.");
  }

  // Connections: both ends must exist, no exact duplicates.
  const seen = new Set<string>();
  const connections: AiProcess["connections"] = [];
  for (const c of input.connections) {
    const source = nodeIdMap.get(c.source);
    const target = nodeIdMap.get(c.target);
    if (!source || !target) {
      warnings.push(`Removed a connection to a missing step (${c.source} → ${c.target}).`);
      continue;
    }
    const label = c.label ? cleanText(c.label, 20) || null : null;
    const key = `${source}>${target}>${label ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    connections.push({ source, target, label });
  }

  // Drop lanes nobody uses: the AI must not invent departments.
  const usedLanes = new Set(nodes.map((n) => n.laneId));
  const keptLanes = lanes.filter((l) => {
    if (usedLanes.has(l.id)) return true;
    warnings.push(`Removed empty department "${l.name}".`);
    return false;
  });

  return {
    process: {
      title: cleanText(input.title, MAX_TITLE) || "Untitled process",
      lanes: keptLanes,
      nodes,
      connections,
      summary: {
        inputs: input.summary.inputs.map((s) => cleanText(s)).filter(Boolean),
        outputs: input.summary.outputs.map((s) => cleanText(s)).filter(Boolean),
        notes: input.summary.notes.map((s) => cleanText(s, 200)).filter(Boolean),
      },
    },
    warnings,
  };
}
