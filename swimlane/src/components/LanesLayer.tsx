import { memo, useState } from "react";
import { ViewportPortal } from "@xyflow/react";
import { LANE_HEADER_WIDTH } from "../shared/layout";
import type { Lane } from "../shared/schema";
import { useEditor } from "../store";

interface Props {
  lanes: Lane[];
  width: number;
}

function LaneHeader({ lane, selected }: { lane: Lane; selected: boolean }) {
  const select = useEditor((s) => s.select);
  const updateLane = useEditor((s) => s.updateLane);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lane.name);

  const finish = (save: boolean) => {
    setEditing(false);
    const name = draft.trim();
    if (save && name && name !== lane.name) updateLane(lane.id, { name });
    else setDraft(lane.name);
  };

  return (
    <div
      className={`lane-header nopan${selected ? " is-selected" : ""}`}
      style={{ width: LANE_HEADER_WIDTH, height: lane.height }}
      role="button"
      tabIndex={0}
      aria-label={`Department ${lane.name}. Press Enter to select, double-click to rename.`}
      onClick={() => select({ kind: "lane", ids: [lane.id] })}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !editing) select({ kind: "lane", ids: [lane.id] });
      }}
      onDoubleClick={() => {
        setDraft(lane.name);
        setEditing(true);
      }}
    >
      {editing ? (
        <input
          autoFocus
          className="lane-name-input"
          value={draft}
          aria-label="Department name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") finish(true);
            else if (e.key === "Escape") finish(false);
          }}
        />
      ) : (
        <span className="lane-name">{lane.name}</span>
      )}
    </div>
  );
}

/**
 * Lanes are drawn in the viewport underneath edges and nodes rather than as
 * graph nodes, so connectors are never hidden behind a lane.
 */
function LanesLayerComponent({ lanes, width }: Props) {
  const selection = useEditor((s) => s.selection);
  let top = 0;
  return (
    <ViewportPortal>
      <div className="lanes" style={{ width }}>
        {lanes.map((lane) => {
          const y = top;
          top += lane.height;
          const selected = selection?.kind === "lane" && selection.ids.includes(lane.id);
          return (
            <div key={lane.id} className="lane" style={{ top: y, height: lane.height, width, background: lane.color }}>
              <LaneHeader lane={lane} selected={selected} />
            </div>
          );
        })}
      </div>
    </ViewportPortal>
  );
}

export const LanesLayer = memo(LanesLayerComponent);
