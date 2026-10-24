// Profile page (/profil/): dummy profile hero + menu (Passport bottom sheet,
// Merchandise, Edit Profile, Ubah Password, Logout). PROTOTYPE: the profile is static demo
// data and needs no login. Edits apply to this page view only, the password
// form only validates (there is no account service), and Logout ends the demo
// session from js/auth.js, if any.
import { logout } from "./auth.js";
import { isIndonesianMobile } from "./redeem-data.js";

const profile = {
  name: "Avanelle Wijaya",
  handle: "@avanelle",
  phone: "+62 812 3456 7890",
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Close a dialog; bottom sheets slide down first (see .sheet in pages.css). */
const closeDialog = (dialog) => {
  if (!dialog.open || dialog.classList.contains("is-closing")) return;
  if (!dialog.hasAttribute("data-sheet") || reducedMotion.matches) {
    dialog.close();
    return;
  }
  dialog.classList.add("is-closing");
  dialog.addEventListener("animationend", () => {
    dialog.classList.remove("is-closing");
    dialog.close();
  }, { once: true });
};

const setError = (form, name, message) => {
  const input = form.elements[name];
  input.setAttribute("aria-invalid", String(Boolean(message)));
  form.querySelector(`[data-error-for="${name}"]`).textContent = message;
  return !message;
};

export const init = (root) => {
  const dialogs = Object.fromEntries([...root.querySelectorAll("[data-dialog]")].map((dialog) => [dialog.dataset.dialog, dialog]));
  const profileForm = root.querySelector("[data-profile-form]");
  const passwordForm = root.querySelector("[data-password-form]");

  const paint = () => {
    root.querySelectorAll("[data-profile-field]").forEach((element) => {
      element.textContent = profile[element.dataset.profileField];
    });
  };

  const resetForm = (form) => {
    form.querySelectorAll("[aria-invalid]").forEach((input) => setError(form, input.name, ""));
    form.querySelector("[data-form-status]").textContent = "";
  };

  root.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-dialog-open]");
    if (opener) {
      const name = opener.dataset.dialogOpen;
      if (name === "edit") {
        resetForm(profileForm);
        for (const key of Object.keys(profile)) profileForm.elements[key].value = profile[key];
      }
      if (name === "password") {
        passwordForm.reset();
        resetForm(passwordForm);
      }
      dialogs[name].showModal();
      return;
    }
    if (event.target.closest("[data-dialog-close]")) closeDialog(event.target.closest("dialog"));
  });

  Object.values(dialogs).forEach((dialog) => {
    // Backdrop clicks land on the dialog itself. A sheet's own box can be the
    // target too (its padding), so check the click is outside its rectangle.
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) closeDialog(dialog);
    });
    // Escape: animate sheets out instead of closing at once.
    dialog.addEventListener("cancel", (event) => {
      if (!dialog.hasAttribute("data-sheet")) return;
      event.preventDefault();
      closeDialog(dialog);
    });
  });

  // Show / hide password.
  root.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
    const input = passwordForm.elements[toggle.getAttribute("aria-controls")];
    toggle.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
    });
  });

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(profileForm));
    const handle = data.handle.trim().replace(/^@?/, "@");
    const valid = [
      setError(profileForm, "name", data.name.trim().length >= 2 ? "" : "Isi nama lengkap lo."),
      setError(profileForm, "handle", /^@[A-Za-z0-9._]{3,20}$/.test(handle) ? "" : "Username 3–20 karakter: huruf, angka, titik, atau garis bawah."),
      setError(profileForm, "phone", isIndonesianMobile(data.phone) ? "" : "Gunakan nomor HP Indonesia, contoh 0812 3456 7890."),
    ].every(Boolean);
    if (!valid) {
      profileForm.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    Object.assign(profile, { name: data.name.trim(), handle, phone: data.phone.trim() });
    paint();
    closeDialog(dialogs.edit);
  });

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(passwordForm));
    const strong = data.next.length >= 8 && /[A-Za-z]/.test(data.next) && /\d/.test(data.next);
    const valid = [
      setError(passwordForm, "current", data.current ? "" : "Isi password lo sekarang."),
      setError(passwordForm, "next", !strong
        ? "Minimal 8 karakter, campuran huruf dan angka."
        : data.next === data.current ? "Password baru harus beda dari yang lama." : ""),
      setError(passwordForm, "confirm", data.confirm && data.confirm === data.next ? "" : "Konfirmasi belum sama dengan password baru."),
    ].every(Boolean);
    const status = passwordForm.querySelector("[data-form-status]");
    if (!valid) {
      status.textContent = "";
      passwordForm.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    passwordForm.reset();
    status.textContent = "Password berhasil diganti.";
  });

  dialogs.logout.addEventListener("close", () => {
    if (dialogs.logout.returnValue !== "logout") return;
    logout();
    window.location.assign("/");
  });

  paint();
};
