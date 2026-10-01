import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
  type NodeTypes,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import { canvasWidth, chooseSides, laneOffsets, placeInLane } from "../shared/layout";
import type { ProcessModel, ProcessNode } from "../shared/schema";
import { useEditor, type Selection } from "../store";
import { LanesLayer } from "./LanesLayer";
import { StepNode, type StepFlowNode } from "./nodes/StepNode";

const nodeTypes: NodeTypes = { step: StepNode };

/** Fit the whole diagram, lanes included, not only the nodes. */
export function useFitDiagram() {
  const { fitBounds } = useReactFlow();
  return useCallback(
    (duration = 200) => {
      const { model } = useEditor.getState();
      if (!model) return;
      const height = model.lanes.reduce((sum, l) => sum + l.height, 0);
      fitBounds({ x: 0, y: 0, width: canvasWidth(model.nodes), height }, { padding: 0.04, duration });
    },
    [fitBounds],
  );
}

function toFlowNodes(model: ProcessModel, selection: Selection): StepFlowNode[] {
  const offsets = laneOffsets(model.lanes);
  const selected = new Set(selection?.kind === "node" ? selection.ids : []);
  return model.nodes.map((step) => ({
    id: step.id,
    type: "step",
    position: { x: step.x, y: step.y + (offsets.get(step.laneId) ?? 0) },
    data: { step },
    width: step.width,
    height: step.height,
    selected: selected.has(step.id),
  }));
}

function toFlowEdges(model: ProcessModel, selection: Selection): Edge[] {
  const offsets = laneOffsets(model.lanes);
  const box = new Map(
    model.nodes.map((n: ProcessNode) => [n.id, { x: n.x, y: n.y + (offsets.get(n.laneId) ?? 0), w: n.width, h: n.height }]),
  );
  const selected = new Set(selection?.kind === "edge" ? selection.ids : []);
  return model.edges
    .filter((e) => box.has(e.source) && box.has(e.target))
    .map((e) => {
      const [sourceHandle, targetHandle] = chooseSides(box.get(e.source)!, box.get(e.target)!);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle,
        targetHandle,
        type: "smoothstep",
        label: e.label ?? undefined,
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        labelStyle: { fontWeight: 600, fontSize: 11, fill: "#1f2733" },
        labelBgStyle: { fill: "#ffffff", stroke: "#c3c9d2", strokeWidth: 1 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#4a5a70" },
        style: { stroke: "#4a5a70", strokeWidth: 1.5 },
        selected: selected.has(e.id),
        reconnectable: true,
      };
    });
}

export function Canvas({ model }: { model: ProcessModel }) {
  const selection = useEditor((s) => s.selection);
  const select = useEditor((s) => s.select);
  const moveNodes = useEditor((s) => s.moveNodes);
  const connect = useEditor((s) => s.connect);
  const reconnect = useEditor((s) => s.reconnect);
  const fitDiagram = useFitDiagram();

  // A newly generated or loaded diagram is shown in full.
  useEffect(() => {
    const timer = setTimeout(() => fitDiagram(0), 0);
    return () => clearTimeout(timer);
  }, [model.createdAt, fitDiagram]);

  const derivedNodes = useMemo(() => toFlowNodes(model, selection), [model, selection]);
  const edges = useMemo(() => toFlowEdges(model, selection), [model, selection]);
  const width = useMemo(() => canvasWidth(model.nodes), [model.nodes]);

  // React Flow owns positions only while a drag is in progress; the model is updated on drop.
  const [nodes, setNodes] = useState(derivedNodes);
  useEffect(() => setNodes(derivedNodes), [derivedNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<StepFlowNode>[]) =>
      setNodes((current) => applyNodeChanges(changes.filter((c) => c.type === "position" || c.type === "dimensions"), current)),
    [],
  );

  const onNodeDragStop = useCallback(
    (_: unknown, __: StepFlowNode, dragged: StepFlowNode[]) => {
      moveNodes(
        dragged.map((n) => ({
          id: n.id,
          x: Math.round(n.position.x),
          ...placeInLane(model.lanes, n.position.y, n.data.step.height),
        })),
      );
    },
    [model.lanes, moveNodes],
  );

  const onSelectionChange = useCallback(
    ({ nodes: sn, edges: se }: OnSelectionChangeParams) => {
      if (sn.length) select({ kind: "node", ids: sn.map((n) => n.id) });
      else if (se.length) select({ kind: "edge", ids: se.map((e) => e.id) });
      else if (useEditor.getState().selection?.kind !== "lane") select(null);
    },
    [select],
  );

  const onConnect = useCallback((c: Connection) => c.source && c.target && connect(c.source, c.target), [connect]);
  const onReconnect = useCallback(
    (old: Edge, c: Connection) => c.source && c.target && reconnect(old.id, c.source, c.target),
    [reconnect],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDragStop={onNodeDragStop}
      onSelectionChange={onSelectionChange}
      onPaneClick={() => select(null)}
      onConnect={onConnect}
      onReconnect={onReconnect}
      connectionMode={ConnectionMode.Loose}
      deleteKeyCode={null}
      zoomOnDoubleClick={false}
      snapToGrid
      snapGrid={[10, 10]}
      minZoom={0.15}
      maxZoom={2.5}
      onInit={() => fitDiagram(0)}
      proOptions={{ hideAttribution: true }}
      aria-label="Swimlane diagram canvas"
    >
      <LanesLayer lanes={model.lanes} width={width} />
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d5dae1" />
      <Controls position="bottom-left" showInteractive={false} showFitView={false} />
      <MiniMap position="bottom-right" pannable zoomable nodeColor={(n) => (n.data as StepFlowNode["data"]).step.style.stroke} />
    </ReactFlow>
  );
}
