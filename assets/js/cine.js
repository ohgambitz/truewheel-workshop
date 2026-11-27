import { prefersReducedMotion } from "./motion.js";
const FRAMES = 96;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function initCine(root) {
    const canvas = root.querySelector("[data-cine-canvas]");
    const still = root.querySelector(".hero-wheel");
    const count = root.querySelector("[data-cine-count]");
    const parts = [...root.querySelectorAll("[data-part]")];
    const next = root.nextElementSibling;
    parts.forEach((el, i) => { el.style.left = `${el.dataset.x}%`; el.style.top = `${el.dataset.y}%`; el.style.setProperty("--x", el.dataset.x ?? "0"); el.style.transitionDelay = `${i * 80}ms`; });
    if (!canvas || !still || prefersReducedMotion()) {
        root.dataset.mode = "static";
        return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    root.dataset.mode = "live";
    const size = window.innerWidth < 700 ? 600 : 960;
    const frames = Array(FRAMES).fill(null);
    let current = -1, want = 0;
    const order = [];
    for (const stride of [8, 4, 2, 1])
        for (let i = 0; i < FRAMES; i += stride)
            if (!order.includes(i))
                order.push(i);
    let next_ = 0;
    const loadNext = () => {
        const i = order[next_++];
        if (i === undefined)
            return;
        const img = new Image();
        img.decoding = "async";
        img.onload = () => { frames[i] = img; if (Math.abs(i - want) <= 4)
            draw(want); loadNext(); };
        img.onerror = () => loadNext();
        img.src = `assets/img/hero/seq-${size}/f${String(i).padStart(3, "0")}.webp`;
    };
    const fit = () => {
        const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
        current = -1;
        draw(want);
    };
    const nearest = (i) => {
        for (let d = 0; d < FRAMES; d++) {
            if (frames[i - d])
                return i - d;
            if (frames[i + d])
                return i + d;
        }
        return -1;
    };
    const draw = (i) => {
        const k = nearest(i);
        if (k < 0 || k === current)
            return;
        current = k;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[k], 0, 0, canvas.width, canvas.height);
        root.dataset.seq = k > 0 ? "on" : "off";
    };
    let ticking = false;
    const update = () => {
        ticking = false;
        const top = root.offsetTop, vh = window.innerHeight;
        const span = Math.max(1, root.offsetHeight - vh * 2.1);
        const p = clamp((window.scrollY - top) / span);
        const m = smooth(0.0, 0.38, p), e = smooth(0.12, 0.88, p);
        root.style.setProperty("--m", m.toFixed(4));
        root.style.setProperty("--e", e.toFixed(4));
        root.dataset.parts = e > 0.94 ? "on" : "off";
        if (count)
            count.textContent = e < 0.02 ? "Assembled" : e > 0.94 ? "Exploded view" : `Taking it apart · ${Math.round(e * 100)}%`;
        want = Math.round(e * (FRAMES - 1));
        draw(want);
        if (next)
            next.style.setProperty("--rise", clamp(1 - next.getBoundingClientRect().top / vh).toFixed(3));
    };
    const onScroll = () => { if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
    } };
    window.addEventListener("scroll", onScroll, { passive: true });
    let rt = 0;
    window.addEventListener("resize", () => { window.clearTimeout(rt); rt = window.setTimeout(() => { fit(); update(); }, 150); });
    fit();
    update();
    loadNext();
    loadNext();
}
