import { prefersReducedMotion } from "./motion.js";

/**
 * Subtle scroll reveal: content below the fold rises 14 px and fades in once as it enters.
 * Only elements still below the fold when this runs are hidden, so nothing visible ever flashes,
 * and transforms never shift layout. Off with reduced motion or without IntersectionObserver.
 */
export function initReveal(selectors: string[], kind = ""): void {
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
  const fold = window.innerHeight;
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    io.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px" });
  selectors.forEach(sel => {
    let i = 0, lastParent: Element | null = null;
    document.querySelectorAll<HTMLElement>(sel).forEach(el => {
      const box = el.getBoundingClientRect();
      if (box.top < fold || box.width === 0) return;
      // Siblings in the same group stagger by 70 ms, up to four steps.
      i = el.parentElement === lastParent ? i + 1 : 0; lastParent = el.parentElement;
      el.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
      el.dataset.reveal = kind;
      io.observe(el);
    });
  });
}
