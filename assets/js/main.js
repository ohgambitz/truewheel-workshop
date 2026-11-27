import { initBooking } from "./booking.js";
import { initConfigurator } from "./configurator.js";
import { initNav } from "./nav.js";
import { initTensionChart } from "./tension-chart.js";
const header = document.querySelector("[data-site-header]");
if (header)
    initNav(header);
const chart = document.querySelector("[data-tension-chart]");
if (chart)
    initTensionChart(chart);
const form = document.querySelector("[data-booking-form]");
const booking = form ? initBooking(form) : null;
const builder = document.querySelector("[data-configurator]");
if (builder)
    initConfigurator(builder, q => booking?.prefillBuild(q));
const year = document.querySelector("[data-year]");
if (year)
    year.textContent = String(new Date().getFullYear());
const bar = document.querySelector("[data-mobile-book]");
const targets = [document.querySelector(".hero"), document.getElementById("book"), document.querySelector("footer")].filter((t) => !!t);
if (bar && targets.length && "IntersectionObserver" in window) {
    const onScreen = new Set();
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)));
        bar.dataset.hidden = String(onScreen.size > 0);
    });
    targets.forEach(t => io.observe(t));
}
