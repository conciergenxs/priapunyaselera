// Login (/masuk/) and Register (/daftar/) forms. Both keep the ?next= return
// address on the switch link and go back to it after success (home when there
// is none). Prototype: fields only need to be filled in; see js/auth.js.
import { login, register, safeNext, authUrl, LOGIN_PATH, REGISTER_PATH } from "./auth.js";

/** Why the member was sent here, from where they were headed. */
const reasonFor = (next) => {
  const url = new URL(next, location.origin);
  const action = url.searchParams.get("lanjut") ?? "";
  if (url.pathname.startsWith("/artikel/baca")) return "Masuk dulu buat baca artikel ini dan kumpulin poinnya.";
  if (action.startsWith("merch:")) return "Masuk dulu buat tukar merchandise.";
  if (action.startsWith("pass:")) return "Masuk dulu buat tukar Exclusive Pass.";
  if (action.startsWith("daftar:")) return "Masuk dulu buat daftar event.";
  if (url.pathname.startsWith("/loyalty/")) return "Masuk dulu buat tukar poin lo.";
  if (url.pathname !== "/") return "Masuk dulu buat lanjut.";
  return "";
};

const setError = (form, name, message) => {
  const input = form.elements[name];
  input.setAttribute("aria-invalid", String(Boolean(message)));
  form.querySelector(`[data-error-for="${name}"]`).textContent = message;
  return !message;
};

export const init = (root) => {
  const form = root.querySelector("[data-auth-form]");
  const mode = form.dataset.authForm; // "login" | "register"
  const next = safeNext(new URLSearchParams(location.search).get("next"));

  // Switch link keeps the return address, so changing forms never loses it.
  root.querySelector("[data-auth-switch]").href = authUrl(mode === "login" ? REGISTER_PATH : LOGIN_PATH, next);

  const notice = root.querySelector("[data-auth-reason]");
  const reason = reasonFor(next);
  if (reason) {
    notice.textContent = mode === "login" ? reason : reason.replace("Masuk dulu", "Bikin akun dulu");
    notice.hidden = false;
  }

  // Password fields are masked text fields (.field__input--masked), so browsers
  // and password managers don't offer saved or generated passwords, or ask to
  // save the account. Without CSS masking support, fall back to a real
  // password field so the value is never shown in plain text.
  const cssMask = CSS.supports("-webkit-text-security", "disc");
  root.querySelectorAll(".field__input--masked").forEach((input) => {
    if (!cssMask) input.type = "password";
  });

  // Show / hide password.
  root.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
    const input = form.elements[toggle.getAttribute("aria-controls")];
    toggle.addEventListener("click", () => {
      const show = toggle.getAttribute("aria-pressed") !== "true";
      if (cssMask) input.classList.toggle("is-revealed", show);
      else input.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
    });
  });

  // Clear a field's error as soon as it is edited.
  form.addEventListener("input", (event) => {
    if (event.target.getAttribute("aria-invalid") === "true") setError(form, event.target.name, "");
  });

  const MESSAGES = {
    username: "Isi username.",
    phone: "Isi nomor WhatsApp.",
    identifier: "Isi username atau nomor WhatsApp.",
    password: "Isi password.",
  };

  // Required fields only: any filled-in value is accepted (prototype).
  const validate = (data) => Object.keys(data)
    .map((name) => setError(form, name, data[name].trim() ? "" : MESSAGES[name]))
    .every(Boolean);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!validate(data)) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    if (mode === "register") register(data);
    else login(data);
    // Leave nothing filled in for a browser to offer to save on the next page.
    form.reset();
    location.replace(next);
  });
};
