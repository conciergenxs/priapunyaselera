// Event list: category filter chips and per-event registration.
// Registering needs an account: js/account.js sends logged-out visitors to
// Login, and on the way back ?lanjut=daftar:<event> finishes the registration.
import { getState, update, onChange, logActivity } from "./store.js";
import { takeAction } from "./auth.js";

export const init = (root) => {
  const chips = [...root.querySelectorAll("[data-filter]")];
  const rows = [...root.querySelectorAll("[data-event]")];
  const count = root.querySelector("[data-event-count]");

  const applyFilter = (value) => {
    let shown = 0;
    chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.filter === value)));
    rows.forEach((row) => {
      row.hidden = value !== "semua" && row.dataset.category !== value;
      if (!row.hidden) shown += 1;
    });
    if (count) count.textContent = `${shown} event`; // the count line is optional in the markup
  };

  const paintRegistrations = (state) => {
    rows.forEach((row) => {
      const button = row.querySelector("[data-register]");
      const registered = state.registeredEvents.includes(row.dataset.event);
      button.setAttribute("aria-pressed", String(registered));
      button.textContent = registered ? "Terdaftar" : "Daftar";
    });
  };

  root.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-filter]");
    if (chip) {
      applyFilter(chip.dataset.filter);
      return;
    }
    const button = event.target.closest("[data-register]");
    if (button) setRegistered(button.closest("[data-event]"));
  });

  /** Register for (or, with `on` omitted, toggle) the event in `row`. */
  const setRegistered = (row, on) => {
    const title = row.querySelector("h3").textContent.trim();
    update((state) => {
      const registered = state.registeredEvents.includes(row.dataset.event);
      if (on === registered) return;
      state.registeredEvents = registered
        ? state.registeredEvents.filter((id) => id !== row.dataset.event)
        : [...state.registeredEvents, row.dataset.event];
      logActivity(state, "event", `${registered ? "Membatalkan pendaftaran" : "Mendaftar"} ${title}`);
    });
  };

  onChange(paintRegistrations);
  paintRegistrations(getState());
  applyFilter("semua");

  // Back from Login: finish the registration the member started.
  const action = takeAction();
  const row = action?.startsWith("daftar:") && rows.find((entry) => entry.dataset.event === action.slice(7));
  if (row) {
    setRegistered(row, true);
    row.scrollIntoView({ block: "center" });
    row.querySelector("[data-register]").focus({ preventScroll: true });
  }
};
