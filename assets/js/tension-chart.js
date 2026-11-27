import { cssVar, prefersReducedMotion } from "./motion.js";
const SPOKES = 32;
const KNOCK_MS = 280;
const PAUSE_MS = 380;
const SPOKE_GAP_MS = 42;
const SETTLE_MS = 560;
const roughValues = () => Array.from({ length: SPOKES }, (_, i) => 1 + Math.sin(i * 1.7) * 0.14 + (Math.random() - 0.5) * 0.3);
const trueValues = () => Array.from({ length: SPOKES }, () => 1 + (Math.random() - 0.5) * 0.05);
const spreadPercent = (v) => Math.round(((Math.max(...v) - Math.min(...v)) / 2) * 100);
const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);
const spring = (k) => (k >= 1 ? 1 : 1 - Math.exp(-6 * k) * Math.cos(7.5 * k));
export function initTensionChart(root) {
    const canvas = root.querySelector("canvas");
    const value = root.querySelector("[data-spread-value]");
    const label = root.querySelector("[data-spread-label]");
    const button = root.querySelector("[data-knock]");
    const live = root.querySelector("[data-spread-live]");
    if (!canvas || !value || !label || !button)
        return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    let current = trueValues();
    let active = -1;
    let frameId = 0, timerId = 0;
    let size = 0, dpr = 1;
    let colors = { light: "", brass: "" };
    const measure = () => {
        dpr = window.devicePixelRatio || 1;
        size = canvas.getBoundingClientRect().width || 300;
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        colors = { light: cssVar("--on-frame"), brass: cssVar("--brass") };
    };
    const draw = (vals) => {
        if (!size)
            measure();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const c = size / 2, r = c * 0.62, { light, brass } = colors;
        ctx.clearRect(0, 0, size, size);
        ctx.strokeStyle = light;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(5, size * 0.028);
        ctx.beginPath();
        ctx.arc(c, c, c * 0.93, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(c, c, c * 0.86, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.arc(c, c, c * 0.07, 0, Math.PI * 2);
        ctx.fill();
        const point = (i, rad) => {
            const a = -Math.PI / 2 + (i * Math.PI * 2) / SPOKES;
            return [c + Math.cos(a) * rad, c + Math.sin(a) * rad];
        };
        for (let i = 0; i < SPOKES; i++) {
            const [x1, y1] = point(i, c * 0.07), [x2, y2] = point(i, c * 0.86);
            const on = i === active;
            ctx.strokeStyle = on ? brass : light;
            ctx.globalAlpha = on ? 0.95 : 0.3;
            ctx.lineWidth = on ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = light;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(c, c, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brass;
        ctx.lineWidth = Math.max(2, size * 0.006);
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i <= SPOKES; i++) {
            const [x, y] = point(i % SPOKES, r * vals[i % SPOKES]);
            if (i === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = brass;
        ctx.globalAlpha = 0.12;
        ctx.fill();
        ctx.globalAlpha = 1;
        for (let i = 0; i < SPOKES; i++) {
            const [px, py] = point(i, r * vals[i]);
            ctx.fillStyle = brass;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(3, size * 0.009) * (i === active ? 1.7 : 1), 0, Math.PI * 2);
            ctx.fill();
        }
    };
    const show = (vals, phase) => {
        root.dataset.phase = phase;
        value.textContent = `${spreadPercent(vals)}%`;
        label.textContent = phase === "true" ? "tension spread after truing" : phase === "knock" ? "tension spread, knocked out" : "truing, spoke by spoke";
    };
    const animate = (ms, frame, done) => {
        const start = performance.now();
        const step = (now) => {
            const k = Math.min(1, (now - start) / ms);
            frame(k);
            if (k < 1)
                frameId = requestAnimationFrame(step);
            else
                done();
        };
        frameId = requestAnimationFrame(step);
    };
    const finish = (to, announce) => {
        active = -1;
        current = to;
        draw(to);
        show(to, "true");
        if (announce && live)
            live.textContent = `Trued. Tension spread is now ${spreadPercent(to)}%.`;
    };
    const trueRound = (from, announce) => {
        const to = trueValues();
        const total = SPOKE_GAP_MS * (SPOKES - 1) + SETTLE_MS;
        animate(total, k => {
            const t = k * total;
            current = from.map((v, i) => v + (to[i] - v) * spring(Math.max(0, (t - i * SPOKE_GAP_MS) / SETTLE_MS)));
            active = Math.min(SPOKES - 1, Math.floor(t / SPOKE_GAP_MS));
            draw(current);
            show(current, "truing");
        }, () => finish(to, announce));
    };
    const run = (fromCurrent, announce) => {
        cancelAnimationFrame(frameId);
        window.clearTimeout(timerId);
        const rough = roughValues();
        if (prefersReducedMotion()) {
            finish(trueValues(), announce);
            return;
        }
        if (!fromCurrent) {
            current = rough;
            active = -1;
            draw(rough);
            show(rough, "knock");
            timerId = window.setTimeout(() => trueRound(rough, announce), 600);
            return;
        }
        const start = current.slice();
        animate(KNOCK_MS, k => {
            const e = easeOutCubic(k);
            current = start.map((v, i) => v + (rough[i] - v) * e);
            active = -1;
            draw(current);
            show(current, "knock");
            canvas.style.transform = k < 1 ? `translateX(${(Math.sin(k * 28) * 5 * (1 - k)).toFixed(2)}px)` : "";
        }, () => { canvas.style.transform = ""; timerId = window.setTimeout(() => trueRound(rough, announce), PAUSE_MS); });
    };
    button.addEventListener("click", () => run(true, true));
    let resizeTimer = 0;
    window.addEventListener("resize", () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { measure(); draw(current); }, 150); });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { measure(); draw(current); });
    measure();
    run(false, false);
}
