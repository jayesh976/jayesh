import type { AiProcess, Lane, NodeStyle, NodeType, ProcessEdge, ProcessModel, ProcessNode } from "./schema";

export const LANE_HEADER_WIDTH = 150;
const PAD_X = 40;
const COL_WIDTH = 220;
const ROW_HEIGHT = 110;
const ROW_SLOT = 80;
const LANE_PAD_Y = 30;
const MIN_LANE_HEIGHT = 140;

export const LANE_COLORS = ["#f5f7fa", "#eef4fb", "#f3f6f1", "#f8f4ee", "#f4f1f8", "#eef6f6", "#faf2f2", "#f6f6ee"];

export const NODE_SIZES: Record<NodeType, { width: number; height: number }> = {
  start: { width: 130, height: 48 },
  end: { width: 130, height: 48 },
  process: { width: 160, height: 64 },
  document: { width: 160, height: 68 },
  decision: { width: 132, height: 92 },
};

export const DEFAULT_STYLES: Record<NodeType, NodeStyle> = {
  start: { fill: "#e8f3ec", stroke: "#2f7d4f", textColor: "#1c3d2a", fontSize: 13 },
  end: { fill: "#f6e9e9", stroke: "#a13d3d", textColor: "#4a1d1d", fontSize: 13 },
  process: { fill: "#ffffff", stroke: "#4a5a70", textColor: "#1f2733", fontSize: 13 },
  document: { fill: "#fbfaf4", stroke: "#8a7a45", textColor: "#3a3320", fontSize: 13 },
  decision: { fill: "#fff8e6", stroke: "#b7862b", textColor: "#3d2e0f", fontSize: 12 },
};

/**
 * Column index per node: longest path from the process entry points, ignoring
 * back edges so loops do not push nodes to infinity.
 */
export function computeRanks(nodeIds: string[], edges: Pick<ProcessEdge, "source" | "target">[], startIds: string[] = []): Map<string, number> {
  const out = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const id of nodeIds) {
    out.set(id, []);
    indegree.set(id, 0);
  }
  for (const e of edges) {
    if (!out.has(e.source) || !out.has(e.target)) continue;
    out.get(e.source)!.push(e.target);
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  }

  // DFS to find back edges, starting from declared starts, then true sources, then anything left.
  const roots = [...startIds, ...nodeIds.filter((id) => indegree.get(id) === 0), ...nodeIds];
  const state = new Map<string, 1 | 2>();
  const back = new Set<string>();
  for (const root of roots) {
    if (state.has(root)) continue;
    const stack: [string, number][] = [[root, 0]];
    state.set(root, 1);
    while (stack.length) {
      const top = stack[stack.length - 1];
      const children = out.get(top[0])!;
      if (top[1] < children.length) {
        const child = children[top[1]++];
        const s = state.get(child);
        if (s === 1) back.add(`${top[0]}>${child}`);
        else if (!s) {
          state.set(child, 1);
          stack.push([child, 0]);
        }
      } else {
        state.set(top[0], 2);
        stack.pop();
      }
    }
  }

  // Longest path over the resulting DAG (Kahn's algorithm).
  const rank = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const deg = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  for (const [src, targets] of out) for (const t of targets) if (!back.has(`${src}>${t}`)) deg.set(t, deg.get(t)! + 1);
  const queue = nodeIds.filter((id) => deg.get(id) === 0);
  while (queue.length) {
    const id = queue.shift()!;
    for (const t of out.get(id)!) {
      if (back.has(`${id}>${t}`)) continue;
      rank.set(t, Math.max(rank.get(t)!, rank.get(id)! + 1));
      deg.set(t, deg.get(t)! - 1);
      if (deg.get(t) === 0) queue.push(t);
    }
  }
  return rank;
}

/**
 * Place every node: lanes are rows in their given order, columns follow process
 * sequence, and nodes sharing a lane and column are stacked. Styles and sizes
 * already on the nodes are kept; only positions and lane heights change.
 */
