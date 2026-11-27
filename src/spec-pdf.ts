/**
 * Builds a one-page A4 build specification as a real PDF in the browser, with no library.
 * Uses the PDF standard fonts (Helvetica, Helvetica-Bold, Courier), so text stays selectable and the file stays small.
 * The wheel render is embedded as a JPEG drawn from the preview image.
 */
export type SpecRow = [string, string];
export type Spec = {
  reference: string;
  date: string;
  rows: SpecRow[];        // specification table
  prices: [string, string, string][]; // label, part, price
  total: string;
  lead: string;
  targets: SpecRow[];     // workshop tolerances
  image?: { bytes: Uint8Array; width: number; height: number };
};

const W = 595.28, H = 841.89, M = 48; // A4 in points, margin
const enc = new TextEncoder();
// Standard fonts use WinAnsi; keep text to printable ASCII so every viewer renders it.
const ascii = (s: string): string => s.replace(/[‒-―−]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7E]/g, "");
const esc = (s: string): string => ascii(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const n = (v: number): string => (Math.round(v * 100) / 100).toString();

// Helvetica advance widths (per 1000 em) for right-aligning and wrapping; anything unlisted uses 556.
const HV: Record<string, number> = { " ": 278, ",": 278, ".": 278, "-": 333, ":": 278, "(": 333, ")": 333, "'": 191, "/": 278, i: 222, l: 222, j: 222, t: 278, f: 278, r: 333, I: 278, J: 500, m: 833, w: 722, M: 833, W: 944, s: 500, c: 500, k: 500, v: 500, x: 500, y: 500, z: 500 };
const widthOf = (s: string, size: number, mono = false): number =>
  mono ? ascii(s).length * 600 * size / 1000 : [...ascii(s)].reduce((w, ch) => w + (HV[ch] ?? (ch >= "A" && ch <= "Z" ? 667 : 556)), 0) * size / 1000;

export function buildSpecPdf(spec: Spec): Uint8Array {
  const ops: string[] = [];
  const ink = "0.078 0.153 0.122", soft = "0.267 0.345 0.306", brass = "0.886 0.698 0.227", green = "0.063 0.141 0.106";
  const text = (s: string, x: number, y: number, font: "F1" | "F2" | "F3", size: number, color = ink) =>
    ops.push(`BT /${font} ${size} Tf ${color} rg ${n(x)} ${n(y)} Td (${esc(s)}) Tj ET`);
  const right = (s: string, x: number, y: number, font: "F1" | "F2" | "F3", size: number, color = ink) =>
    text(s, x - widthOf(s, size, font === "F3"), y, font, size, color);
  const rule = (y: number, w = 0.6, color = "0.749 0.788 0.761") => ops.push(`${color} RG ${w} w ${M} ${n(y)} m ${n(W - M)} ${n(y)} l S`);

  // Header band
  ops.push(`${green} rg 0 ${n(H - 112)} ${n(W)} 112 re f`);
  text("TRUEWHEEL", M, H - 58, "F2", 22, "0.933 0.941 0.925");
  text("Build specification", M, H - 82, "F1", 12, "0.725 0.784 0.749");
  right(spec.reference, W - M, H - 58, "F3", 11, brass);
  right(spec.date, W - M, H - 82, "F1", 10, "0.725 0.784 0.749");

  // Render and specification table side by side
  let y = H - 150;
  const imgW = 210;
  if (spec.image) {
    const h = imgW * spec.image.height / spec.image.width;
    ops.push(`q ${imgW} 0 0 ${n(h)} ${M} ${n(y - h)} cm /Im1 Do Q`);
  }
  const tx = M + imgW + 26, tw = W - M - tx;
  text("Specification", tx, y - 6, "F2", 13);
  let ty = y - 30;
  for (const [k, v] of spec.rows) {
    text(k, tx, ty, "F1", 9, soft);
    // Wrap long values onto a second line under the label column.
    const words = ascii(v).split(" "); let line = "", lines: string[] = [];
    for (const w of words) { const t = line ? line + " " + w : w; if (widthOf(t, 10) > tw - 92 && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    lines.forEach((l, i) => text(l, tx + 92, ty - i * 13, "F1", 10));
    ty -= 13 * lines.length + 9;
    ops.push(`0.749 0.788 0.761 RG 0.5 w ${n(tx)} ${n(ty + 12)} m ${n(W - M)} ${n(ty + 12)} l S`);
  }

  // Estimate
  y = Math.min(ty, y - (spec.image ? imgW * spec.image.height / spec.image.width : 0)) - 30;
  text("Estimate", M, y, "F2", 13); y -= 12; rule(y, 1, ink); y -= 20;
  for (const [label, part, price] of spec.prices) {
    text(label, M, y, "F1", 10, soft); text(part, M + 150, y, "F1", 10); right(price, W - M, y, "F3", 10);
    y -= 10; rule(y); y -= 16;
  }
  y -= 14;
  text("Estimated total, pair", M, y + 4, "F1", 10, soft);
  right(spec.total, W - M, y - 6, "F2", 30);
  text(spec.lead, M, y - 12, "F1", 10);
  y -= 50;

  // Tolerances
  ops.push(`${brass} rg ${M} ${n(y - 2)} 4 14 re f`);
  text("What we build to", M + 12, y, "F2", 13); y -= 24;
  const colW = (W - 2 * M) / spec.targets.length;
  spec.targets.forEach(([k, v], i) => { text(v, M + i * colW, y, "F3", 12); text(k, M + i * colW, y - 15, "F1", 8.5, soft); });
  y -= 46;

  rule(y, 0.6);
  const notes = [
    "This is an estimate, not an order. Prices include the parts listed and build labour; any other parts are quoted",
    "separately and fitted only after you approve them. Lead time starts when the parts are in the workshop.",
    "Sample business site: the business name, prices and lead times are illustrative, and the image is a render.",
  ];
  notes.forEach((l, i) => text(l, M, y - 16 - i * 12, "F1", 8, soft));

  const content = enc.encode(ops.join("\n"));
  const parts: Uint8Array[] = []; const offsets: number[] = []; let len = 0;
  const push = (b: Uint8Array | string) => { const u = typeof b === "string" ? enc.encode(b) : b; parts.push(u); len += u.length; };
  const obj = (id: number, body: (Uint8Array | string)[]) => { offsets[id] = len; push(`${id} 0 obj\n`); body.forEach(push); push("\nendobj\n"); };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  const xobj = spec.image ? " /XObject << /Im1 8 0 R >>" : "";
  obj(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(W)} ${n(H)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >>${xobj} >> >>`]);
  obj(4, [`<< /Length ${content.length} >>\nstream\n`, content, "\nendstream"]);
  obj(5, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"]);
  obj(6, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"]);
  obj(7, ["<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>"]);
  const count = spec.image ? 9 : 8;
  if (spec.image) obj(8, [`<< /Type /XObject /Subtype /Image /Width ${spec.image.width} /Height ${spec.image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${spec.image.bytes.length} >>\nstream\n`, spec.image.bytes, "\nendstream"]);
  const xref = len;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let i = 1; i < count; i++) push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info << /Title (Truewheel build specification ${esc(spec.reference)}) /Producer (Truewheel Workshop site) >> >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(len); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** Draws an image onto a studio-coloured canvas and returns JPEG bytes for embedding. */
export async function jpegFrom(img: HTMLImageElement, size = 640): Promise<{ bytes: Uint8Array; width: number; height: number } | undefined> {
  try {
    if (!img.complete || !img.naturalWidth) await img.decode();
    const c = document.createElement("canvas"); c.width = size; c.height = size;
    const ctx = c.getContext("2d"); if (!ctx) return undefined;
    ctx.fillStyle = "#DDE1DC"; ctx.fillRect(0, 0, size, size);
    const g = ctx.createRadialGradient(size / 2, size * 0.4, 0, size / 2, size * 0.4, size * 0.7);
    g.addColorStop(0, "#F7F8F5"); g.addColorStop(1, "#DDE1DC"); ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, size * 0.06, size * 0.06, size * 0.88, size * 0.88);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/jpeg", 0.86));
    if (!blob) return undefined;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: size, height: size };
  } catch { return undefined; }
}
