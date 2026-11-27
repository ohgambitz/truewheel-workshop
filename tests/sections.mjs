// Section screenshots: `node tests/sections.mjs <label> [url]`. One image per major section at desktop, tablet and phone widths.
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { serve } from "./serve.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const label = process.argv[2] ?? "latest";
const url = process.argv[3] ?? "http://127.0.0.1:4173/";
const SECTIONS = { hero: "[data-hero]", craft: "#craft", prices: "#services", builder: "#builder", process: "#process", booking: "#book", faq: "#faq", footer: "footer" };
const VIEWPORTS = { desktop: [1440, 900], tablet: [768, 1024], mobile: [390, 844] };

const server = url.includes("127.0.0.1") ? await serve() : null;
const browser = await chromium.launch();
try {
  for (const [device, [width, height]] of Object.entries(VIEWPORTS)) {
    const dir = new URL(`../docs/polish-2026-11/${label}/${device}/`, import.meta.url);
    await mkdir(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500); // let the idle-time scripts (reveal, configurator, booking) start first
    // Scroll through once so lazy images and scroll reveals settle, then capture each section.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(1200);
    for (const [name, sel] of Object.entries(SECTIONS)) {
      const el = page.locator(sel).first();
      if (!(await el.count())) { console.log(`missing ${name}`); continue; }
      await el.scrollIntoViewIfNeeded();
      // A section taller than the screen is never fully in view, so show its scroll reveals as a visitor would see them after scrolling.
      await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach(n => n.classList.add("is-in")));
      // Sticky bars belong to the viewport, not the section: hide them so they don't cover the capture.
      await page.evaluate(hide => document.querySelectorAll("[data-site-header], [data-mobile-book], .build-bar").forEach(n => { n.style.visibility = hide ? "hidden" : ""; }), name !== "hero");
      await page.waitForTimeout(900);
      await el.screenshot({ path: new URL(`${name}.png`, dir).pathname });
    }
    await page.close();
    console.log(`${device} done`);
  }
} finally { await browser.close(); server?.close(); }
