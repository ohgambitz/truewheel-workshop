export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
