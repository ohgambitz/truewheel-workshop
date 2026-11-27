import { cssVar, prefersReducedMotion } from "./motion.js";

const SPOKES = 32;
const DURATION_MS = 1600;

const roughValues = (): number[] =>
  Array.from({ length: SPOKES }, (_, i) => 1 + Math.sin(i * 1.7) * 0.14 + (Math.random() - 0.5) * 0.3);
const trueValues = (): number[] =>
  Array.from({ length: SPOKES }, () => 1 + (Math.random() - 0.5) * 0.05);
const spreadPercent = (v: number[]): number => Math.round(((Math.max(...v) - Math.min(...v)) / 2) * 100);
const easeOutCubic = (k: number): number => 1 - Math.pow(1 - k, 3);

/** Spoke-tension chart that starts uneven and settles to an even ring ("truing"). */
export function initTensionChart(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const value = root.querySelector<HTMLElement>("[data-spread-value]");
  const label = root.querySelector<HTMLElement>("[data-spread-label]");
  const button = root.querySelector<HTMLButtonElement>("[data-knock]");
  if (!canvas || !value || !label || !button) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let current = trueValues();
  let frameId = 0;

  const draw = (vals: number[]): void => {
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.getBoundingClientRect().width || 320;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = size / 2, r = c * 0.62;
    const light = cssVar("--on-frame"), brass = cssVar("--brass");
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = light; ctx.globalAlpha = 0.9; ctx.lineWidth = Math.max(5, size * 0.028);
    ctx.beginPath(); ctx.arc(c, c, c * 0.93, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(c, c, c * 0.86, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = light;
    ctx.beginPath(); ctx.arc(c, c, c * 0.07, 0, Math.PI * 2); ctx.fill();
    const point = (i: number, rad: number): [number, number] => {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / SPOKES;
      return [c + Math.cos(a) * rad, c + Math.sin(a) * rad];
    };
    for (let i = 0; i < SPOKES; i++) {
      const [x1, y1] = point(i, c * 0.07), [x2, y2] = point(i, c * 0.86);
      ctx.strokeStyle = light; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [px, py] = point(i, r * vals[i]);
      ctx.globalAlpha = 1; ctx.fillStyle = brass;
      ctx.beginPath(); ctx.arc(px, py, Math.max(3, size * 0.009), 0, Math.PI * 2); ctx.fill();
    }
    ctx.setLineDash([4, 6]); ctx.strokeStyle = light; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.strokeStyle = brass; ctx.lineWidth = Math.max(2, size * 0.006); ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i <= SPOKES; i++) {
      const [x, y] = point(i % SPOKES, r * vals[i % SPOKES]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.fillStyle = brass; ctx.globalAlpha = 0.12; ctx.fill(); ctx.globalAlpha = 1;
  };

  const show = (vals: number[], settled: boolean): void => {
    value.textContent = `${spreadPercent(vals)}%`;
    label.textContent = settled ? "tension spread after truing" : "tension spread before truing";
  };

  const trueWheel = (delayMs: number): void => {
    cancelAnimationFrame(frameId);
    const from = roughValues(), to = trueValues();
    current = from; draw(from); show(from, false);
    if (prefersReducedMotion()) { current = to; draw(to); show(to, true); return; }
    window.setTimeout(() => {
      const start = performance.now();
      const step = (now: number): void => {
        const k = Math.min(1, (now - start) / DURATION_MS), e = easeOutCubic(k);
        current = from.map((v, i) => v + (to[i] - v) * e);
        draw(current); show(current, k >= 1);
        if (k < 1) frameId = requestAnimationFrame(step);
      };
      frameId = requestAnimationFrame(step);
    }, delayMs);
  };

  button.addEventListener("click", () => trueWheel(300));
  let resizeTimer = 0;
  window.addEventListener("resize", () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => draw(current), 150); });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => draw(current));
  trueWheel(600);
}
