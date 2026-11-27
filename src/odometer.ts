import { prefersReducedMotion } from "./motion.js";

/**
 * Rolling-digit display (like a mechanical counter). The element keeps the value in data-value and aria-label,
 * so screen readers and tests read the plain value; each digit is a column of 0-9 that slides into place.
 */
export function setOdometer(el: HTMLElement, text: string): void {
  if (el.dataset.value === text) return;
  el.dataset.value = text;
  el.setAttribute("aria-label", text);
  const reduce = prefersReducedMotion();
  const chars = [...text];
  // Rebuild only when the shape (length or separator positions) changes; otherwise roll the existing columns.
  const shape = chars.map(c => (/\d/.test(c) ? "d" : c)).join("");
  if (el.dataset.shape !== shape) {
    el.dataset.shape = shape;
    el.replaceChildren(...chars.map(c => {
      const cell = document.createElement("span");
      cell.setAttribute("aria-hidden", "true");
      if (!/\d/.test(c)) { cell.className = "odo-sep"; cell.textContent = c; return cell; }
      cell.className = "odo-digit";
      const reel = document.createElement("span");
      reel.className = "odo-reel";
      for (let n = 0; n <= 9; n++) { const d = document.createElement("span"); d.textContent = String(n); reel.append(d); }
      cell.append(reel);
      return cell;
    }));
  }
  const reels = el.querySelectorAll<HTMLElement>(".odo-reel");
  let i = 0;
  chars.forEach(c => {
    if (!/\d/.test(c)) return;
    const reel = reels[i++];
    reel.style.transitionDuration = reduce ? "0ms" : "";
    reel.style.transform = `translateY(${-Number(c) * 10}%)`;
  });
}
