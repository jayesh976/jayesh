import { useEffect, useId, useState } from "react";
import type { ProcessModel, ProcessNode } from "../shared/schema";
import { useEditor } from "../store";
import { Icons } from "./Icons";

/** Text/number/color input that keeps a local draft and writes to the model once, on blur or Enter. */
function Field({
  label,
  value,
  type = "text",
  min,
  max,
  onCommit,
}: {
  label: string;
  value: string | number;
  type?: "text" | "number" | "color";
  min?: number;
  max?: number;
  onCommit: (value: string) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    if (draft !== String(value) && draft.trim() !== "") onCommit(draft);
    else setDraft(String(value));
  };
  return (
    <div className={`field field-${type}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={draft}
        min={min}
        max={max}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setDraft(String(value));
        }}
      />
    </div>
  );
}

const clamp = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || min)));

function NodeProperties({ node, model }: { node: ProcessNode; model: ProcessModel }) {
  const { updateNode, deleteSelection, duplicateSelection } = useEditor.getState();
  const setStyle = (patch: Partial<ProcessNode["style"]>) => updateNode(node.id, { style: { ...node.style, ...patch } });
  const typeName = { start: "Start", end: "End", process: "Activity", decision: "Decision", document: "Document" }[node.type];
  const laneSelectId = useId();

  return (
    <>
      <h2>{typeName}</h2>
      <Field label={node.type === "decision" ? "Decision text" : "Text"} value={node.text} onCommit={(text) => updateNode(node.id, { text })} />
      <div className="field">
        <label htmlFor={laneSelectId}>Department</label>
        <select id={laneSelectId} value={node.laneId} onChange={(e) => updateNode(node.id, { laneId: e.target.value })}>
          {model.lanes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <Field label="Fill" type="color" value={node.style.fill} onCommit={(fill) => setStyle({ fill })} />
        <Field label="Border" type="color" value={node.style.stroke} onCommit={(stroke) => setStyle({ stroke })} />
        <Field label="Text" type="color" value={node.style.textColor} onCommit={(textColor) => setStyle({ textColor })} />
      </div>
      <div className="field-row">
        <Field label="Width" type="number" min={60} max={480} value={node.width} onCommit={(v) => updateNode(node.id, { width: clamp(v, 60, 480) })} />
        <Field label="Height" type="number" min={30} max={320} value={node.height} onCommit={(v) => updateNode(node.id, { height: clamp(v, 30, 320) })} />
        <Field label="Font size" type="number" min={8} max={32} value={node.style.fontSize} onCommit={(v) => setStyle({ fontSize: clamp(v, 8, 32) })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={node.uncertain} onChange={(e) => updateNode(node.id, { uncertain: e.target.checked })} />
        Needs review (shown with a dashed border and “?”)
      </label>
      <div className="actions">
        <button type="button" onClick={duplicateSelection}>
          <Icons.copy /> Duplicate
        </button>
        <button type="button" className="danger" onClick={deleteSelection}>
          <Icons.trash /> Delete
        </button>
      </div>
    </>
  );
}

function Summary({ model }: { model: ProcessModel }) {
  const activities = model.nodes.filter((n) => n.type === "process" || n.type === "document");
  const decisions = model.nodes.filter((n) => n.type === "decision");
  const laneName = new Map(model.lanes.map((l) => [l.id, l.name]));
  const list = (items: string[]) => (items.length ? <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul> : <p className="muted small">None identified</p>);
  return (
    <div className="summary">
      <h2>Process summary</h2>
      <h3>Process name</h3>
      <p>{model.title}</p>
      <h3>Departments</h3>
      {list(model.lanes.map((l) => l.name))}
      <h3>Main activities</h3>
      {list(activities.map((n) => `${n.text} (${laneName.get(n.laneId)})`))}
      <h3>Decisions</h3>
      {list(decisions.map((n) => n.text))}
      <h3>Inputs</h3>
      {list(model.summary.inputs)}
      <h3>Outputs</h3>
      {list(model.summary.outputs)}
      {model.summary.notes.length > 0 && (
        <>
          <h3>Notes and assumptions</h3>
          {list(model.summary.notes)}
        </>
      )}
      <p className="muted small">Select a node, connector or department to edit it.</p>
    </div>
  );
}

export function PropertiesPanel() {
  const model = useEditor((s) => s.model);
  const selection = useEditor((s) => s.selection);
  const { updateEdge, updateLane, moveLane, deleteSelection, duplicateSelection, arrange } = useEditor.getState();
  if (!model) return null;

  let content: JSX.Element;
  if (selection?.kind === "node" && selection.ids.length > 1) {
    content = (
      <>
        <h2>{selection.ids.length} nodes selected</h2>
        <div className="actions wrap">
          <button type="button" onClick={() => arrange("align-left")}>Align left</button>
          <button type="button" onClick={() => arrange("align-center")}>Align centers</button>
          <button type="button" onClick={() => arrange("align-middle")}>Align middles</button>
          <button type="button" onClick={() => arrange("distribute-x")} disabled={selection.ids.length < 3}>Distribute horizontally</button>
        </div>
        <div className="actions">
          <button type="button" onClick={duplicateSelection}><Icons.copy /> Duplicate</button>
          <button type="button" className="danger" onClick={deleteSelection}><Icons.trash /> Delete</button>
        </div>
      </>
    );
  } else if (selection?.kind === "node") {
    const node = model.nodes.find((n) => n.id === selection.ids[0]);
    content = node ? <NodeProperties key={node.id} node={node} model={model} /> : <Summary model={model} />;
  } else if (selection?.kind === "edge") {
    const edge = model.edges.find((e) => e.id === selection.ids[0]);
    const name = (id: string) => model.nodes.find((n) => n.id === id)?.text ?? "?";
    content = edge ? (
      <>
        <h2>Connector</h2>
        <p className="muted small">
          {name(edge.source)} → {name(edge.target)}
        </p>
        <Field label="Label" value={edge.label ?? ""} onCommit={(label) => updateEdge(edge.id, { label: label.trim() || null })} />
        <div className="actions wrap">
          <button type="button" onClick={() => updateEdge(edge.id, { label: "Yes" })}>Yes</button>
          <button type="button" onClick={() => updateEdge(edge.id, { label: "No" })}>No</button>
          <button type="button" onClick={() => updateEdge(edge.id, { label: null })}>No label</button>
        </div>
        <p className="muted small">Drag either end of the connector onto another node to reconnect it.</p>
        <div className="actions">
          <button type="button" className="danger" onClick={deleteSelection}><Icons.trash /> Delete connector</button>
        </div>
      </>
    ) : (
      <Summary model={model} />
    );
  } else if (selection?.kind === "lane") {
    const index = model.lanes.findIndex((l) => l.id === selection.ids[0]);
    const lane = model.lanes[index];
    content = lane ? (
      <>
        <h2>Department</h2>
        <Field label="Department name" value={lane.name} onCommit={(name) => updateLane(lane.id, { name: name.trim() })} />
        <div className="field-row">
          <Field label="Lane color" type="color" value={lane.color} onCommit={(color) => updateLane(lane.id, { color })} />
          <Field label="Height" type="number" min={80} max={1200} value={lane.height} onCommit={(v) => updateLane(lane.id, { height: clamp(v, 80, 1200) })} />
        </div>
        <div className="actions wrap">
          <button type="button" disabled={index === 0} onClick={() => moveLane(lane.id, -1)}><Icons.up /> Move up</button>
          <button type="button" disabled={index === model.lanes.length - 1} onClick={() => moveLane(lane.id, 1)}><Icons.down /> Move down</button>
        </div>
        <div className="actions">
          <button
            type="button"
            className="danger"
            onClick={() => {
              const count = model.nodes.filter((n) => n.laneId === lane.id).length;
              if (!count || window.confirm(`Delete ${lane.name} and its ${count} step(s)? You can undo this.`)) deleteSelection();
            }}
          >
            <Icons.trash /> Delete department
          </button>
        </div>
      </>
    ) : (
      <Summary model={model} />
    );
  } else {
    content = <Summary model={model} />;
  }

  return (
    <aside className="properties" aria-label="Properties">
      {content}
    </aside>
  );
}
