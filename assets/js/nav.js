export function initNav(header) {
    const button = header.querySelector("[data-menu-button]");
    const menu = header.querySelector("[data-menu]");
    if (!button || !menu)
        return;
    const set = (open) => {
        button.setAttribute("aria-expanded", String(open));
        header.dataset.menu = open ? "open" : "closed";
    };
    button.addEventListener("click", () => set(button.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", e => { if (e.target.closest("a"))
        set(false); });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && header.dataset.menu === "open") {
            set(false);
            button.focus();
        }
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", e => { if (e.matches)
        set(false); });
    set(false);
}
