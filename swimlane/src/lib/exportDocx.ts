import { strToU8, zipSync } from "fflate";
import { canvasWidth, chooseSides, laneOffsets, LANE_HEADER_WIDTH, type Side } from "../shared/layout";
import type { NodeType, ProcessModel } from "../shared/schema";

/**
 * Word export built from native Office drawing objects, not a picture: every
 * lane, step and arrow is its own shape inside a Word drawing canvas, so it can
 * be moved, retyped, recolored or deleted in Word. Arrows are glued connectors,
 * so they follow the steps they join when a step is moved.
 */

const EMU_PER_PX = 9525; // 96 dpi
const EMU_PER_TWIP = 635;
const PAGE_MARGIN = 720; // twips, 0.5 in
const TITLE_SPACE = 900; // twips kept for the title line
/** Below this scale on A4 the text gets too small, so A3 is used instead. */
const MIN_A4_SCALE = 0.6;
const FONT = "Calibri";
const LANE_BORDER = "C3C9D2";
const ARROW = "4A5A70";
const LABEL_TEXT = "1F2733";

const PAGES = { a4: { w: 11906, h: 16838 }, a3: { w: 16838, h: 23811 } };

const GEOMETRY: Record<NodeType, string> = {
  start: "roundRect",
  end: "roundRect",
  process: "rect",
  decision: "diamond",
  document: "flowChartDocument",
};

/**
 * Word's preset diamond keeps text in its middle half, which splits words like
 * "Inventory". This diamond has the same outline and connection points but
 * lets the text use the full width.
 */
const DIAMOND =
  `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst>` +
  `<a:cxn ang="3cd4"><a:pos x="hc" y="t"/></a:cxn><a:cxn ang="cd2"><a:pos x="l" y="vc"/></a:cxn>` +
  `<a:cxn ang="cd4"><a:pos x="hc" y="b"/></a:cxn><a:cxn ang="0"><a:pos x="r" y="vc"/></a:cxn></a:cxnLst>` +
  `<a:rect l="l" t="t" r="r" b="b"/><a:pathLst><a:path w="2" h="2"><a:moveTo><a:pt x="1" y="0"/></a:moveTo>` +
  `<a:lnTo><a:pt x="2" y="1"/></a:lnTo><a:lnTo><a:pt x="1" y="2"/></a:lnTo><a:lnTo><a:pt x="0" y="1"/></a:lnTo><a:close/></a:path></a:pathLst></a:custGeom>`;

/** Connection site indexes shared by rect, roundRect, diamond and flowChartDocument. */
const SITE: Record<Side, number> = { t: 0, l: 1, b: 2, r: 3 };

export const docxFileName = (model: ProcessModel) => `${model.title.replace(/[^\w\- ]+/g, "").trim() || "process"}.docx`;

const esc = (s: string) =>
  s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hex = (color: string, fallback: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim()) ?? /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(color.trim());
  if (!m) return fallback;
  return (m.length === 2 ? m[1] : m.slice(1).map((c) => c + c).join("")).toUpperCase();
};

interface Point {
  x: number;
  y: number;
}

function paragraphs(text: string, opts: { color: string; halfPoints: number; bold?: boolean; caps?: boolean }) {
  const rPr =
    `<w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>${opts.bold ? "<w:b/>" : ""}${opts.caps ? "<w:caps/>" : ""}` +
    `<w:color w:val="${opts.color}"/><w:sz w:val="${opts.halfPoints}"/><w:szCs w:val="${opts.halfPoints}"/></w:rPr>`;
  return text
    .split(/\r?\n/)
    .map(
      (line) =>
        `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="228" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr>` +
        `<w:r>${rPr}<w:t xml:space="preserve">${esc(line)}</w:t></w:r></w:p>`,
    )
    .join("");
}

const xfrm = (off: Point, w: number, h: number, extra = "") =>
  `<a:xfrm${extra}><a:off x="${Math.round(off.x)}" y="${Math.round(off.y)}"/><a:ext cx="${Math.max(0, Math.round(w))}" cy="${Math.max(0, Math.round(h))}"/></a:xfrm>`;

