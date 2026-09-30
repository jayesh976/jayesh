import { create } from "zustand";
import { DEFAULT_STYLES, LANE_COLORS, NODE_SIZES, laneOffsets, layoutModel, placeInLane } from "./shared/layout";
import type { Lane, NodeType, ProcessEdge, ProcessModel, ProcessNode } from "./shared/schema";

const HISTORY_LIMIT = 100;
const STORAGE_KEY = "swimlane-studio:process";

export type Selection = { kind: "node" | "edge" | "lane"; ids: string[] } | null;

interface EditorState {
  model: ProcessModel | null;
  past: ProcessModel[];
  future: ProcessModel[];
  selection: Selection;
  savedAt: string | null;
  dirty: boolean;

  /** Replace the model as one undoable step. */
  commit: (update: (model: ProcessModel) => ProcessModel) => void;
  loadModel: (model: ProcessModel | null) => void;
  undo: () => void;
  redo: () => void;
  select: (selection: Selection) => void;

  moveNodes: (moves: { id: string; x: number; y: number; laneId: string }[]) => void;
  updateNode: (id: string, patch: Partial<ProcessNode>) => void;
  addNode: (type: NodeType, laneId?: string) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;

  addLane: () => void;
  updateLane: (id: string, patch: Partial<Lane>) => void;
  moveLane: (id: string, direction: -1 | 1) => void;
  deleteLane: (id: string) => void;

  connect: (source: string, target: string) => void;
  reconnect: (edgeId: string, source: string, target: string) => void;
  updateEdge: (id: string, patch: Partial<ProcessEdge>) => void;

  arrange: (mode: "align-left" | "align-center" | "align-middle" | "distribute-x") => void;
  autoLayout: () => void;
  /** Returns false when the browser refused to store the process. */
  save: () => boolean;
  restoreSaved: () => boolean;
}

