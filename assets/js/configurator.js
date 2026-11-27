import { setOdometer } from "./odometer.js";
const OPTIONS = {
    size: [
        { id: "700c", name: "700c", note: "Road and gravel", price: 0, bsd: 622 },
        { id: "650b", name: "650b", note: "Gravel and all-road", price: 0, bsd: 584 },
        { id: "29", name: "29 inch", note: "Mountain", price: 20, bsd: 622 },
    ],
    rim: [
        { id: "alloy", name: "Alloy", note: "Tubeless, 22 mm deep", price: 180, grams: 470, depth: 22 },
        { id: "carbon", name: "Carbon", note: "30 mm deep", price: 620, grams: 395, depth: 30 },
        { id: "carbon-aero", name: "Carbon aero", note: "45 mm deep", price: 780, grams: 470, depth: 45 },
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
const GROUPS = ["size", "rim", "hub", "spokes"];
const GROUP_NAME = { size: "wheel size", rim: "rims", hub: "hubs", spokes: "spoke count" };
const DEFAULTS = { size: "700c", rim: "alloy", hub: "dt-350", spokes: "28" };
const LABOUR = 140, SPOKE_PRICE = 3.1, SPOKE_GRAMS = 5.6;
const RULES = [
    { a: ["size", "29"], b: ["hub", ["shimano-105"]], why: "Shimano 105 is a road hub, so it doesn't fit mountain-bike frames" },
    { a: ["size", "29"], b: ["hub", ["ck-r45"]], why: "Chris King R45 is a road hub, so it doesn't fit mountain-bike frames" },
    { a: ["size", "29"], b: ["rim", ["carbon-aero"]], why: "our 45 mm aero rims are road rims and aren't made in 29 inch" },
    { a: ["hub", "shimano-105"], b: ["spokes", ["24", "28"]], why: "we stock Shimano 105 hubs drilled for 32 spokes only" },
];
const conflicts = (sel) => RULES.filter(r => sel[r.a[0]] === r.a[1] && r.b[1].includes(sel[r.b[0]]));
export function resolve(sel, group, id) {
    const next = { ...sel, [group]: id };
    const changes = [];
    for (let pass = 0; pass < 4; pass++) {
        const c = conflicts(next)[0];
        if (!c)
            break;
        const g = c.a[0] === group ? c.b[0] : c.b[0] === group ? c.a[0] : c.b[0];
        const ok = (id2) => conflicts({ ...next, [g]: id2 }).length < conflicts(next).length;
        const candidates = [DEFAULTS[g], ...OPTIONS[g].map(o => o.id).reverse()].filter(o => o !== next[g]);
        const to = candidates.find(ok);
        if (!to)
            break;
        changes.push({ group: g, from: next[g], to, why: c.why });
        next[g] = to;
    }
    return { sel: next, changes };
}
const money = (n) => "$" + n.toLocaleString("en-US");
const pick = (g, id) => OPTIONS[g].find(o => o.id === id) ?? OPTIONS[g][0];
export function quoteFor(sel) {
    const size = pick("size", sel.size), rim = pick("rim", sel.rim), hub = pick("hub", sel.hub), sp = pick("spokes", sel.spokes);
    const n = (sp.spokes ?? 28) * 2;
    const spokesCost = Math.round(n * SPOKE_PRICE);
    const total = rim.price * 2 + hub.price + spokesCost + LABOUR + size.price;
    const weight = Math.round((rim.grams ?? 0) * 2 + (hub.grams ?? 0) + n * SPOKE_GRAMS);
    const lead = hub.leadDays ?? 0;
    return {
        lines: [
            ["Rims, pair", `${rim.name}, ${size.name}`, money(rim.price * 2)],
            ["Hubs", hub.name, money(hub.price)],
            ["Spokes", `${n} Sapim Race`, money(spokesCost)],
            ["Build labour", "Tension-mapped", money(LABOUR + size.price)],
        ],
        total, weight,
        leadText: `Ready in ${7 + lead} to ${10 + lead} days`,
        summary: `${size.name} ${rim.name} rims, ${hub.name} hubs, ${sp.name} spokes`,
        rim: rim.id, spokesPerWheel: sp.spokes ?? 28, rimName: rim.name,
        size, rimOpt: rim, hub, depth: rim.depth ?? 22, bsd: size.bsd ?? 622,
    };
}
const signed = (n, unit) => {
    const abs = Math.abs(Math.round(n)).toLocaleString("en-US");
    return (n > 0 ? "+" : "−") + (unit === "$" ? "$" + abs : abs + " g");
};
const reference = (sel) => {
    let h = 2166136261;
    for (const ch of GROUPS.map(g => sel[g]).join("|")) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return "TW-" + (h >>> 0).toString(36).toUpperCase().slice(0, 6);
};
export function initConfigurator(root, onBook) {
    let sel = { ...DEFAULTS };
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const lines = $("[data-quote-lines]"), preview = $("[data-preview]"), caption = $("[data-preview-caption]");
    const totals = $$("[data-quote-total]"), leads = $$("[data-quote-lead]"), weights = $$("[data-quote-weight]");
    const spec = $("[data-spec]"), books = $$("[data-book-build]");
    const profileBody = $("[data-profile-body]"), depthOut = $("[data-profile-depth]"), bsdOut = $("[data-profile-bsd]"), spokesOut = $("[data-profile-spokes]");
    const download = $("[data-download-spec]");
    if (!lines || !totals.length || !preview || !caption)
        return;
    const notice = document.createElement("p");
    notice.className = "compat";
    notice.setAttribute("role", "status");
    notice.hidden = true;
    let changed = null;
    const deltas = new Map();
    const inputs = new Map();
    GROUPS.forEach(group => {
        const host = $(`[data-options="${group}"]`);
        if (!host)
            return;
        OPTIONS[group].forEach(opt => {
            const id = `opt-${group}-${opt.id}`;
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `build-${group}`;
            input.id = id;
            input.value = opt.id;
            input.checked = sel[group] === opt.id;
            input.setAttribute("aria-describedby", `${id}-d`);
            const label = document.createElement("label");
            label.htmlFor = id;
            const name = document.createElement("span");
            name.className = "opt-name";
            name.textContent = opt.name;
            const note = document.createElement("span");
            note.className = "opt-note";
            note.textContent = opt.note;
            const delta = document.createElement("span");
            delta.className = "opt-delta";
            delta.id = `${id}-d`;
            deltas.set(id, delta);
            label.append(name, note, delta);
            input.addEventListener("change", () => choose(group, opt.id, host.closest("fieldset")));
            label.addEventListener("pointerenter", () => { const r = resolve(sel, group, opt.id).sel; preload(pick("rim", r.rim).id, pick("spokes", r.spokes).spokes ?? 28); });
            const wrap = document.createElement("div");
            wrap.className = "opt";
            wrap.append(input, label);
            host.append(wrap);
            inputs.set(id, input);
        });
    });
    const choose = (group, id, fieldset) => {
        const r = resolve(sel, group, id);
        sel = r.sel;
        changed = group;
        r.changes.forEach(c => { const i = inputs.get(`opt-${c.group}-${c.to}`); if (i)
            i.checked = true; });
        if (r.changes.length) {
            notice.textContent = r.changes.map(c => `Changed ${GROUP_NAME[c.group]} to ${pick(c.group, c.to).name}: ${c.why}.`).join(" ");
            notice.hidden = false;
            fieldset?.after(notice);
            root.dataset.adjusted = r.changes.map(c => c.group).join(" ");
        }
        else {
            notice.hidden = true;
            delete root.dataset.adjusted;
        }
        render(r.changes.map(c => c.group));
    };
    const src = (rim, spokes, w) => `assets/img/studio/wheel-${rim}-${spokes}-${w}.webp`;
    const preload = (rim, spokes) => { const i = new Image(); i.sizes = "(max-width: 900px) 90vw, 560px"; i.srcset = `${src(rim, spokes, 600)} 600w, ${src(rim, spokes, 1100)} 1100w`; };
    const imgs = $$("[data-preview] img");
    let front = 0, shown = "";
    const showPreview = (rim, spokes, label) => {
        const key = `${rim}-${spokes}`;
        if (key === shown)
            return;
        shown = key;
        const next = imgs[1 - front];
        const swap = () => { next.classList.add("is-front"); imgs[front].classList.remove("is-front"); front = 1 - front; };
        next.onload = () => { next.onload = null; swap(); };
        next.srcset = `${src(rim, spokes, 600)} 600w, ${src(rim, spokes, 1100)} 1100w`;
        next.src = src(rim, spokes, 1100);
        next.alt = `${label} rims laced with ${spokes} spokes`;
        if (next.complete && next.naturalWidth) {
            next.onload = null;
            swap();
        }
        caption.textContent = `Render: ${label} rims, ${spokes} spokes per wheel`;
    };
    const render = (adjusted = []) => {
        const q = quoteFor(sel);
        lines.replaceChildren(...q.lines.map(([k, v, p]) => {
            const row = document.createElement("div");
            const dt = document.createElement("dt");
            dt.textContent = k;
            const dd = document.createElement("dd");
            const part = document.createElement("span");
            part.className = "part";
            part.textContent = v;
            const price = document.createElement("span");
            price.className = "price";
            price.textContent = p;
            dd.append(part, price);
            row.append(dt, dd);
            return row;
        }));
        const LINE_FOR = { size: 0, rim: 0, hub: 1, spokes: 2 };
        const touched = new Set([...(changed ? [changed] : []), ...adjusted]);
        touched.forEach(g => lines.children[LINE_FOR[g]]?.classList.add("is-changed"));
        if (spec) {
            const items = [
                ["size", "Size", q.size.name], ["rim", "Rims", q.rimName],
                ["hub", "Hubs", q.hub.name], ["spokes", "Spokes", `${q.spokesPerWheel} per wheel`],
            ];
            spec.replaceChildren(...items.map(([g, key, val]) => {
                const li = document.createElement("li");
                const k = document.createElement("span");
                k.className = "k";
                k.textContent = key;
                const v = document.createElement("span");
                v.className = "v";
                v.textContent = val;
                li.append(k, v);
                if (touched.has(g))
                    li.className = "is-changed";
                return li;
            }));
        }
        totals.forEach(t => setOdometer(t, money(q.total)));
        leads.forEach(l => (l.textContent = q.leadText));
        weights.forEach(w => (w.textContent = `${q.weight.toLocaleString("en-US")} g`));
        if (profileBody)
            profileBody.style.transform = `scaleY(${((q.depth * 74 / 45 - 18) / 56).toFixed(3)})`;
        if (depthOut)
            depthOut.textContent = `${q.depth} mm`;
        if (bsdOut)
            bsdOut.textContent = `${q.bsd} mm`;
        if (spokesOut)
            spokesOut.textContent = `${q.spokesPerWheel} × 2`;
        GROUPS.forEach(group => OPTIONS[group].forEach(opt => {
            const el = deltas.get(`opt-${group}-${opt.id}`);
            if (!el)
                return;
            if (sel[group] === opt.id) {
                el.textContent = "Selected";
                el.dataset.kind = "selected";
                return;
            }
            const r = resolve(sel, group, opt.id), q2 = quoteFor(r.sel);
            const dp = q2.total - q.total, dg = q2.weight - q.weight;
            const dl = (q2.hub.leadDays ?? 0) - (q.hub.leadDays ?? 0);
            const parts = [dp ? signed(dp, "$") : "Same price", dg ? signed(dg, "g") : "", dl ? `${dl > 0 ? "+" : "−"}${Math.abs(dl)} days` : ""];
            el.textContent = parts.filter(Boolean).join(", ");
            if (r.changes.length) {
                const sets = document.createElement("span");
                sets.className = "opt-sets";
                sets.textContent = "sets " + r.changes.map(c => pick(c.group, c.to).name + (c.group === "spokes" ? " spokes" : c.group === "size" ? " size" : "")).join(", ");
                el.append(sets);
            }
            el.dataset.kind = r.changes.length ? "adjusts" : "";
        }));
        showPreview(q.rim, q.spokesPerWheel, q.rimName);
        changed = null;
    };
    books.forEach(b => b.addEventListener("click", () => { const q = quoteFor(sel); onBook({ summary: q.summary, total: q.total, leadText: q.leadText }); }));
    download?.addEventListener("click", async () => {
        download.disabled = true;
        const label = download.textContent;
        download.textContent = "Preparing PDF…";
        try {
            const { buildSpecPdf, jpegFrom } = await import("./spec-pdf.js");
            const q = quoteFor(sel), ref = reference(sel);
            const image = await jpegFrom(imgs[front]);
            const bytes = buildSpecPdf({
                reference: ref,
                date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                rows: [
                    ["Wheel size", `${q.size.name}, ${q.bsd} mm bead seat diameter`],
                    ["Rims", `${q.rimName}, ${q.rimOpt.note.toLowerCase()}`],
                    ["Hubs", `${q.hub.name}, ${q.hub.note.toLowerCase()}`],
                    ["Spokes", `${q.spokesPerWheel} per wheel, ${q.spokesPerWheel * 2} Sapim Race in total`],
                    ["Build", "Hand-laced, tension-mapped, stress-relieved"],
                    ["Weight", `${q.weight.toLocaleString("en-US")} g per pair, estimated`],
                ],
                prices: q.lines,
                total: money(q.total),
                lead: q.leadText,
                targets: [["Spoke tension spread", "within 5%"], ["Side-to-side", "0.2 mm"], ["Up and down", "0.3 mm"], ["Stress relief", "3 passes"]],
                image,
            });
            const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `truewheel-build-${ref}.pdf`;
            document.body.append(a);
            a.click();
            a.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 10000);
            download.textContent = "Spec downloaded";
            window.setTimeout(() => { download.textContent = label; }, 2200);
        }
        catch {
            download.textContent = "Couldn't make the PDF. Try again";
            window.setTimeout(() => { download.textContent = label; }, 3000);
        }
        finally {
            download.disabled = false;
        }
    });
    render();
}