const solid = (color: string, alpha?: number) =>
  `<a:solidFill><a:srgbClr val="${color}">${alpha === undefined ? "" : `<a:alpha val="${alpha}"/>`}</a:srgbClr></a:solidFill>`;

function textShape(args: {
  id: number;
  name: string;
  off: Point;
  w: number;
  h: number;
  geometry: string;
  adj?: string;
  fill: string | null;
  fillAlpha?: number;
  line: string | null;
  lineWidth: number;
  text: string;
  textColor: string;
  halfPoints: number;
  bold?: boolean;
  caps?: boolean;
  inset: number;
  /** Extra left and right inset, for shapes whose text should stay clear of slanted edges. */
  insetX?: number;
}) {
  const geom = args.geometry === "diamond" ? DIAMOND : `<a:prstGeom prst="${args.geometry}"><a:avLst>${args.adj ?? ""}</a:avLst></a:prstGeom>`;
  const fill = args.fill ? solid(args.fill, args.fillAlpha) : "<a:noFill/>";
  const line = args.line ? `<a:ln w="${args.lineWidth}">${solid(args.line)}</a:ln>` : "<a:ln><a:noFill/></a:ln>";
  const inset = Math.round(args.inset);
  const insetX = Math.round(args.insetX ?? args.inset);
  return (
    `<wps:wsp><wps:cNvPr id="${args.id}" name="${esc(args.name)}"/><wps:cNvSpPr/>` +
    `<wps:spPr>${xfrm(args.off, args.w, args.h)}${geom}${fill}${line}</wps:spPr>` +
    (args.text
      ? `<wps:txbx><w:txbxContent>${paragraphs(args.text, { color: args.textColor, halfPoints: args.halfPoints, bold: args.bold, caps: args.caps })}</w:txbxContent></wps:txbx>`
      : "") +
    `<wps:bodyPr rot="0" vert="horz" wrap="square" lIns="${insetX}" tIns="${inset}" rIns="${insetX}" bIns="${inset}" anchor="ctr" anchorCtr="0"><a:noAutofit/></wps:bodyPr>` +
    `</wps:wsp>`
  );
}

const arrowLine = (width: number) =>
  `<a:ln w="${width}">${solid(ARROW)}<a:round/><a:tailEnd type="triangle" w="med" len="med"/></a:ln>`;

/**
 * A connector glued to both steps. Word draws the stored path until a step is
 * moved, then reroutes it, so the stored path matches the app's routing.
 */
function connector(args: {
  id: number;
  name: string;
  p1: Point;
  p2: Point;
  s1: Side;
  s2: Side;
  from: number;
  to: number;
  width: number;
}) {
  const { p1, p2, s1, s2 } = args;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const horizontal = (s: Side) => s === "l" || s === "r";
  const straight = (Math.abs(dy) < 1 && horizontal(s1) && horizontal(s2)) || (Math.abs(dx) < 1 && !horizontal(s1) && !horizontal(s2));
  let prst: string;
  let transform: string;
  if (straight || horizontal(s1)) {
    prst = straight ? "straightConnector1" : horizontal(s2) ? "bentConnector3" : "bentConnector2";
    const flips = `${dx < 0 ? ' flipH="1"' : ""}${dy < 0 ? ' flipV="1"' : ""}`;
    transform = xfrm({ x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y) }, Math.abs(dx), Math.abs(dy), flips);
  } else {
    // Leaving through the top or bottom: the shape is turned a quarter so its first leg runs vertically.
    prst = horizontal(s2) ? "bentConnector2" : "bentConnector3";
    const cx = Math.abs(dy);
    const cy = Math.abs(dx);
    const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const flips = ` rot="5400000"${p1.y > p2.y ? ' flipH="1"' : ""}${p1.x <= p2.x ? ' flipV="1"' : ""}`;
    transform = xfrm({ x: center.x - cx / 2, y: center.y - cy / 2 }, cx, cy, flips);
  }
  return (
    `<wps:wsp><wps:cNvPr id="${args.id}" name="${esc(args.name)}"/>` +
    `<wps:cNvCnPr><a:stCxn id="${args.from}" idx="${SITE[s1]}"/><a:endCxn id="${args.to}" idx="${SITE[s2]}"/></wps:cNvCnPr>` +
    `<wps:spPr>${transform}<a:prstGeom prst="${prst}"><a:avLst/></a:prstGeom><a:noFill/>${arrowLine(args.width)}</wps:spPr>` +
    `<wps:bodyPr/></wps:wsp>`
  );
}

