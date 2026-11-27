const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLOSED_DAYS = new Set([0, 1]);
const localISODate = (d) => {
    const t = new Date(d);
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    return t.toISOString().slice(0, 10);
};
export function initBooking(form) {
    const el = form.elements;
    const name = el.namedItem("name");
    const email = el.namedItem("email");
    const service = el.namedItem("service");
    const date = el.namedItem("date");
    const bike = el.namedItem("bike");
    const notes = el.namedItem("notes");
    const submit = form.querySelector("button[type=submit]");
    const status = form.querySelector("[data-form-status]");
    const endpoint = (form.dataset.endpoint ?? "").trim();
    date.min = localISODate(new Date());
    const setError = (input, msg) => {
        const out = document.getElementById(input.getAttribute("aria-describedby") ?? "");
        if (out)
            out.textContent = msg;
        input.setAttribute("aria-invalid", msg ? "true" : "false");
        return !msg;
    };
    const validate = () => {
        const okName = setError(name, name.value.trim() ? "" : "Add your name so we know who to expect.");
        const okEmail = setError(email, EMAIL.test(email.value.trim()) ? "" : "Enter an email address, like you@example.com.");
        let dateMsg = "";
        if (!date.value)
            dateMsg = "Choose a drop-off day.";
        else if (date.value < date.min)
            dateMsg = "Choose today or a later day.";
        else if (CLOSED_DAYS.has(new Date(date.value + "T12:00").getDay()))
            dateMsg = "We're closed Sunday and Monday. Choose Tuesday to Saturday.";
        const okDate = setError(date, dateMsg);
        if (!okName)
            name.focus();
        else if (!okEmail)
            email.focus();
        else if (!okDate)
            date.focus();
        return okName && okEmail && okDate;
    };
    const show = (state, message = "") => {
        form.dataset.state = state;
        submit.disabled = state === "submitting";
        submit.textContent = state === "submitting" ? "Sending request…" : "Request drop-off";
        status.hidden = state === "idle" || state === "submitting";
        status.dataset.tone = state === "success" ? "success" : state === "error" ? "error" : "info";
        status.textContent = message;
    };
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validate()) {
            show("idle");
            return;
        }
        const payload = {
            name: name.value.trim(), email: email.value.trim(), service: service.value,
            date: date.value, bike: bike.value.trim(), notes: notes.value.trim(),
        };
        if (!endpoint) {
            show("not-connected", "Online booking isn't switched on yet, so this request was not sent. Your details are still in the form.");
            return;
        }
        show("submitting");
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok)
                throw new Error("HTTP " + res.status);
            const day = new Date(payload.date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
            form.reset();
            date.min = localISODate(new Date());
            show("success", "Request sent for " + day + ". We reply by email to confirm the slot.");
        }
        catch {
            show("error", "The request didn't go through. Check your connection and try again; your details are still in the form.");
        }
    });
    [name, email, date].forEach(i => i.addEventListener("input", () => {
        if (i.getAttribute("aria-invalid") === "true")
            setError(i, "");
    }));
    return {
        prefillBuild: (q) => {
            service.value = "Custom wheel build";
            notes.value = "Wheelset: " + q.summary + ". Estimate $" + q.total.toLocaleString("en-US") + ", " + q.leadText.toLowerCase() + ".";
        },
    };
}
