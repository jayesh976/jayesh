import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ProcessNode } from "../../shared/schema";
import { useEditor } from "../../store";

export type StepNodeData = { step: ProcessNode };
export type StepFlowNode = Node<StepNodeData, "step">;

const SIDES = [
  { id: "t", position: Position.Top },
  { id: "r", position: Position.Right },
  { id: "b", position: Position.Bottom },
  { id: "l", position: Position.Left },
] as const;

function Shape({ step, selected }: { step: ProcessNode; selected: boolean }) {
  const { width: w, height: h, style } = step;
  const strokeWidth = selected ? 2.5 : 1.5;
  const dash = step.uncertain ? "5 4" : undefined;
  if (step.type === "decision") {
    return (
      <svg className="step-shape" width={w} height={h} aria-hidden>
        <polygon
          points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      </svg>
    );
  }
  if (step.type === "document") {
    const wave = h - 10;
    return (
      <svg className="step-shape" width={w} height={h} aria-hidden>
        <path
          d={`M2 2 H${w - 2} V${wave} C ${w * 0.75} ${h + 4}, ${w * 0.25} ${wave - 12}, 2 ${wave} Z`}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      </svg>
    );
  }
  return (
    <div
      className="step-shape"
      style={{
        width: w,
        height: h,
        background: style.fill,
        border: `${strokeWidth}px ${step.uncertain ? "dashed" : "solid"} ${style.stroke}`,
        borderRadius: step.type === "process" ? 6 : h / 2,
      }}
    />
  );
}

function StepNodeComponent({ data, selected }: NodeProps<StepFlowNode>) {
  const { step } = data;
  const updateNode = useEditor((s) => s.updateNode);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(step.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const finish = (save: boolean) => {
    setEditing(false);
    const text = draft.trim();
    if (save && text && text !== step.text) updateNode(step.id, { text });
    else setDraft(step.text);
  };

  const typeName = { start: "Start", end: "End", process: "Activity", decision: "Decision", document: "Document" }[step.type];

  return (
    <div
      className={`step step-${step.type}${selected ? " is-selected" : ""}`}
      style={{ width: step.width, height: step.height }}
      onDoubleClick={() => {
        setDraft(step.text);
        setEditing(true);
      }}
      aria-label={`${typeName}: ${step.text}${step.uncertain ? " (needs review)" : ""}`}
    >
      <Shape step={step} selected={Boolean(selected)} />
      {SIDES.map((s) => (
        <Handle key={s.id} id={s.id} type="source" position={s.position} className="step-handle" />
      ))}
      {editing ? (
        <textarea
          ref={inputRef}
          className="step-editor nodrag nowheel"
          value={draft}
          aria-label="Edit label"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              finish(true);
            } else if (e.key === "Escape") finish(false);
          }}
        />
      ) : (
        <div
          className="step-label"
          style={{
            color: step.style.textColor,
            fontSize: step.style.fontSize,
            padding: step.type === "decision" ? "0 22px" : "0 10px",
          }}
        >
          {step.text}
        </div>
      )}
      {step.uncertain && (
        <span className="step-flag" title="Interpreted from an ambiguous description. Please review.">
          ?
        </span>
      )}
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
