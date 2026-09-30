import { describe, expect, it } from "vitest";
import { parseProcessOffline } from "../server/offlineParser";
import { buildModel, laneOffsets, placeInLane } from "../src/shared/layout";
import { ProcessValidationError, sanitizeProcess } from "../src/shared/normalize";
import { DEMO_PROCESS } from "../src/components/GeneratorPanel";

const valid = {
  title: "Raw Material Receiving",
  lanes: [
    { id: "warehouse", name: "Warehouse" },
    { id: "quality", name: "Quality Control" },
    { id: "unused", name: "Finance" },
  ],
  nodes: [
    { id: "n1", type: "start", laneId: "warehouse", text: "Material arrives", uncertain: false },
    { id: "n2", type: "process", laneId: "warehouse", text: "Receive material", uncertain: false },
    { id: "n3", type: "decision", laneId: "quality", text: "Quality approved", uncertain: false },
    { id: "n3", type: "process", laneId: "production", text: "Start production", uncertain: false },
    { id: "n5", type: "end", laneId: "warehouse", text: "   ", uncertain: false },
  ],
  connections: [
    { source: "n1", target: "n2", label: null },
    { source: "n2", target: "n3", label: null },
    { source: "n2", target: "n3", label: null },
    { source: "n3", target: "ghost", label: "Yes" },
  ],
  summary: { inputs: ["Raw material"], outputs: [], notes: [] },
};

describe("sanitizeProcess", () => {
  it("repairs recoverable problems and reports them", () => {
    const { process, warnings } = sanitizeProcess(valid);
    expect(process.lanes.map((l) => l.name)).toEqual(["Warehouse", "Quality Control", "Production"]);
    expect(new Set(process.nodes.map((n) => n.id)).size).toBe(process.nodes.length);
    expect(process.nodes.find((n) => n.type === "decision")!.text).toBe("Quality approved?");
    expect(process.nodes.some((n) => n.text === "")).toBe(false);
    expect(process.connections).toHaveLength(2);
    expect(warnings.join(" ")).toMatch(/missing step/);
    expect(warnings.join(" ")).toMatch(/Removed empty department "Finance"/);
  });

  it("rejects data that does not match the schema", () => {
    expect(() => sanitizeProcess({ title: "x", lanes: "nope" })).toThrow(ProcessValidationError);
    expect(() => sanitizeProcess({ ...valid, nodes: [] })).toThrow(/No process steps/);
  });

  it("strips markup from labels", () => {
    const { process } = sanitizeProcess({
      ...valid,
      nodes: [{ id: "a", type: "process", laneId: "warehouse", text: "<script>alert(1)</script>Check", uncertain: false }],
      connections: [],
    });
    expect(process.nodes[0].text).not.toMatch(/[<>]/);
  });
});

describe("offline parser", () => {
  it("builds the demo purchase-order process", () => {
    const { process } = sanitizeProcess(parseProcessOffline(DEMO_PROCESS));
    expect(process.lanes.map((l) => l.name)).toEqual(["Customer", "Sales", "Warehouse", "Quality", "Dispatch", "Procurement"]);
    const decisions = process.nodes.filter((n) => n.type === "decision").map((n) => n.text);
    expect(decisions).toEqual(["Inventory available?", "Quality approved?"]);
    const inventory = process.nodes.find((n) => n.text === "Inventory available?")!;
    const labels = process.connections.filter((c) => c.source === inventory.id).map((c) => c.label).sort();
    expect(labels).toEqual(["No", "Yes"]);
    expect(process.nodes.filter((n) => n.type === "start")).toHaveLength(1);
    expect(process.nodes.filter((n) => n.type === "end").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps passive steps with the deciding department and flags them", () => {
    const { process } = sanitizeProcess(
      parseProcessOffline(
        "Raw material arrives at the factory. Warehouse receives the material and checks quantity. Quality control checks the material. If quality is approved, production starts. If quality fails, the material is returned to the supplier.",
      ),
    );
    const returned = process.nodes.find((n) => n.text.startsWith("Material returned"))!;
    expect(returned.uncertain).toBe(true);
    expect(returned.laneId).toBe("quality_control");
    expect(process.nodes[0]).toMatchObject({ type: "start", text: "Raw material arrives at factory" });
  });
});

describe("layout", () => {
  const model = buildModel(sanitizeProcess(parseProcessOffline(DEMO_PROCESS)).process, DEMO_PROCESS);

  it("places every node inside its lane without overlaps", () => {
    const lanes = new Map(model.lanes.map((l) => [l.id, l]));
    const offsets = laneOffsets(model.lanes);
    for (const n of model.nodes) {
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y + n.height).toBeLessThanOrEqual(lanes.get(n.laneId)!.height);
    }
    const boxes = model.nodes.map((n) => ({ ...n, top: n.y + offsets.get(n.laneId)! }));
    for (const a of boxes)
      for (const b of boxes)
        if (a !== b) {
          const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.top < b.top + b.height && b.top < a.top + a.height;
          expect(overlap, `${a.text} overlaps ${b.text}`).toBe(false);
        }
  });

  it("orders nodes left to right along the flow", () => {
    const x = new Map(model.nodes.map((n) => [n.id, n.x]));
    for (const e of model.edges) expect(x.get(e.target)!).toBeGreaterThan(x.get(e.source)!);
  });

  it("maps absolute positions back to lanes", () => {
    const [first, second] = model.lanes;
    expect(placeInLane(model.lanes, 10, 40).laneId).toBe(first.id);
    expect(placeInLane(model.lanes, first.height + 20, 40)).toEqual({ laneId: second.id, y: 20 });
    expect(placeInLane(model.lanes, 99999, 40).laneId).toBe(model.lanes.at(-1)!.id);
  });
});
