/**
 * Craft chapter: the stage stays pinned while each tolerance scrolls past; the active step swaps the stage image
 * and readout. Without IntersectionObserver (or with reduced motion) every step still shows its own content.
 */
export function initCraftChapter(root: HTMLElement): void {
  const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
  const frames = [...root.querySelectorAll<HTMLElement>("[data-stage-frame]")];
  const readout = root.querySelector<HTMLElement>("[data-stage-readout]");
  const label = root.querySelector<HTMLElement>("[data-stage-label]");
  if (!steps.length || !frames.length || !("IntersectionObserver" in window)) return;
  root.dataset.enhanced = "true";
  const activate = (step: HTMLElement): void => {
    steps.forEach(s => s.classList.toggle("is-active", s === step));
    const frame = step.dataset.frame;
    frames.forEach(f => f.classList.toggle("is-active", f.dataset.stageFrame === frame));
    if (readout) readout.textContent = step.dataset.value ?? "";
    if (label) label.textContent = step.dataset.label ?? "";
  };
  const io = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target as HTMLElement);
  }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01] });
  steps.forEach(s => io.observe(s));
  activate(steps[0]);
}

/** Header: transparent over the dark hero, solid once the hero has scrolled away. */
export function initHeaderState(header: HTMLElement, hero: HTMLElement | null): void {
  // The header stays transparent while the dark hero is behind it. The next section rises over the
  // pinned hero, so the switch follows that section's top edge rather than the hero's visibility.
  const after = hero?.nextElementSibling;
  if (!after) { header.dataset.over = "false"; return; }
  let ticking = false;
  const update = () => { ticking = false; header.dataset.over = String(after.getBoundingClientRect().top > header.offsetHeight); };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
