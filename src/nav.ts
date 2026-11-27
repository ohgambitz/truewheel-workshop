/** Mobile menu: a disclosure button that opens the section links; closes on link click, Escape or wide screens. */
export function initNav(header: HTMLElement): void {
  const button = header.querySelector<HTMLButtonElement>("[data-menu-button]");
  const menu = header.querySelector<HTMLElement>("[data-menu]");
  if (!button || !menu) return;
  const set = (open: boolean): void => {
    button.setAttribute("aria-expanded", String(open));
    header.dataset.menu = open ? "open" : "closed";
  };
  button.addEventListener("click", () => set(button.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", e => { if ((e.target as HTMLElement).closest("a")) set(false); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && header.dataset.menu === "open") { set(false); button.focus(); }
  });
  window.matchMedia("(min-width: 861px)").addEventListener("change", e => { if (e.matches) set(false); });
  set(false);
}
