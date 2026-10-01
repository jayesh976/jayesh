import type { ProcessModel } from "../shared/schema";
import { renderPng } from "./exportPng";
import { buildImagePdf, type ImagePage } from "./pdfWriter";

const MARGIN = 36; // pt
const HEADER = 30; // pt reserved for the title line
/** Below this scale the diagram text gets too small to read, so it is split across pages. */
const MIN_READABLE_SCALE = 0.35;
/** Pixels per point when drawing a page, about 144 dpi. */
const DENSITY = 2;
const FONT = "Helvetica, Arial, sans-serif";

const SIZES = { a4: [595.28, 841.89], a3: [841.89, 1190.55] } as const;

export const pdfFileName = (model: ProcessModel) => `${model.title.replace(/[^\w\- ]+/g, "").trim() || "process"}.pdf`;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the rendered diagram"));
    img.src = src;
  });

/** A white page drawn in points; the browser draws all text, so any language works. */
function newPage(pageW: number, pageH: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageW * DENSITY);
  canvas.height = Math.round(pageH * DENSITY);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(DENSITY, DENSITY);
  ctx.textBaseline = "alphabetic";
  return { canvas, ctx };
}

function toImagePage(canvas: HTMLCanvasElement, pageW: number, pageH: number): ImagePage {
  const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
  const rgb = new Uint8Array(canvas.width * canvas.height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i];
    rgb[j + 1] = data[i + 1];
    rgb[j + 2] = data[i + 2];
  }
  return { width: pageW, height: pageH, pixelWidth: canvas.width, pixelHeight: canvas.height, rgb };
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/**
 * Build a PDF of the whole diagram, oriented to its shape, with the process
 * title on every page. Uses A4, or A3 for large diagrams; diagrams that would
 * still shrink below a readable size are split left to right across pages.
 */
export async function renderPdf(model: ProcessModel): Promise<Blob> {
  const img = await loadImage(await renderPng(model));
  const pixelRatio = 2; // renderPng renders at 2x
  const width = img.width / pixelRatio;
  const height = img.height / pixelRatio;

  const landscape = width >= height;
  const fit = (format: keyof typeof SIZES) => {
    const [short, long] = SIZES[format];
    const pageW = landscape ? long : short;
    const pageH = landscape ? short : long;
    const availW = pageW - MARGIN * 2;
    const availH = pageH - MARGIN * 2 - HEADER;
    return { pageW, pageH, availW, availH, scale: Math.min(availW / width, availH / height) };
  };
  let page = fit("a4");
  if (page.scale < MIN_READABLE_SCALE) page = fit("a3");
  const { pageW, pageH, availW, availH } = page;
  let scale = page.scale;
  if (scale < MIN_READABLE_SCALE) scale = Math.min(MIN_READABLE_SCALE, availH / height);
  const sliceWidth = availW / scale; // CSS px of diagram per page
  const count = Math.max(1, Math.ceil(width / sliceWidth - 0.01));

  const pages: ImagePage[] = [];
  let last: ReturnType<typeof newPage> | null = null;
  for (let i = 0; i < count; i++) {
    const p = newPage(pageW, pageH);
    const { ctx } = p;
    ctx.fillStyle = "#1f2733";
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(fitText(ctx, model.title, pageW - MARGIN * 2 - 120), MARGIN, MARGIN + 12);
    ctx.fillStyle = "#5d6878";
    ctx.font = `9px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(count > 1 ? `Page ${i + 1} of ${count}` : new Date().toLocaleDateString(), pageW - MARGIN, MARGIN + 12);
    ctx.textAlign = "left";

    const sx = i * sliceWidth;
    const sw = Math.min(sliceWidth, width - sx);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx * pixelRatio, 0, sw * pixelRatio, img.height, MARGIN, MARGIN + HEADER, sw * scale, height * scale);
    if (i < count - 1) pages.push(toImagePage(p.canvas, pageW, pageH));
    else last = p;
  }

  const top = MARGIN + HEADER + height * scale + 24;
  if (!drawSummary(last!.ctx, model, pageW, pageH, top)) {
    pages.push(toImagePage(last!.canvas, pageW, pageH));
    last = newPage(pageW, pageH);
    drawSummary(last.ctx, model, pageW, pageH, MARGIN);
  }
  pages.push(toImagePage(last!.canvas, pageW, pageH));
  return new Blob([buildImagePdf(pages) as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
}

/** Process summary in columns. Returns false, drawing nothing, when it does not fit below `top`. */
function drawSummary(ctx: CanvasRenderingContext2D, model: ProcessModel, pageW: number, pageH: number, top: number) {
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
  if (top + needed > pageH - MARGIN && top > MARGIN) return false;

  ctx.fillStyle = "#1f2733";
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText("Process summary", MARGIN, top + 10);
  const colW = (pageW - MARGIN * 2) / sections.length;
  sections.forEach(([heading, items], i) => {
    const x = MARGIN + i * colW;
    let y = top + 30;
    ctx.fillStyle = "#1f2733";
    ctx.font = `bold 9px ${FONT}`;
    ctx.fillText(heading, x, y);
    ctx.fillStyle = "#3c4655";
    ctx.font = `9px ${FONT}`;
    for (const item of items.length ? items : ["None identified"]) {
      y += lineH;
      if (y > pageH - MARGIN) break;
      ctx.fillText(fitText(ctx, `• ${item}`, colW - 10), x, y);
    }
  });
  return true;
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