/** A free arrow along the given points, for loops that connectors cannot draw. */
function polyline(args: { id: number; name: string; points: Point[]; width: number }) {
  const xs = args.points.map((p) => p.x);
  const ys = args.points.map((p) => p.y);
  const off = { x: Math.min(...xs), y: Math.min(...ys) };
  const w = Math.max(1, Math.max(...xs) - off.x);
  const h = Math.max(1, Math.max(...ys) - off.y);
  const pt = (p: Point) => `<a:pt x="${Math.round(p.x - off.x)}" y="${Math.round(p.y - off.y)}"/>`;
  const [first, ...rest] = args.points;
  const path =
    `<a:path w="${Math.round(w)}" h="${Math.round(h)}" fill="none"><a:moveTo>${pt(first)}</a:moveTo>` +
    rest.map((p) => `<a:lnTo>${pt(p)}</a:lnTo>`).join("") +
    `</a:path>`;
  return (
    `<wps:wsp><wps:cNvPr id="${args.id}" name="${esc(args.name)}"/><wps:cNvSpPr/>` +
    `<wps:spPr>${xfrm(off, w, h)}<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/>` +
    `<a:pathLst>${path}</a:pathLst></a:custGeom><a:noFill/>${arrowLine(args.width)}</wps:spPr><wps:bodyPr/></wps:wsp>`
  );
}

/** Choose page size and orientation so the diagram is as large as possible on one page. */
function pageLayout(widthPx: number, heightPx: number) {
  const fit = (size: keyof typeof PAGES) => {
    const landscape = widthPx >= heightPx;
    const pageW = landscape ? PAGES[size].h : PAGES[size].w;
    const pageH = landscape ? PAGES[size].w : PAGES[size].h;
    const availW = (pageW - PAGE_MARGIN * 2) * EMU_PER_TWIP;
    const availH = (pageH - PAGE_MARGIN * 2 - TITLE_SPACE) * EMU_PER_TWIP;
    const scale = Math.min(1, availW / (widthPx * EMU_PER_PX), availH / (heightPx * EMU_PER_PX));
    return { landscape, pageW, pageH, scale };
  };
  const a4 = fit("a4");
  return a4.scale >= MIN_A4_SCALE ? a4 : fit("a3");
}

