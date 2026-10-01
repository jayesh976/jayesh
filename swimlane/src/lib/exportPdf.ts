import type { ProcessModel } from "../shared/schema";
import { renderPng } from "./exportPng";

const MARGIN = 36; // pt
const HEADER = 30; // pt reserved for the title line
/** Below this scale the diagram text gets too small to read, so it is split across pages. */
const MIN_READABLE_SCALE = 0.35;

export const pdfFileName = (model: ProcessModel) => `${model.title.replace(/[^\w\- ]+/g, "").trim() || "process"}.pdf`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the rendered diagram"));
    img.src = src;
  });

/**
 * Build a PDF of the whole diagram, oriented to its shape, with the process
 * title on every page. Uses A4, or A3 for large diagrams; diagrams that would
 * still shrink below a readable size are split left to right across pages.
 */
export async function renderPdf(model: ProcessModel): Promise<Blob> {
  const [{ jsPDF }, dataUrl] = await Promise.all([import("jspdf"), renderPng(model)]);
  const img = await loadImage(dataUrl);
  const pixelRatio = 2; // renderPng renders at 2x
  const width = img.width / pixelRatio;
  const height = img.height / pixelRatio;

  const orientation = width >= height ? "landscape" : "portrait";
  // A4 when the diagram stays readable on it, otherwise A3, otherwise A3 split across pages.
  const fit = (format: "a4" | "a3") => {
    const probe = new jsPDF({ orientation, unit: "pt", format });
    const pageW = probe.internal.pageSize.getWidth();
    const pageH = probe.internal.pageSize.getHeight();
    const availW = pageW - MARGIN * 2;
    const availH = pageH - MARGIN * 2 - HEADER;
    return { format, pageW, pageH, availW, availH, scale: Math.min(availW / width, availH / height) };
  };
  let page = fit("a4");
  if (page.scale < MIN_READABLE_SCALE) page = fit("a3");
  const { format, pageW, pageH, availW, availH } = page;
  let scale = page.scale;
  if (scale < MIN_READABLE_SCALE) scale = Math.min(MIN_READABLE_SCALE, availH / height);
  const pdf = new jsPDF({ orientation, unit: "pt", format, compress: true });
  const sliceWidth = availW / scale; // CSS px of diagram per page
  const pages = Math.max(1, Math.ceil(width / sliceWidth - 0.01));

  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage(format, orientation);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(31, 39, 51);
    pdf.text(model.title, MARGIN, MARGIN + 12);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(93, 104, 120);
    pdf.text(pages > 1 ? `Page ${i + 1} of ${pages}` : new Date().toLocaleDateString(), pageW - MARGIN, MARGIN + 12, { align: "right" });

    const sx = i * sliceWidth;
    const sw = Math.min(sliceWidth, width - sx);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * pixelRatio);
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, Math.round(sx * pixelRatio), 0, canvas.width, img.height, 0, 0, canvas.width, img.height);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", MARGIN, MARGIN + HEADER, sw * scale, height * scale, undefined, "FAST");
  }
  addSummary(pdf, model, { format, orientation, pageW, pageH, top: MARGIN + HEADER + height * scale + 24 });
  return pdf.output("blob");
}

type Pdf = InstanceType<(typeof import("jspdf"))["jsPDF"]>;

/** Process summary in columns under the diagram, or on a new page when there is no room. */
function addSummary(
  pdf: Pdf,
  model: ProcessModel,
  page: { format: string; orientation: "landscape" | "portrait"; pageW: number; pageH: number; top: number },
) {
  const laneName = new Map(model.lanes.map((l) => [l.id, l.name]));
  const sections: [string, string[]][] = [
    ["Departments", model.lanes.map((l) => l.name)],
    ["Activities", model.nodes.filter((n) => n.type === "process" || n.type === "document").map((n) => `${n.text} (${laneName.get(n.laneId)})`)],
    ["Decisions", model.nodes.filter((n) => n.type === "decision").map((n) => n.text)],
    ["Inputs", model.summary.inputs],
    ["Outputs", model.summary.outputs],
  ];
  const lineH = 12;
  const tallest = Math.max(...sections.map(([, items]) => Math.max(items.length, 1)));
  const needed = 22 + (tallest + 1) * lineH;
  let top = page.top;
  if (top + needed > page.pageH - MARGIN) {
    pdf.addPage(page.format, page.orientation);
    top = MARGIN;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(31, 39, 51);
  pdf.text("Process summary", MARGIN, top + 10);
  const colW = (page.pageW - MARGIN * 2) / sections.length;
  sections.forEach(([heading, items], i) => {
    const x = MARGIN + i * colW;
    let y = top + 30;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(31, 39, 51);
    pdf.text(heading, x, y);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 70, 85);
    for (const item of items.length ? items : ["None identified"]) {
      y += lineH;
      if (y > page.pageH - MARGIN) break;
      pdf.text(pdf.splitTextToSize(`• ${item}`, colW - 10)[0], x, y);
    }
  });
}

/** Build and download (full app; the hosted preview uses the viewer's download prompt instead). */
export async function exportPdf(model: ProcessModel): Promise<void> {
  const blob = await renderPdf(model);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = pdfFileName(model);
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
