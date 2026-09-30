import { z } from "zod";

/**
 * Two layers of types live here:
 *
 * 1. `AiProcessSchema` is the contract the AI (or the offline parser) must return.
 *    It carries meaning only: lanes, steps, flow. No coordinates, no styling.
 * 2. `ProcessModel` is the app's source of truth. It is the AI output after
 *    validation and normalization, plus layout and user styling. The canvas is
 *    rendered from it and every edit writes back to it.
 */

export const NODE_TYPES = ["start", "end", "process", "decision", "document"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const AiLaneSchema = z.object({
  id: z.string().describe("Short stable id, e.g. 'sales'"),
  name: z.string().describe("Department, team or role name as the user wrote it"),
});

export const AiNodeSchema = z.object({
  id: z.string(),
  type: z.enum(NODE_TYPES),
  laneId: z.string().describe("id of the lane responsible for this step"),
  text: z.string().describe("Concise label, at most about 6 words. Decisions end with '?'"),
  uncertain: z
    .boolean()
    .describe("true when the description was ambiguous and this step is an interpretation"),
});

export const AiConnectionSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z
    .string()
    .nullable()
    .describe("'Yes' or 'No' on decision branches, otherwise null"),
});

export const AiProcessSchema = z.object({
  title: z.string(),
  lanes: z.array(AiLaneSchema),
  nodes: z.array(AiNodeSchema),
  connections: z.array(AiConnectionSchema),
  summary: z.object({
    inputs: z.array(z.string()),
    outputs: z.array(z.string()),
    notes: z
      .array(z.string())
      .describe("Assumptions made where the description was ambiguous"),
  }),
});

export type AiProcess = z.infer<typeof AiProcessSchema>;

export interface NodeStyle {
  fill: string;
  stroke: string;
  textColor: string;
  fontSize: number;
}

export interface Lane {
  id: string;
  name: string;
  color: string;
  height: number;
}

export interface ProcessNode {
  id: string;
  type: NodeType;
  laneId: string;
  text: string;
  /** Absolute x on the canvas. */
  x: number;
  /** y relative to the top of the node's lane, so reordering lanes carries nodes along. */
  y: number;
  width: number;
  height: number;
  style: NodeStyle;
  uncertain: boolean;
}

export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label: string | null;
}

export interface ProcessModel {
  version: 1;
  title: string;
  description: string;
  lanes: Lane[];
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  summary: AiProcess["summary"];
  createdAt: string;
  updatedAt: string;
}

export const GenerateRequestSchema = z.object({
  description: z.string().trim().min(15, "Describe the process in at least one full sentence.").max(8000, "The description is too long. Keep it under 8,000 characters."),
});

export interface GenerateResponse {
  process: AiProcess;
  source: "ai" | "offline";
  warnings: string[];
}