function documentXml(model: ProcessModel): string {
  const width = canvasWidth(model.nodes);
  const height = model.lanes.reduce((sum, l) => sum + l.height, 0);
  const page = pageLayout(width, height);
  const k = EMU_PER_PX * page.scale;
  const E = (px: number) => px * k;
  const P = (p: Point): Point => ({ x: E(p.x), y: E(p.y) });
  // Readable sizes even when the diagram is scaled down.
  const pts = (px: number, min = 7) => Math.round(Math.max(min, px * 0.75 * page.scale) * 2);
  const lineWidth = Math.round(12700 * Math.max(0.75, page.scale));

  const offsets = laneOffsets(model.lanes);
  const shapes: string[] = [];
  let nextId = 2;

  let top = 0;
  for (const lane of model.lanes) {
    shapes.push(
      textShape({
        id: nextId++,
        name: `Lane ${lane.name}`,
        off: P({ x: 0, y: top }),
        w: E(width),
        h: E(lane.height),
        geometry: "rect",
        fill: hex(lane.color, "F5F7FA"),
        line: LANE_BORDER,
        lineWidth: 9525,
        text: "",
        textColor: LABEL_TEXT,
        halfPoints: 20,
        inset: 0,
      }),
      textShape({
        id: nextId++,
        name: `Department ${lane.name}`,
        off: P({ x: 0, y: top }),
        w: E(LANE_HEADER_WIDTH),
        h: E(lane.height),
        geometry: "rect",
        fill: "FFFFFF",
        fillAlpha: 75000,
        line: LANE_BORDER,
        lineWidth: 9525,
        text: lane.name,
        textColor: LABEL_TEXT,
        halfPoints: pts(13),
        bold: true,
        caps: true,
        inset: E(3),
      }),
    );
    top += lane.height;
  }

  const shapeIds = new Map<string, number>();
  const boxes = new Map<string, { x: number; y: number; w: number; h: number; type: NodeType }>();
  for (const node of model.nodes) {
    const id = nextId++;
    const y = node.y + (offsets.get(node.laneId) ?? 0);
    shapeIds.set(node.id, id);
    boxes.set(node.id, { x: node.x, y, w: node.width, h: node.height, type: node.type });
    shapes.push(
      textShape({
        id,
        name: `${node.type[0].toUpperCase()}${node.type.slice(1)} ${node.text}`.slice(0, 120),
        off: P({ x: node.x, y }),
        w: E(node.width),
        h: E(node.height),
        geometry: GEOMETRY[node.type],
        adj: node.type === "start" || node.type === "end" ? '<a:gd name="adj" fmla="val 50000"/>' : undefined,
        fill: hex(node.style.fill, "FFFFFF"),
        line: hex(node.style.stroke, "4A5A70"),
        lineWidth,
        text: node.text,
        textColor: hex(node.style.textColor, "1F2733"),
        halfPoints: pts(node.style.fontSize),
        bold: node.type === "start" || node.type === "end",
        inset: E(4),
        insetX: node.type === "decision" ? E(node.width * 0.14) : E(4),
      }),
    );
  }

  const sidePoint = (b: { x: number; y: number; w: number; h: number; type: NodeType }, side: Side): Point => {
    // The document shape's bottom edge is a wave; its connection point sits a little above the box.
    const bottom = b.type === "document" ? b.y + b.h * 0.934 : b.y + b.h;
    if (side === "t") return { x: b.x + b.w / 2, y: b.y };
    if (side === "b") return { x: b.x + b.w / 2, y: bottom };
    if (side === "l") return { x: b.x, y: b.y + b.h / 2 };
    return { x: b.x + b.w, y: b.y + b.h / 2 };
  };

  const arrows: string[] = [];
  const labels: string[] = [];
  const arrowWidth = Math.round(15875 * Math.max(0.75, page.scale));
  for (const edge of model.edges) {
    const a = boxes.get(edge.source);
    const b = boxes.get(edge.target);
    if (!a || !b) continue;
    const [s1, s2] = chooseSides(a, b);
    const p1 = sidePoint(a, s1);
    const p2 = sidePoint(b, s2);
    const name = `Arrow ${edge.label ? `${edge.label} ` : ""}${edge.source} to ${edge.target}`;
    if (s1 === s2) {
      const drop = Math.max(p1.y, p2.y) + 24;
      arrows.push(polyline({ id: nextId++, name, points: [p1, { x: p1.x, y: drop }, { x: p2.x, y: drop }, p2].map(P), width: arrowWidth }));
    } else {
      arrows.push(
        connector({ id: nextId++, name, p1: P(p1), p2: P(p2), s1, s2, from: shapeIds.get(edge.source)!, to: shapeIds.get(edge.target)!, width: arrowWidth }),
      );
    }
    if (edge.label) {
      // Labels sit just before the arrowhead, so branches leaving one decision do not overlap.
      const w = Math.max(34, edge.label.length * 8 + 18);
      const h = 18;
      const anchor =
        s2 === "l" ? { x: p2.x - w - 10, y: p2.y - h - 3 } : s2 === "r" ? { x: p2.x + 10, y: p2.y - h - 3 } : s2 === "t" ? { x: p2.x + 5, y: p2.y - h - 8 } : { x: p2.x + 5, y: p2.y + 8 };
      labels.push(
        textShape({
          id: nextId++,
          name: `Label ${edge.label}`,
          off: P(anchor),
          w: E(w),
          h: E(h),
          geometry: "roundRect",
          fill: "FFFFFF",
          line: LANE_BORDER,
          lineWidth: 6350,
          text: edge.label,
          textColor: LABEL_TEXT,
          halfPoints: pts(11),
          bold: true,
          inset: 0,
        }),
      );
    }
  }

  const cw = Math.round(E(width));
  const ch = Math.round(E(height + 30)); // room for loop-back arrows under the last lane
  const canvas =
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cw}" cy="${ch}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="1" name="Swimlane diagram"/><wp:cNvGraphicFramePr/>` +
    `<a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas">` +
    `<wpc:wpc><wpc:bg/><wpc:whole><a:ln><a:noFill/></a:ln></wpc:whole>${shapes.join("")}${arrows.join("")}${labels.join("")}</wpc:wpc>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing>`;

  const title =
    `<w:p><w:pPr><w:spacing w:before="0" w:after="160"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>` +
    `<w:b/><w:color w:val="1F2733"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve">${esc(model.title)}</w:t></w:r></w:p>`;

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"` +
    ` xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"` +
    ` xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"` +
    ` xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"` +
    ` xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"` +
    ` xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"` +
    ` xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14">` +
    `<w:body>${title}<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r>` +
    `<mc:AlternateContent><mc:Choice Requires="wpc">${canvas}</mc:Choice></mc:AlternateContent></w:r></w:p>` +
    `<w:sectPr><w:pgSz w:w="${page.pageW}" w:h="${page.pageH}"${page.landscape ? ' w:orient="landscape"' : ""}/>` +
    `<w:pgMar w:top="${PAGE_MARGIN}" w:right="${PAGE_MARGIN}" w:bottom="${PAGE_MARGIN}" w:left="${PAGE_MARGIN}" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr>` +
    `</w:body></w:document>`
  );
}

