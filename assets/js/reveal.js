import { prefersReducedMotion } from "./motion.js";
export function initReveal(selectors) {
    if (prefersReducedMotion() || !("IntersectionObserver" in window))
        return;
    const fold = window.innerHeight;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
        if (!e.isIntersecting)
            return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px" });
    selectors.forEach(sel => {
        let i = 0, lastParent = null;
        document.querySelectorAll(sel).forEach(el => {
            if (el.getBoundingClientRect().top < fold)
                return;
            i = el.parentElement === lastParent ? i + 1 : 0;
            lastParent = el.parentElement;
            el.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
            el.dataset.reveal = "";
            io.observe(el);
        });
    });
}
