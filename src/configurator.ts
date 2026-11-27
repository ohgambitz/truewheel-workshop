import { cssVar } from "./motion.js";

type Option = { id: string; name: string; note: string; price: number; grams?: number; leadDays?: number; spokes?: number };
type Group = "size" | "rim" | "hub" | "spokes";

const OPTIONS: Record<Group, Option[]> = {
  size: [
    { id: "700c", name: "700c", note: "Road and gravel", price: 0 },
    { id: "650b", name: "650b", note: "Gravel and all-road", price: 0 },
    { id: "29", name: "29 inch", note: "Mountain", price: 20 },
  ],
  rim: [
    { id: "alloy", name: "Alloy", note: "470 g, tubeless", price: 180, grams: 470 },
    { id: "carbon", name: "Carbon", note: "395 g, 30 mm deep", price: 620, grams: 395 },
    { id: "carbon-aero", name: "Carbon aero", note: "470 g, 45 mm deep", price: 780, grams: 470 },
  ],
  hub: [
    { id: "shimano-105", name: "Shimano 105", note: "Easy to service", price: 90, grams: 460, leadDays: 0 },
    { id: "dt-350", name: "DT Swiss 350", note: "Star ratchet", price: 310, grams: 380, leadDays: 0 },
    { id: "ck-r45", name: "Chris King R45", note: "Long-life bearings", price: 560, grams: 410, leadDays: 7 },
  ],
  spokes: [
    { id: "24", name: "24", note: "Lighter riders", price: 0, spokes: 24 },
    { id: "28", name: "28", note: "Most riders", price: 0, spokes: 28 },
    { id: "32", name: "32", note: "Heavier or loaded", price: 0, spokes: 32 },
  ],
};
const DEFAULTS: Record<Group, string> = { size: "700c", rim: "alloy", hub: "dt-350", spokes: "28" };
const LABOUR = 140, SPOKE_PRICE = 3.1, SPOKE_GRAMS = 5.6;

export type Quote = { summary: string; total: number; leadText: string };
const money = (n: number): string => `$${n.toLocaleString("en-US")}`;
const pick = (g: Group, id: string): Option => OPTIONS[g].find(o => o.id === id) ?? OPTIONS[g][0];

export function quoteFor(sel: Record<Group, string>) {
  const size = pick("size", sel.size), rim = pick("rim", sel.rim), hub = pick("hub", sel.hub), sp = pick("spokes", sel.spokes);
  const spokeCount = (sp.spokes ?? 28) * 2;
  const spokesCost = Math.round(spokeCount * SPOKE_PRICE);
  const total = rim.price * 2 + hub.price + spokesCost + LABOUR + size.price;
  const weight = (rim.grams ?? 0) * 2 + (hub.grams ?? 0) + spokeCount * SPOKE_GRAMS;
  const lead = hub.leadDays ?? 0;
  return {
    lines: [
      ["Two rims", `${rim.name}, ${size.name}`, money(rim.price * 2)],
      ["Hubs", hub.name, money(hub.price)],
      ["Spokes", `${spokeCount} Sapim Race`, money(spokesCost)],
      ["Build labour", "Tension-mapped", money(LABOUR + size.price)],
      ["Weight", "Pair, estimated", `${Math.round(weight).toLocaleString("en-US")} g`],
    ] as [string, string, string][],
    total,
    leadText: `Ready in ${7 + lead} to ${10 + lead} days`,
    summary: `${size.name} ${rim.name} rims, ${hub.name} hubs, ${sp.name} spokes`,
    spokesPerWheel: sp.spokes ?? 28,
  };
}

function drawWheel(canvas: HTMLCanvasElement, spokes: number): void {
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  const dpr = window.devicePixelRatio || 1, s = canvas.getBoundingClientRect().width || 200, c = s / 2;
  canvas.width = Math.round(s * dpr); canvas.height = Math.round(s * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const ink = cssVar("--ink"), soft = cssVar("--soft"), brass = cssVar("--brass");
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = ink; ctx.lineWidth = Math.max(5, s * 0.05); ctx.beginPath(); ctx.arc(c, c, c * 0.9, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(c, c, c * 0.78, 0, Math.PI * 2); ctx.stroke();
  const st = (Math.PI * 2) / spokes, cross = spokes <= 24 ? 2 : 3;
  for (let i = 0; i < spokes; i++) {
    const ra = -Math.PI / 2 + i * st, dir = Math.floor(i / 2) % 2 ? 1 : -1, ha = ra + dir * cross * st * 2;
    ctx.strokeStyle = i % 2 ? soft : ink; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c + Math.cos(ha) * c * 0.1, c + Math.sin(ha) * c * 0.1); ctx.lineTo(c + Math.cos(ra) * c * 0.78, c + Math.sin(ra) * c * 0.78); ctx.stroke();
  }
  ctx.fillStyle = brass; ctx.beginPath(); ctx.arc(c, c, c * 0.1, 0, Math.PI * 2); ctx.fill();
}

/** Builds the option chips, keeps the quote panel in sync, and reports the current build to the booking form. */
export function initConfigurator(root: HTMLElement, onBook: (q: Quote) => void): void {
  const sel: Record<Group, string> = { ...DEFAULTS };
  const lines = root.querySelector<HTMLElement>("[data-quote-lines]");
  const total = root.querySelector<HTMLElement>("[data-quote-total]");
  const lead = root.querySelector<HTMLElement>("[data-quote-lead]");
  const canvas = root.querySelector<HTMLCanvasElement>("[data-quote-wheel]");
  const book = root.querySelector<HTMLAnchorElement>("[data-book-build]");
  if (!lines || !total || !lead || !canvas || !book) return;

  (Object.keys(OPTIONS) as Group[]).forEach(group => {
    const host = root.querySelector<HTMLElement>(`[data-options="${group}"]`);
    if (!host) return;
    OPTIONS[group].forEach(opt => {
      const id = `opt-${group}-${opt.id}`;
      const input = document.createElement("input");
      input.type = "radio"; input.name = `build-${group}`; input.id = id; input.value = opt.id; input.checked = sel[group] === opt.id;
      const label = document.createElement("label");
      label.htmlFor = id;
      const name = document.createElement("span"); name.className = "opt-name"; name.textContent = opt.name;
      const note = document.createElement("span"); note.className = "opt-note"; note.textContent = opt.note;
      label.append(name, note);
      input.addEventListener("change", () => { sel[group] = opt.id; render(); });
      const wrap = document.createElement("div"); wrap.className = "opt"; wrap.append(input, label);
      host.append(wrap);
    });
  });

  const render = (): void => {
    const q = quoteFor(sel);
    lines.replaceChildren(...q.lines.map(([k, v, p]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = `${v}: ${p}`;
      row.append(dt, dd); return row;
    }));
    total.textContent = money(q.total);
    lead.textContent = q.leadText;
    drawWheel(canvas, q.spokesPerWheel);
  };
  book.addEventListener("click", () => { const q = quoteFor(sel); onBook({ summary: q.summary, total: q.total, leadText: q.leadText }); });
  window.addEventListener("resize", () => drawWheel(canvas, quoteFor(sel).spokesPerWheel));
  render();
}
