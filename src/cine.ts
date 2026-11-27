import { prefersReducedMotion } from "./motion.js";

const FRAMES = 96;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/**
 * Cinematic hero: the section is tall, its stage is pinned, and scroll scrubs a 96-frame
 * rendered sequence of the wheel coming apart. CSS reads two variables: --m (copy moves away,
 * wheel moves to centre) and --e (explode progress). Frame 0 is the static hero image, so the
 * page paints immediately and the sequence only takes over once frames have loaded.
 */
export function initCine(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-cine-canvas]");
  const still = root.querySelector<HTMLImageElement>(".hero-wheel");
  const count = root.querySelector<HTMLElement>("[data-cine-count]");
  const parts = [...root.querySelectorAll<HTMLElement>("[data-part]")];
  const next = root.nextElementSibling as HTMLElement | null;
  parts.forEach((el, i) => { el.style.left = `${el.dataset.x}%`; el.style.top = `${el.dataset.y}%`; el.style.setProperty("--x", el.dataset.x ?? "0"); el.style.transitionDelay = `${i * 80}ms`; });
  if (!canvas || !still || prefersReducedMotion()) { root.dataset.mode = "static"; return; }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  root.dataset.mode = "live";

  const size = window.innerWidth < 700 ? 600 : 960;
  const frames: (HTMLImageElement | null)[] = Array(FRAMES).fill(null);
  let current = -1, want = 0;

  // Coarse-to-fine loading: every 8th frame, then every 4th, 2nd and the rest, so scrubbing works early.
  const order: number[] = [];
  for (const stride of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += stride) if (!order.includes(i)) order.push(i);
  let next_ = 0;
  const loadNext = (): void => {
    const i = order[next_++]; if (i === undefined) return;
    const img = new Image(); img.decoding = "async";
    img.onload = () => { frames[i] = img; if (Math.abs(i - want) <= 4) draw(want); loadNext(); };
    img.onerror = () => loadNext();
    img.src = `assets/img/hero/seq-${size}/f${String(i).padStart(3, "0")}.webp`;
  };

  const fit = (): void => {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    current = -1; draw(want);
  };
  const nearest = (i: number): number => {
    for (let d = 0; d < FRAMES; d++) { if (frames[i - d]) return i - d; if (frames[i + d]) return i + d; }
    return -1;
  };
  const draw = (i: number): void => {
    const k = nearest(i);
    if (k < 0 || k === current) return;
    current = k;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frames[k]!, 0, 0, canvas.width, canvas.height);
    root.dataset.seq = k > 0 ? "on" : "off";
  };

  let ticking = false;
  const update = (): void => {
    ticking = false;
    const top = root.offsetTop, vh = window.innerHeight;
    // The exploded view holds for half a screen, then the next section slides up over the last 60%.
    const span = Math.max(1, root.offsetHeight - vh * 2.1);
    const p = clamp((window.scrollY - top) / span);
    const m = smooth(0.0, 0.38, p), e = smooth(0.12, 0.88, p);
    root.style.setProperty("--m", m.toFixed(4));
    root.style.setProperty("--e", e.toFixed(4));
    root.dataset.parts = e > 0.94 ? "on" : "off";
    if (count) count.textContent = e < 0.02 ? "Assembled" : e > 0.94 ? "Exploded view" : `Taking it apart · ${Math.round(e * 100)}%`;
    want = Math.round(e * (FRAMES - 1));
    draw(want);
    // Curtain: the following section casts a shadow as it rises over the pinned stage.
    if (next) next.style.setProperty("--rise", clamp(1 - next.getBoundingClientRect().top / vh).toFixed(3));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  window.addEventListener("scroll", onScroll, { passive: true });
  let rt = 0;
  window.addEventListener("resize", () => { window.clearTimeout(rt); rt = window.setTimeout(() => { fit(); update(); }, 150); });
  fit(); update();
  // Two parallel loaders keep the network busy without competing with the rest of the page.
  loadNext(); loadNext();
}