let idCounter = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export const useEditor = create<EditorState>((set, get) => ({
  model: null,
  past: [],
  future: [],
  selection: null,
  savedAt: null,
  dirty: false,

  commit: (update) => {
    const { model, past } = get();
    if (!model) return;
    const next = { ...update(model), updatedAt: new Date().toISOString() };
    set({ model: next, past: [...past, model].slice(-HISTORY_LIMIT), future: [], dirty: true });
  },

  loadModel: (model) => {
    const { model: current, past } = get();
    // Loading a generated diagram over an existing one stays undoable.
    set({
      model,
      past: current ? [...past, current].slice(-HISTORY_LIMIT) : past,
      future: [],
      selection: null,
      dirty: Boolean(model),
    });
  },

  undo: () => {
    const { past, model, future } = get();
    if (!past.length) return;
    const previous = past[past.length - 1];
    set({ model: previous, past: past.slice(0, -1), future: model ? [model, ...future] : future, selection: null, dirty: true });
  },

  redo: () => {
    const { past, model, future } = get();
    if (!future.length) return;
    const [next, ...rest] = future;
    set({ model: next, past: model ? [...past, model] : past, future: rest, selection: null, dirty: true });
  },

  select: (selection) => {
    const current = get().selection;
    const same =
      current === selection ||
      (current && selection && current.kind === selection.kind && current.ids.join() === selection.ids.join());
    if (!same) set({ selection });
  },

  moveNodes: (moves) =>
    get().commit((m) => {
      const byId = new Map(moves.map((mv) => [mv.id, mv]));
      return { ...m, nodes: m.nodes.map((n) => (byId.has(n.id) ? { ...n, ...byId.get(n.id)! } : n)) };
    }),

  updateNode: (id, patch) =>
    get().commit((m) => ({ ...m, nodes: m.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),

  addNode: (type, laneId) => {
    const model = get().model;
    if (!model || !model.lanes.length) return;
    const selectedLane = get().selection?.kind === "lane" ? get().selection!.ids[0] : undefined;
    const lane = laneId ?? selectedLane ?? model.lanes[0].id;
    const inLane = model.nodes.filter((n) => n.laneId === lane);
    const right = inLane.reduce((max, n) => Math.max(max, n.x + n.width), 150);
    const size = NODE_SIZES[type];
    const laneHeight = model.lanes.find((l) => l.id === lane)!.height;
    const node: ProcessNode = {
      id: newId(type),
      type,
      laneId: lane,
      text: { start: "Start", end: "End", process: "New activity", decision: "Condition?", document: "Document" }[type],
      x: right + 40,
      y: Math.max(10, Math.round((laneHeight - size.height) / 2)),
      ...size,
      style: { ...DEFAULT_STYLES[type] },
      uncertain: false,
    };
    get().commit((m) => ({ ...m, nodes: [...m.nodes, node] }));
    set({ selection: { kind: "node", ids: [node.id] } });
  },

  deleteSelection: () => {
    const { selection } = get();
    if (!selection) return;
    if (selection.kind === "lane") {
      selection.ids.forEach((id) => get().deleteLane(id));
      return;
    }
    const ids = new Set(selection.ids);
    get().commit((m) =>
      selection.kind === "node"
        ? {
            ...m,
            nodes: m.nodes.filter((n) => !ids.has(n.id)),
            edges: m.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
          }
        : { ...m, edges: m.edges.filter((e) => !ids.has(e.id)) },
    );
    set({ selection: null });
  },

  duplicateSelection: () => {
    const { selection, model } = get();
    if (!model || selection?.kind !== "node") return;
    const ids = new Set(selection.ids);
    const mapping = new Map<string, string>();
    const copies = model.nodes
      .filter((n) => ids.has(n.id))
      .map((n) => {
        const id = newId(n.type);
        mapping.set(n.id, id);
        return { ...n, id, x: n.x + 30, y: n.y + 20, style: { ...n.style } };
      });
    // Keep connections that run between duplicated nodes.
    const edges = model.edges
      .filter((e) => mapping.has(e.source) && mapping.has(e.target))
      .map((e) => ({ ...e, id: newId("e"), source: mapping.get(e.source)!, target: mapping.get(e.target)! }));
    get().commit((m) => ({ ...m, nodes: [...m.nodes, ...copies], edges: [...m.edges, ...edges] }));
    set({ selection: { kind: "node", ids: copies.map((c) => c.id) } });
  },

  addLane: () => {
    const lane: Lane = {
      id: newId("lane"),
      name: "New department",
      color: LANE_COLORS[(get().model?.lanes.length ?? 0) % LANE_COLORS.length],
      height: 140,
    };
    get().commit((m) => ({ ...m, lanes: [...m.lanes, lane] }));
    set({ selection: { kind: "lane", ids: [lane.id] } });
  },

  updateLane: (id, patch) =>
    get().commit((m) => ({ ...m, lanes: m.lanes.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

  moveLane: (id, direction) =>
    get().commit((m) => {
      const lanes = [...m.lanes];
      const i = lanes.findIndex((l) => l.id === id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= lanes.length) return m;
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
      return { ...m, lanes };
    }),

  deleteLane: (id) => {
    get().commit((m) => {
      const removed = new Set(m.nodes.filter((n) => n.laneId === id).map((n) => n.id));
      return {
        ...m,
        lanes: m.lanes.filter((l) => l.id !== id),
        nodes: m.nodes.filter((n) => !removed.has(n.id)),
        edges: m.edges.filter((e) => !removed.has(e.source) && !removed.has(e.target)),
      };
    });
    set({ selection: null });
  },

  connect: (source, target) => {
    if (source === target) return;
    get().commit((m) => {
      const from = m.nodes.find((n) => n.id === source);
      const existing = m.edges.filter((e) => e.source === source);
      // Decisions get Yes on the first branch and No on the second by default.
      const label = from?.type === "decision" ? (existing.some((e) => e.label === "Yes") ? "No" : "Yes") : null;
      return { ...m, edges: [...m.edges, { id: newId("e"), source, target, label }] };
    });
  },

  reconnect: (edgeId, source, target) =>
    get().commit((m) => ({ ...m, edges: m.edges.map((e) => (e.id === edgeId ? { ...e, source, target } : e)) })),

  updateEdge: (id, patch) =>
    get().commit((m) => ({ ...m, edges: m.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),

  arrange: (mode) => {
    const { selection } = get();
    if (selection?.kind !== "node" || selection.ids.length < 2) return;
    const ids = new Set(selection.ids);
    get().commit((m) => {
      const offsets = laneOffsets(m.lanes);
      const picked = m.nodes
        .filter((n) => ids.has(n.id))
        .map((n) => ({ id: n.id, x: n.x, y: n.y + (offsets.get(n.laneId) ?? 0), w: n.width, h: n.height }));
      if (mode === "align-left") {
        const left = Math.min(...picked.map((p) => p.x));
        picked.forEach((p) => (p.x = left));
      } else if (mode === "align-center") {
        const center = picked.reduce((s, p) => s + p.x + p.w / 2, 0) / picked.length;
        picked.forEach((p) => (p.x = Math.round(center - p.w / 2)));
      } else if (mode === "align-middle") {
        const middle = picked.reduce((s, p) => s + p.y + p.h / 2, 0) / picked.length;
        picked.forEach((p) => (p.y = Math.round(middle - p.h / 2)));
      } else {
        picked.sort((a, b) => a.x - b.x);
        const first = picked[0].x;
        const last = picked[picked.length - 1].x;
        const step = (last - first) / (picked.length - 1);
        picked.forEach((p, i) => (p.x = Math.round(first + i * step)));
      }
      const byId = new Map(picked.map((p) => [p.id, p]));
      return {
        ...m,
        nodes: m.nodes.map((n) => {
          const p = byId.get(n.id);
          return p ? { ...n, x: p.x, ...placeInLane(m.lanes, p.y, n.height) } : n;
        }),
      };
    });
  },

  autoLayout: () => get().commit((m) => layoutModel(m)),

  save: () => {
    const { model } = get();
    if (!model) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    } catch {
      return false;
    }
    set({ savedAt: new Date().toISOString(), dirty: false });
    return true;
  },

  restoreSaved: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const model = JSON.parse(raw) as ProcessModel;
      if (model?.version !== 1 || !Array.isArray(model.lanes) || !Array.isArray(model.nodes)) return false;
      set({ model, past: [], future: [], selection: null, dirty: false, savedAt: model.updatedAt });
      return true;
    } catch {
      return false;
    }
  },
}));