const CONTENT_TYPES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="xml" ContentType="application/xml"/>` +
  `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
  `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
  `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
  `</Types>`;

const ROOT_RELS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
  `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
  `</Relationships>`;

const DOCUMENT_RELS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
  `</Relationships>`;

const STYLES =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
  `<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}" w:eastAsia="${FONT}"/>` +
  `<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>` +
  `<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
  `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` +
  `</w:styles>`;

const coreXml = (model: ProcessModel) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"` +
  ` xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"` +
  ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
  `<dc:title>${esc(model.title)}</dc:title><dc:creator>Swimlane Studio</dc:creator>` +
  `<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</dcterms:created>` +
  `</cp:coreProperties>`;

/** Build the .docx file bytes for a process diagram. */
export function buildDocx(model: ProcessModel): Uint8Array {
  return zipSync(
    {
      "[Content_Types].xml": strToU8(CONTENT_TYPES),
      "_rels/.rels": strToU8(ROOT_RELS),
      "docProps/core.xml": strToU8(coreXml(model)),
      "word/document.xml": strToU8(documentXml(model)),
      "word/_rels/document.xml.rels": strToU8(DOCUMENT_RELS),
      "word/styles.xml": strToU8(STYLES),
    },
    { level: 6 },
  );
}

export function renderDocx(model: ProcessModel): Blob {
  return new Blob([buildDocx(model) as Uint8Array<ArrayBuffer>], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

export function exportDocx(model: ProcessModel) {
  const url = URL.createObjectURL(renderDocx(model));
  const link = document.createElement("a");
  link.href = url;
  link.download = docxFileName(model);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
