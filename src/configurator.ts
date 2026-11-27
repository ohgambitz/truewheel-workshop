import { setOdometer } from "./odometer.js";

type Option = { id: string; name: string; note: string; price: number; grams?: number; leadDays?: number; spokes?: number };
type Group = "size" | "rim" | "hub" | "spokes";

const OPTIONS: Record<Group, Option[]> = {
  size: [
    { id: "700c", name: "700c", note: "Road and gravel", price: 0 },
    { id: "650b", name: "650b", note: "Gravel and all-road", price: 0 },
    { id: "29", name: "29 inch", note: "Mountain", price: 20 },
  ],
  rim: [
    { id: "alloy", name: "Alloy", note: "Tubeless, 22 mm deep", price: 180, grams: 470 },
    { id: "carbon", name: "Carbon", note: "30 mm deep", price: 620, grams: 395 },
    { id: "carbon-aero", name: "Carbon aero", note: "45 mm deep", price: 780, grams: 470 },
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
const money = (n: number): string => "$" + n.toLocaleString("en-US");
const pick = (g: Group, id: string): Option => OPTIONS[g].find(o => o.id === id) ?? OPTIONS[g][0];
const spokeCount = (sel: Record<Group, string>) => (pick("spokes", sel.spokes).spokes ?? 28) * 2;

/** Pair cost of choosing `opt` in `group` (rims are bought as two). */
const costOf = (group: Group, opt: Option, sel: Record<Group, string>): number =>
  group === "rim" ? opt.price * 2 : group === "spokes" ? Math.round((opt.spokes ?? 28) * 2 * SPOKE_PRICE) : opt.price;
const gramsOf = (group: Group, opt: Option): number =>
  group === "rim" ? (opt.grams ?? 0) * 2 : group === "hub" ? (opt.grams ?? 0) : group === "spokes" ? (opt.spokes ?? 28) * 2 * SPOKE_GRAMS : 0;

export function quoteFor(sel: Record<Group, string>) {
  const size = pick("size", sel.size), rim = pick("rim", sel.rim), hub = pick("hub", sel.hub), sp = pick("spokes", sel.spokes);
  const n = spokeCount(sel);
  const spokesCost = Math.round(n * SPOKE_PRICE);
  const total = rim.price * 2 + hub.price + spokesCost + LABOUR + size.price;
  const weight = (rim.grams ?? 0) * 2 + (hub.grams ?? 0) + n * SPOKE_GRAMS;
  const lead = hub.leadDays ?? 0;
  return {
    lines: [
      ["Rims, pair", `${rim.name}, ${size.name}`, money(rim.price * 2)],
      ["Hubs", hub.name, money(hub.price)],
      ["Spokes", `${n} Sapim Race`, money(spokesCost)],
      ["Build labour", "Tension-mapped", money(LABOUR + size.price)],
    ] as [string, string, string][],
    total, weight: Math.round(weight),
    leadText: `Ready in ${7 + lead} to ${10 + lead} days`,
    summary: `${size.name} ${rim.name} rims, ${hub.name} hubs, ${sp.name} spokes`,
    rim: rim.id, spokesPerWheel: sp.spokes ?? 28, rimName: rim.name,
  };
}

const signed = (n: number, unit: "$" | "g"): string => {
  if (n === 0) return unit === "$" ? "Included" : "";
  const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
  return (n > 0 ? "+" : "−") + (unit === "$" ? "$" + abs : abs + " g");
};

/** Step-by-step wheelset builder with a live studio preview, per-option price and weight differences, and a rolling total. */
export function initConfigurator(root: HTMLElement, onBook: (q: Quote) => void): void {
  const sel: Record<Group, string> = { ...DEFAULTS };
  const lines = root.querySelector<HTMLElement>("[data-quote-lines]");
  const totals = [...root.querySelectorAll<HTMLElement>("[data-quote-total]")];
  const leads = [...root.querySelectorAll<HTMLElement>("[data-quote-lead]")];
  const weight = root.querySelector<HTMLElement>("[data-quote-weight]");
  const preview = root.querySelector<HTMLElement>("[data-preview]");
  const caption = root.querySelector<HTMLElement>("[data-preview-caption]");
  const books = [...root.querySelectorAll<HTMLAnchorElement>("[data-book-build]")];
  if (!lines || !totals.length || !preview || !caption) return;

  const deltas = new Map<string, HTMLElement>();
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
      const delta = document.createElement("span"); delta.className = "opt-delta"; deltas.set(id, delta);
      label.append(name, note, delta);
      input.addEventListener("change", () => { sel[group] = opt.id; render(); });
      // Warm the image cache for the preview this option would show.
      label.addEventListener("pointerenter", () => preload(group === "rim" ? opt.id : sel.rim, group === "spokes" ? (opt.spokes ?? 28) : quoteFor(sel).spokesPerWheel));
      const wrap = document.createElement("div"); wrap.className = "opt"; wrap.append(input, label);
      host.append(wrap);
    });
  });

  const src = (rim: string, spokes: number, w: number) => `assets/img/studio/wheel-${rim}-${spokes}-${w}.webp`;
  const preload = (rim: string, spokes: number) => { const i = new Image(); i.srcset = `${src(rim, spokes, 600)} 600w, ${src(rim, spokes, 1100)} 1100w`; i.sizes = "(max-width: 900px) 90vw, 560px"; };
  const imgs = [...preview.querySelectorAll<HTMLImageElement>("img")];
  let front = 0, shown = "";

  const showPreview = (rim: string, spokes: number, label: string): void => {
    const key = `${rim}-${spokes}`;
    if (key === shown) return;
    shown = key;
    const next = imgs[1 - front];
    const swap = () => { next.classList.add("is-front"); imgs[front].classList.remove("is-front"); front = 1 - front; };
    next.onload = () => { next.onload = null; swap(); };
    next.srcset = `${src(rim, spokes, 600)} 600w, ${src(rim, spokes, 1100)} 1100w`;
    next.src = src(rim, spokes, 1100);
    next.alt = `${label} rims laced with ${spokes} spokes`;
    if (next.complete && next.naturalWidth) { next.onload = null; swap(); }
    caption.textContent = `Render: ${label} rims, ${spokes} spokes per wheel`;
  };

  const render = (): void => {
    const q = quoteFor(sel);
    lines.replaceChildren(...q.lines.map(([k, v, p]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = `${v}: ${p}`;
      row.append(dt, dd); return row;
    }));
    totals.forEach(t => setOdometer(t, money(q.total)));
    leads.forEach(l => (l.textContent = q.leadText));
    if (weight) weight.textContent = `${q.weight.toLocaleString("en-US")} g`;
    // Differences are shown against the current choice in each step, so every option says what switching would do.
    (Object.keys(OPTIONS) as Group[]).forEach(group => {
      const current = pick(group, sel[group]);
      OPTIONS[group].forEach(opt => {
        const el = deltas.get(`opt-${group}-${opt.id}`); if (!el) return;
        if (opt.id === current.id) { el.textContent = "Selected"; return; }
        const dp = costOf(group, opt, sel) - costOf(group, current, sel);
        const dg = gramsOf(group, opt) - gramsOf(group, current);
        const lead = group === "hub" ? (opt.leadDays ?? 0) - (current.leadDays ?? 0) : 0;
        el.textContent = [dp ? signed(dp, "$") : "Same price", dg ? signed(dg, "g") : "", lead > 0 ? `+${lead} days` : ""].filter(Boolean).join(", ");
      });
    });
    showPreview(q.rim, q.spokesPerWheel, q.rimName);
  };

  books.forEach(b => b.addEventListener("click", () => { const q = quoteFor(sel); onBook({ summary: q.summary, total: q.total, leadText: q.leadText }); }));
  render();
}
