// Visual audit: `node tests/visual.mjs [label]`. Full-page screenshots at each required width plus automated layout checks.
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { serve } from "./serve.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const label = process.argv[2] ?? "latest";
const outDir = new URL(`../docs/screenshots/${label}/`, import.meta.url);
await mkdir(outDir, { recursive: true });
const server = await serve();
const browser = await chromium.launch();
let failures = 0;
try {
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: w < 768 ? 800 : 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Scroll like a visitor so lazy images load, then return to the top.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForLoadState("networkidle");
    // Wait for displayed images only (hidden lazy images, e.g. the desktop-only stage on phones, never load by design), at most 8 s.
    await page.evaluate(() => Promise.race([
      Promise.all([...document.images].filter(i => i.getClientRects().length && getComputedStyle(i).display !== "none")
        .map(i => i.complete ? null : new Promise(r => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))),
      new Promise(r => setTimeout(r, 8000)),
    ]));
    const report = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflowX = document.documentElement.scrollWidth - vw;
      const offscreen = [], clipped = [], smallTargets = [];
      const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0" && r.width > 0 && r.height > 0; };
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        if (!visible(el) || el.closest("[aria-hidden='true']") || el.closest(".visually-hidden") || el.closest("[data-bleed]")) continue;
        const r = el.getBoundingClientRect();
        if ((r.right > vw + 1 || r.left < -1) && !el.closest("canvas") && el.tagName !== "SVG") offscreen.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 60));
        const s = getComputedStyle(el);
        if (el.children.length === 0 && el.textContent.trim() && (s.overflow === "hidden" || s.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 1) clipped.push(el.textContent.trim().slice(0, 40));
      }
      if (vw < 768) for (const el of document.querySelectorAll("a, button, input, select, textarea, label[for]")) {
        if (!visible(el) || el.classList.contains("skip")) continue;
        // A label is only the tap target when its control is visually hidden (custom chips); otherwise the control is.
        if (el.tagName === "LABEL") { const c = document.getElementById(el.htmlFor); if (c && getComputedStyle(c).opacity !== "0") continue; }
        const r = el.getBoundingClientRect();
        if (r.height < 44 && !(el.tagName === "A" && el.closest("p"))) smallTargets.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || el.id).trim().slice(0, 24)}" ${Math.round(r.height)}px`);
      }
      return { overflowX, offscreen: [...new Set(offscreen)].slice(0, 8), clipped: clipped.slice(0, 8), smallTargets: smallTargets.slice(0, 10) };
    });
    const ok = report.overflowX <= 0 && report.offscreen.length === 0 && report.clipped.length === 0 && report.smallTargets.length === 0;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${w}px  overflow ${report.overflowX}px` +
      (report.offscreen.length ? `  offscreen: ${report.offscreen.join(", ")}` : "") +
      (report.clipped.length ? `  clipped: ${report.clipped.join(" | ")}` : "") +
      (report.smallTargets.length ? `  small targets: ${report.smallTargets.join(" | ")}` : ""));
    await page.screenshot({ path: new URL(`${w}.png`, outDir).pathname, fullPage: true });
    await page.close();
  }
} finally { await browser.close(); server.close(); }
console.log(failures ? `\n${failures} width(s) need fixes` : "\nAll widths pass the automated layout checks");
process.exit(failures ? 1 : 0);
