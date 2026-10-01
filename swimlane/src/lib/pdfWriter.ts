import { strToU8, zlibSync } from "fflate";

/** One PDF page showing a single full-page RGB picture. */
export interface ImagePage {
  /** Page size in points. */
  width: number;
  height: number;
  /** Picture size in pixels and its pixels as RGB triples, row by row. */
  pixelWidth: number;
  pixelHeight: number;
  rgb: Uint8Array;
}

/**
 * A minimal PDF writer: each page is one losslessly compressed picture
 * stretched over the page. Small enough to keep a PDF library out of the app.
 */
export function buildImagePdf(pages: ImagePage[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const write = (part: string | Uint8Array) => {
    const bytes = typeof part === "string" ? strToU8(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: (string | Uint8Array)[]) => {
    offsets[id] = length;
    write(`${id} 0 obj\n`);
    body.forEach(write);
    write("\nendobj\n");
  };

  // Object ids: 1 catalog, 2 page tree, then three per page (page, content, image).
  const pageId = (i: number) => 3 + i * 3;
  write("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  object(2, [`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] >>`]);
  pages.forEach((page, i) => {
    const id = pageId(i);
    const w = page.width.toFixed(2);
    const h = page.height.toFixed(2);
    object(id, [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
    ]);
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    object(id + 1, [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
    const data = zlibSync(page.rgb, { level: 6 });
    object(id + 2, [
      `<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${data.length} >>\nstream\n`,
      data,
      "\nendstream",
    ]);
  });

  const count = 3 + pages.length * 3;
  const xref = length;
  write(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) write(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  write(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}
