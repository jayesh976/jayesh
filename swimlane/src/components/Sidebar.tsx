import type { Lane, NodeType } from "../shared/schema";
import { useEditor } from "../store";
import { GeneratorPanel } from "./GeneratorPanel";
import { Icons } from "./Icons";

const NO_LANES: Lane[] = [];

const SHAPES: { type: NodeType; label: string }[] = [
  { type: "process", label: "Activity" },
  { type: "decision", label: "Decision" },
  { type: "start", label: "Start" },
  { type: "end", label: "End" },
  { type: "document", label: "Document" },
];

export function Sidebar({ onNotify }: { onNotify: (message: string, tone?: "info" | "error") => void }) {
  const lanes = useEditor((s) => s.model?.lanes ?? NO_LANES);
  const selection = useEditor((s) => s.selection);
  const { addNode, addLane, moveLane, select } = useEditor.getState();

  return (
    <aside className="sidebar" aria-label="Tools">
      <GeneratorPanel variant="sidebar" onNotify={onNotify} />

      <section aria-labelledby="lanes-heading">
        <div className="section-head">
          <h2 id="lanes-heading">Departments</h2>
          <button type="button" className="icon" onClick={addLane} title="Add department" aria-label="Add department">
            <Icons.plus />
          </button>
        </div>
        <ul className="lane-list">
          {lanes.map((lane, i) => {
            const active = selection?.kind === "lane" && selection.ids.includes(lane.id);
            return (
              <li key={lane.id} className={active ? "active" : ""}>
                <span className="swatch" style={{ background: lane.color }} aria-hidden />
                <button type="button" className="lane-select" onClick={() => select({ kind: "lane", ids: [lane.id] })}>
                  {lane.name}
                </button>
                <button type="button" className="icon" disabled={i === 0} onClick={() => moveLane(lane.id, -1)} aria-label={`Move ${lane.name} up`} title="Move up">
                  <Icons.up />
                </button>
                <button type="button" className="icon" disabled={i === lanes.length - 1} onClick={() => moveLane(lane.id, 1)} aria-label={`Move ${lane.name} down`} title="Move down">
                  <Icons.down />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="shapes-heading">
        <h2 id="shapes-heading">Add shape</h2>
        <p className="muted small">Adds to the selected department, or the first one.</p>
        <div className="shape-grid">
          {SHAPES.map((s) => (
            <button key={s.type} type="button" className={`shape-button shape-${s.type}`} onClick={() => addNode(s.type)} disabled={!lanes.length}>
              <span className="shape-icon" aria-hidden />
              {s.label}
            </button>
          ))}
        </div>
        <p className="muted small">Drag from a node's edge dot to another node to connect them.</p>
      </section>
    </aside>
  );
}
