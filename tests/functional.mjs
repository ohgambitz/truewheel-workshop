// Functional tests: run with `node tests/functional.mjs`. Uses the preinstalled Playwright.
import { createRequire } from "node:module";
import { serve } from "./serve.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const URL_ = "http://127.0.0.1:4173/";
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); };

const nextWeekday = (wanted) => { const d = new Date(); d.setDate(d.getDate() + 1); while (d.getDay() !== wanted) d.setDate(d.getDate() + 1); const t = new Date(d); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); };

const server = await serve();
const browser = await chromium.launch();
try {
  // Desktop page: console, CSP, links
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", m => { if (m.type() === "error") problems.push(m.text()); });
  page.on("pageerror", e => problems.push(e.message));
  const failed = [];
  page.on("requestfailed", r => failed.push(r.url()));
  const external = [];
  page.on("request", r => { if (!r.url().startsWith(URL_) && !r.url().startsWith("data:")) external.push(r.url()); });
  await page.goto(URL_, { waitUntil: "networkidle" });
  check("no console errors or CSP violations", problems.length === 0, problems.join(" | "));
  check("no failed requests", failed.length === 0, failed.join(", "));
  check("no third-party requests", external.length === 0, external.join(", "));

  const anchors = await page.$$eval("a[href^='#']", as => as.map(a => a.getAttribute("href")));
  const missing = [];
  for (const h of new Set(anchors)) if (h !== "#" && !(await page.$(h))) missing.push(h);
  check("every in-page link has a target", missing.length === 0, missing.join(", "));

  const firstTab = await (async () => { await page.keyboard.press("Tab"); return page.evaluate(() => document.activeElement?.textContent?.trim()); })();
  check("first Tab focuses the skip link", firstTab === "Skip to content", firstTab);

  // Tension chart
  await page.waitForFunction(() => document.querySelector("[data-spread-label]")?.textContent?.includes("after"), null, { timeout: 6000 });
  await page.click("[data-knock]");
  const before = await page.textContent("[data-spread-label]");
  await page.waitForFunction(() => document.querySelector("[data-spread-label]")?.textContent?.includes("after"), null, { timeout: 6000 });
  const spread = await page.textContent("[data-spread-value]");
  check("tension chart re-trues after a knock", before.includes("before") && parseInt(spread) <= 3, `${before} -> ${spread}`);

  // Header state
  check("header is transparent over the hero at the top", (await page.getAttribute("[data-site-header]", "data-over")) === "true");

  // Craft chapter: pinned stage follows the active step
  await page.evaluate(() => document.querySelectorAll("[data-step]")[2].scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(700);
  const readout = await page.textContent("[data-stage-readout]");
  const frame = await page.getAttribute(".stage-frame.is-active", "data-stage-frame");
  check("craft stage shows the step in view", readout === "0.3 mm or less" && frame === "rim", `${readout}, ${frame}`);
  check("header turns solid after the hero", (await page.getAttribute("[data-site-header]", "data-over")) === "false");

  // Configurator maths, deltas, preview
  const total = () => page.getAttribute("[data-quote-total]", "data-value");
  check("default wheelset estimate is $984", (await total()) === "$984", await total());
  const carbonDelta = await page.textContent("label[for='opt-rim-carbon'] .opt-delta");
  check("each option shows its price and weight difference", carbonDelta.includes("+$880") && carbonDelta.includes("150 g"), carbonDelta);
  await page.click("label[for='opt-rim-carbon']");
  check("choosing Carbon rims gives $1,864", (await total()) === "$1,864", await total());
  await page.waitForFunction(() => document.querySelector("[data-preview] img.is-front")?.currentSrc.includes("carbon-28"), null, { timeout: 5000 }).catch(() => {});
  const front = await page.$eval("[data-preview] img.is-front", i => i.currentSrc);
  check("the preview switches to the carbon render", front.includes("wheel-carbon-28"), front.split("/").pop());
  await page.click("label[for='opt-spokes-32']");
  await page.waitForFunction(() => document.querySelector("[data-preview] img.is-front")?.currentSrc.includes("carbon-32"), null, { timeout: 5000 }).catch(() => {});
  check("the preview follows the spoke count", (await page.$eval("[data-preview] img.is-front", i => i.currentSrc)).includes("wheel-carbon-32"));
  await page.click("label[for='opt-hub-ck-r45']");
  const lead = await page.textContent("[data-quote-lead]");
  check("Chris King hubs add a week to lead time", lead === "Ready in 14 to 17 days", lead);
  const missingRenders = [];
  for (const rim of ["alloy", "carbon", "carbon-aero"]) for (const n of [24, 28, 32]) for (const w of [600, 1100]) {
    const r = await page.request.get(`${URL_}assets/img/studio/wheel-${rim}-${n}-${w}.webp`); if (r.status() !== 200) missingRenders.push(`${rim}-${n}-${w}`);
  }
  check("all 18 configurator render files exist", missingRenders.length === 0, missingRenders.join(", "));
  await page.click("[data-book-build]");
  const svcChecked = await page.isChecked("#svc-build"), notes = await page.inputValue("#bNotes");
  check("Book this build prefills the form", svcChecked && notes.includes("Carbon rims") && notes.includes("Chris King"), notes);

  // Booking: day chips and summary
  const chipCount = await page.$$eval("[data-date-chips] .day", c => c.length);
  await page.click("[data-date-chips] .day >> nth=1");
  const chipDate = await page.getAttribute("[data-date-chips] .day >> nth=1", "data-date");
  const pressed = await page.getAttribute("[data-date-chips] .day >> nth=1", "aria-pressed");
  const summary = await page.textContent("[data-booking-summary]");
  check("day chips fill the date and the summary updates", chipCount === 6 && (await page.inputValue("#bDate")) === chipDate && pressed === "true" && summary.includes("Custom wheel build") && summary.includes("drop-off"), summary);
  await page.fill("#bDate", "");

  // Booking form: validation and not-connected state
  await page.fill("#bName", ""); await page.fill("#bEmail", "nope");
  await page.click("form.bk button[type=submit]");
  const errs = await page.$$eval(".err", es => es.map(e => e.textContent).filter(Boolean));
  const focused = await page.evaluate(() => document.activeElement?.id);
  check("empty submit shows inline errors and focuses the first", errs.length === 3 && focused === "bName", `${errs.length} errors, focus ${focused}`);
  await page.fill("#bName", "Sam"); await page.fill("#bEmail", "sam@example.com"); await page.fill("#bDate", nextWeekday(1));
  await page.click("form.bk button[type=submit]");
  check("Monday drop-off is rejected", (await page.textContent("#eDate")).includes("closed"));
  await page.fill("#bDate", nextWeekday(3));
  await page.click("form.bk button[type=submit]");
  const st = await page.getAttribute("form.bk", "data-state"), msg = await page.textContent("[data-form-status]");
  check("without an endpoint the form says nothing was sent", st === "not-connected" && msg.includes("not sent"), msg);

  // Booking form: real submission states against a mocked endpoint
  for (const [code, expect] of [[200, "success"], [500, "error"]]) {
    const p2 = await ctx.newPage();
    await p2.route("https://booking.example/**", async r => { await new Promise(s => setTimeout(s, 400)); await r.fulfill({ status: code, body: "{}" }); });
    await p2.goto(URL_, { waitUntil: "networkidle" });
    await p2.evaluate(() => document.querySelector("form.bk").dataset.endpoint = "https://booking.example/requests");
    // re-initialise the form so it reads the configured endpoint
    await p2.evaluate(async () => { const m = await import("./assets/js/booking.js"); const f = document.querySelector("form.bk"); const clone = f.cloneNode(true); f.replaceWith(clone); m.initBooking(clone); });
    await p2.fill("#bName", "Sam"); await p2.fill("#bEmail", "sam@example.com"); await p2.fill("#bDate", nextWeekday(4));
    await p2.click("form.bk button[type=submit]");
    const busy = await p2.getAttribute("form.bk", "data-state");
    const disabled = await p2.$eval("form.bk button[type=submit]", b => b.disabled);
    await p2.waitForFunction(s => document.querySelector("form.bk").dataset.state === s, expect, { timeout: 5000 });
    const text = await p2.textContent("[data-form-status]");
    check(`endpoint ${code}: loading state then ${expect}`, busy === "submitting" && disabled && text.length > 10, text);
    await p2.close();
  }

  // Mobile menu
  const m = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await m.goto(URL_, { waitUntil: "networkidle" });
  const hiddenBefore = await m.isHidden("#site-menu");
  await m.click("[data-menu-button]");
  const shown = await m.isVisible("#site-menu"), exp = await m.getAttribute("[data-menu-button]", "aria-expanded");
  await m.click("#site-menu a[href='#services']");
  const closed = await m.isHidden("#site-menu");
  await m.click("[data-menu-button]"); await m.keyboard.press("Escape");
  const escClosed = await m.isHidden("#site-menu");
  check("mobile menu opens, closes on link and on Escape", hiddenBefore && shown && exp === "true" && closed && escClosed);
  const hiddenTop = await m.getAttribute(".mobile-book", "data-hidden");
  await m.evaluate(() => document.getElementById("services").scrollIntoView({ behavior: "instant" })); await m.waitForTimeout(500);
  const shownMid = await m.getAttribute(".mobile-book", "data-hidden");
  check("mobile booking bar hides over the hero and shows mid-page", hiddenTop === "true" && shownMid === "false", `${hiddenTop} -> ${shownMid}`);
  await m.evaluate(() => document.querySelector(".build-steps fieldset:nth-of-type(2)").scrollIntoView({ behavior: "instant" })); await m.waitForTimeout(600);
  const barVisible = await m.isVisible(".build-bar"), barTotal = await m.getAttribute(".build-bar [data-quote-total]", "data-value");
  const bookBar = await m.getAttribute(".mobile-book", "data-hidden");
  check("in the builder, phones get a sticky total bar instead", barVisible && barTotal === "$984" && bookBar === "true", `${barVisible}, ${barTotal}, ${bookBar}`);
  await m.close();
} finally {
  await browser.close(); server.close();
}
const failedCount = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failedCount}/${results.length} checks passed`);
process.exit(failedCount ? 1 : 0);
