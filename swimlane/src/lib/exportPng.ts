import { toPng } from "html-to-image";
import { canvasWidth } from "../shared/layout";
import type { ProcessModel } from "../shared/schema";

const MARGIN = 24;

/** Render the whole diagram (not just the visible part) to a high-resolution PNG and download it. */
export async function exportPng(model: ProcessModel): Promise<void> {
  const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewport) throw new Error("Canvas not found");
  const width = canvasWidth(model.nodes) + MARGIN * 2;
  const height = model.lanes.reduce((sum, l) => sum + l.height, 0) + MARGIN * 2;
  const dataUrl = await toPng(viewport, {
    backgroundColor: "#ffffff",
    width,
    height,
    pixelRatio: 2,
    style: { width: `${width}px`, height: `${height}px`, transform: `translate(${MARGIN}px, ${MARGIN}px) scale(1)` },
    filter: (el) => !(el instanceof HTMLElement && el.classList.contains("react-flow__handle")),
  });
  const link = document.createElement("a");
  link.download = `${model.title.replace(/[^\w\- ]+/g, "").trim() || "process"}.png`;
  link.href = dataUrl;
  link.click();
}