export function layoutModel(model: ProcessModel): ProcessModel {
  const starts = model.nodes.filter((n) => n.type === "start").map((n) => n.id);
  const rank = computeRanks(
    model.nodes.map((n) => n.id),
    model.edges,
    starts,
  );

  const slots = new Map<string, number>();
  const stackIndex = new Map<string, number>();
  const ordered = [...model.nodes].sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
  for (const node of ordered) {
    const key = `${node.laneId}|${rank.get(node.id)}`;
    const i = slots.get(key) ?? 0;
    stackIndex.set(node.id, i);
    slots.set(key, i + 1);
  }

  const maxStack = new Map<string, number>();
  for (const [key, count] of slots) {
    const laneId = key.split("|")[0];
    maxStack.set(laneId, Math.max(maxStack.get(laneId) ?? 0, count));
  }

  const lanes = model.lanes.map((lane) => {
    const rows = maxStack.get(lane.id) ?? 1;
    return { ...lane, height: Math.max(MIN_LANE_HEIGHT, 2 * LANE_PAD_Y + (rows - 1) * ROW_HEIGHT + ROW_SLOT) };
  });

  const nodes = model.nodes.map((node) => {
    const column = rank.get(node.id)!;
    const center = LANE_HEADER_WIDTH + PAD_X + column * COL_WIDTH + NODE_SIZES.process.width / 2;
    return {
      ...node,
      x: Math.round(center - node.width / 2),
      y: Math.round(LANE_PAD_Y + stackIndex.get(node.id)! * ROW_HEIGHT + (ROW_SLOT - node.height) / 2),
    };
  });

  return { ...model, lanes, nodes };
}

/** Turn a validated AI process into a laid-out, styled model. */
export function buildModel(process: AiProcess, description: string, now = new Date().toISOString()): ProcessModel {
  const lanes: Lane[] = process.lanes.map((l, i) => ({
    id: l.id,
    name: l.name,
    color: LANE_COLORS[i % LANE_COLORS.length],
    height: MIN_LANE_HEIGHT,
  }));
  const nodes: ProcessNode[] = process.nodes.map((n) => ({
    ...n,
    x: 0,
    y: 0,
    ...NODE_SIZES[n.type],
    style: { ...DEFAULT_STYLES[n.type] },
  }));
  const edges: ProcessEdge[] = process.connections.map((c, i) => ({
    id: `e${i + 1}_${c.source}_${c.target}`,
    source: c.source,
    target: c.target,
    label: c.label,
  }));
  return layoutModel({
    version: 1,
    title: process.title,
    description,
    lanes,
    nodes,
    edges,
    summary: process.summary,
    createdAt: now,
    updatedAt: now,
  });
}

/** Absolute y of each lane's top edge. */
export function laneOffsets(lanes: Lane[]): Map<string, number> {
  const offsets = new Map<string, number>();
  let y = 0;
  for (const lane of lanes) {
    offsets.set(lane.id, y);
    y += lane.height;
  }
  return offsets;
}

/** Width the lanes should span so every node fits with some breathing room. */
export function canvasWidth(nodes: ProcessNode[]): number {
  const right = nodes.reduce((max, n) => Math.max(max, n.x + n.width), 0);
  return Math.max(900, right + PAD_X * 2);
}

/**
 * Convert an absolute canvas y (top of a node) into the lane that holds the
 * node's center and a y relative to that lane, clamped inside it.
 */
export function placeInLane(lanes: Lane[], absoluteY: number, height: number): { laneId: string; y: number } {
  const center = absoluteY + height / 2;
  let top = 0;
  let chosen = lanes[lanes.length - 1];
  let chosenTop = lanes.slice(0, -1).reduce((sum, l) => sum + l.height, 0);
  for (const lane of lanes) {
    if (center < top + lane.height) {
      chosen = lane;
      chosenTop = top;
      break;
    }
    top += lane.height;
  }
  if (center < 0) {
    chosen = lanes[0];
    chosenTop = 0;
  }
  const maxY = Math.max(4, chosen.height - height - 4);
  return { laneId: chosen.id, y: Math.round(Math.min(maxY, Math.max(4, absoluteY - chosenTop))) };
}
