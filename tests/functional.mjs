// Functional tests: run with `node tests/functional.mjs`. Uses the preinstalled Playwright.
import { createRequire } from "node:module";
import { serve } from "./serve.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const URL_ = process.env.TEST_URL ?? "http://127.0.0.1:4173/";
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
  // The knock throws the readings out, the wheel is trued spoke by spoke, then it settles and announces the result.
  await page.waitForFunction(() => document.querySelector("[data-tension-chart]")?.dataset.phase === "truing", null, { timeout: 3000 });
  const knocked = parseInt(await page.textContent("[data-spread-value]"));
  await page.waitForFunction(() => document.querySelector("[data-tension-chart]")?.dataset.phase === "true", null, { timeout: 6000 });
  const spread = parseInt(await page.textContent("[data-spread-value]"));
  const announced = await page.textContent("[data-spread-live]");
  check("tension chart knocks out, trues spoke by spoke and announces once", knocked > 5 && spread <= 3 && announced.startsWith("Trued."), `${knocked}% -> ${spread}%, "${announced}"`);

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
  const fb = await page.evaluate(() => ({
    spec: [...document.querySelectorAll("[data-spec] li")].map(l => l.querySelector(".v").textContent + (l.classList.contains("is-changed") ? "*" : "")).join(" | "),
    flashed: document.querySelector("[data-quote-lines] div.is-changed dt")?.textContent,
    weights: [...document.querySelectorAll("[data-quote-weight]")].map(w => w.textContent),
  }));
  check("the spec readout and quote line flag the part just changed", fb.spec.includes("Carbon*") && fb.flashed === "Rims, pair", `${fb.spec}; flashed ${fb.flashed}`);
  check("the quote shows the estimated weight next to the total", fb.weights.length === 2 && fb.weights.every(w => w === fb.weights[0] && /^\d[\d,]* g$/.test(w)), fb.weights.join(", "));
  await page.waitForFunction(() => document.querySelector("[data-preview] img.is-front")?.currentSrc.includes("carbon-28"), null, { timeout: 5000 }).catch(() => {});
  const front = await page.$eval("[data-preview] img.is-front", i => i.currentSrc);
  check("the preview switches to the carbon render", front.includes("wheel-carbon-28"), front.split("/").pop());
  await page.click("label[for='opt-spokes-32']");
  await page.waitForFunction(() => document.querySelector("[data-preview] img.is-front")?.currentSrc.includes("carbon-32"), null, { timeout: 5000 }).catch(() => {});
  check("the preview follows the spoke count", (await page.$eval("[data-preview] img.is-front", i => i.currentSrc)).includes("wheel-carbon-32"));
  await page.click("label[for='opt-hub-ck-r45']");
  const lead = await page.textContent("[data-quote-lead]");
  check("Chris King hubs add a week to lead time", lead === "Ready in 14 to 17 days", lead);
  // Fetched from inside the page so it uses the browser's network path (works against the local server and the live site).
  const missingRenders = await page.evaluate(async () => {
    const missing = [];
    for (const rim of ["alloy", "carbon", "carbon-aero"]) for (const n of [24, 28, 32]) for (const w of [600, 1100]) {
      const r = await fetch(`assets/img/studio/wheel-${rim}-${n}-${w}.webp`, { method: "HEAD", cache: "no-store" }); if (!r.ok) missing.push(`${rim}-${n}-${w}`);
    }
    return missing;
  });
  check("all 18 configurator render files exist", missingRenders.length === 0, missingRenders.join(", "));
  await page.click("[data-book-build]");
  const svcChecked = await page.isChecked("#svc-build"), notes = await page.inputValue("#bNotes");
  check("Book this build prefills the form", svcChecked && notes.includes("Carbon rims") && notes.includes("Chris King"), notes);

  // Compatibility rules: the part picked last wins; anything it conflicts with changes, with the reason shown beside the step.
  const pickOpt = id => page.click(`label[for='${id}']`);
  const on = id => page.isChecked(`#${id}`);
  const d29 = await page.textContent("#opt-size-29-d"); // build is 700c, Carbon, Chris King R45, 32 here
  await pickOpt("opt-size-29");
  const notice1 = await page.textContent(".compat");
  check("29 inch with a road hub swaps the hub and says why", (await on("opt-hub-dt-350")) && d29.includes("sets DT Swiss 350") && notice1.includes("Chris King R45 is a road hub"), `option said "${d29}"; notice "${notice1}"`);
  await pickOpt("opt-hub-shimano-105");
  check("Shimano 105 hubs bring the build back to a road size with 32 spokes", (await on("opt-size-700c")) && (await on("opt-spokes-32")), await page.textContent(".compat"));
  await pickOpt("opt-spokes-24");
  check("then picking 24 spokes changes the hubs instead", (await on("opt-hub-dt-350")) && (await page.textContent(".compat")).includes("32 spokes"), await page.textContent(".compat"));
  // Every option's stated price difference must match what choosing it does to the total.
  const mismatches = [];
  for (const id of ["opt-size-650b", "opt-size-29", "opt-rim-carbon-aero", "opt-hub-ck-r45", "opt-spokes-32", "opt-hub-shimano-105", "opt-size-29", "opt-rim-alloy", "opt-spokes-28"]) {
    const before = parseInt((await total()).replace(/\D/g, ""));
    const said = await page.textContent(`#${id}-d`);
    const m = said.match(/([+−])\$([\d,]+)/);
    const expected = said.startsWith("Same price") || said === "Selected" ? 0 : m ? (m[1] === "+" ? 1 : -1) * parseInt(m[2].replace(/,/g, "")) : NaN;
    await pickOpt(id);
    const after = parseInt((await total()).replace(/\D/g, ""));
    if (after - before !== expected) mismatches.push(`${id}: said "${said}", total ${before} -> ${after}`);
  }
  check("every option's stated difference matches the real change, including parts it swaps", mismatches.length === 0, mismatches.join("; ") || "9 options checked");
  await pickOpt("opt-rim-carbon-aero");
  const prof = await page.evaluate(() => [document.querySelector("[data-profile-depth]").textContent, document.querySelector("[data-profile-bsd]").textContent, document.querySelector("[data-profile-body]").style.transform]);
  check("the rim profile redraws to the chosen depth", prof[0] === "45 mm" && prof[1] === "622 mm" && /^scaleY\(1(\.0+)?\)$/.test(prof[2]), prof.join(", "));
  // Downloadable spec: a real PDF whose text matches the build on screen.
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 10000 }), page.click("[data-download-spec]")]);
  const { tmpdir } = await import("node:os"); const { readFileSync } = await import("node:fs"); const { execFileSync } = await import("node:child_process");
  const pdfPath = tmpdir() + "/truewheel-spec-test.pdf"; await dl.saveAs(pdfPath);
  const pdf = readFileSync(pdfPath);
  let pdfText = ""; try { pdfText = execFileSync("pdftotext", ["-layout", pdfPath, "-"]).toString(); } catch (e) { pdfText = "pdftotext failed: " + e.message; }
  const shownTotal = await total(), shownHub = await page.$eval("[data-spec] li:nth-child(3) .v", e => e.textContent);
  check("Download build spec gives a valid PDF with this build's parts and total",
    pdf.subarray(0, 5).toString() === "%PDF-" && /^truewheel-build-TW-[A-Z0-9]+\.pdf$/.test(dl.suggestedFilename()) && pdfText.includes(shownTotal) && pdfText.includes(shownHub) && pdfText.includes("Carbon aero") && pdfText.includes("bead seat"),
    `${dl.suggestedFilename()}, ${pdf.length} bytes, total ${shownTotal}, hub ${shownHub}`);

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
