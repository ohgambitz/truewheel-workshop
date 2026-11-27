export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
