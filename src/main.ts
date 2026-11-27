import { initBooking } from "./booking.js";
import { initCraftChapter, initHeaderState } from "./chapters.js";
import { initConfigurator } from "./configurator.js";
import { initNav } from "./nav.js";
import { initReveal } from "./reveal.js";
import { initTensionChart } from "./tension-chart.js";

const header = document.querySelector<HTMLElement>("[data-site-header]");
const hero = document.querySelector<HTMLElement>("[data-hero]");
if (header) { initNav(header); initHeaderState(header, hero); }

// Everything below the first screen starts when the browser is idle, so it never competes with the hero paint.
const idle = (fn: () => void): void => {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (ric) ric(fn, { timeout: 1500 }); else window.setTimeout(fn, 200);
};
const afterLoad = (fn: () => void): void => { if (document.readyState === "complete") idle(fn); else window.addEventListener("load", () => idle(fn), { once: true }); };

const chart = document.querySelector<HTMLElement>("[data-tension-chart]");
if (chart) afterLoad(() => initTensionChart(chart));

const craft = document.querySelector<HTMLElement>("[data-craft]");
const form = document.querySelector<HTMLFormElement>("[data-booking-form]");
const builder = document.querySelector<HTMLElement>("[data-configurator]");
idle(() => {
  if (craft) initCraftChapter(craft);
  const booking = form ? initBooking(form) : null;
  if (builder) initConfigurator(builder, q => booking?.prefillBuild(q));
  initReveal([".sec-head", ".svc", ".build-steps fieldset", ".quote", ".card-rows li", ".bk", ".faq-head", ".faq details", "footer .fgrid > *"]);
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

// Mobile booking bar: hidden while the hero, the builder (which has its own total bar), the booking form or the footer is on screen.
const bar = document.querySelector<HTMLElement>("[data-mobile-book]");
const targets = [hero, builder, document.getElementById("book"), document.querySelector("footer")].filter((t): t is HTMLElement => !!t);
if (bar && targets.length && "IntersectionObserver" in window) {
  const onScreen = new Set<Element>();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
    bar.dataset.hidden = String(onScreen.size > 0);
  });
  targets.forEach(t => io.observe(t));
}
