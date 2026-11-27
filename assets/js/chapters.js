export function initCraftChapter(root) {
    const steps = [...root.querySelectorAll("[data-step]")];
    const frames = [...root.querySelectorAll("[data-stage-frame]")];
    const readout = root.querySelector("[data-stage-readout]");
    const label = root.querySelector("[data-stage-label]");
    if (!steps.length || !frames.length || !("IntersectionObserver" in window))
        return;
    root.dataset.enhanced = "true";
    const activate = (step) => {
        steps.forEach(s => s.classList.toggle("is-active", s === step));
        const frame = step.dataset.frame;
        frames.forEach(f => f.classList.toggle("is-active", f.dataset.stageFrame === frame));
        if (readout)
            readout.textContent = step.dataset.value ?? "";
        if (label)
            label.textContent = step.dataset.label ?? "";
    };
    const io = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible)
            activate(visible.target);
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01] });
    steps.forEach(s => io.observe(s));
    activate(steps[0]);
}
export function initHeaderState(header, hero) {
    const after = hero?.nextElementSibling;
    if (!after) {
        header.dataset.over = "false";
        return;
    }
    let ticking = false;
    const update = () => { ticking = false; header.dataset.over = String(after.getBoundingClientRect().top > header.offsetHeight); };
    window.addEventListener("scroll", () => { if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
    } }, { passive: true });
    update();
}
