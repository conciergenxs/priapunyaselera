// Shipping step for merch redemption (/loyalty/tukar/?item=…).
// Form values auto-save into the redemption draft, so leaving and returning
// keeps them. Points are deducted and the order created only after the final
// confirmation modal; the draft's token makes that step idempotent.
// Prototype: the order lives in the browser's demo member state.
import { getState, update, logActivity, formatPoints, escapeHtml } from "./store.js";
import {
  findMerch, merchImage, successUrl, newReference, addressSummary,
  PROVINCES, isIndonesianMobile, isEmail, ORDER_STEPS,
} from "./redeem-data.js";
import { openModal } from "./modal.js";

const FIELDS = ["name", "phone", "email", "street", "province", "city", "district", "postal", "note"];

const RULES = {
  name: (v) => (v.trim().length >= 3 ? "" : "Isi nama lengkap penerima."),
  phone: (v) => (!v.trim() ? "Isi nomor WhatsApp." : isIndonesianMobile(v) ? "" : "Gunakan nomor HP Indonesia, contoh 0812 3456 7890."),
  email: (v) => (!v.trim() ? "Isi alamat email." : isEmail(v) ? "" : "Format email belum benar, contoh nama@email.com."),
  street: (v) => (v.trim().length >= 10 ? "" : "Tulis alamat lengkap: jalan, nomor rumah, RT/RW."),
  province: (v) => (PROVINCES.includes(v) ? "" : "Pilih provinsi."),
  city: (v) => (v.trim().length >= 3 ? "" : "Isi kota atau kabupaten."),
  district: (v) => (v.trim().length >= 3 ? "" : "Isi kecamatan."),
  postal: (v) => (/^\d{5}$/.test(v.trim()) ? "" : "Kode pos terdiri dari 5 angka."),
  note: () => "",
};

const renderNotFound = (root) => {
  root.querySelector("[data-checkout]").innerHTML = `
    <div class="receipt">
      <h2 class="receipt__title">Merchandise nggak ketemu</h2>
      <p class="receipt__text">Tautannya mungkin salah. Pilih merchandise lagi dari halaman Loyalty.</p>
      <div class="modal__actions"><a class="btn btn--primary" href="/loyalty/">Kembali ke Loyalty</a></div>
    </div>`;
};

const init = (root) => {
  const item = findMerch(new URLSearchParams(location.search).get("item"));
  if (!item) {
    renderNotFound(root);
    return;
  }

  // Resume the draft for this item, or start one (e.g. when opened from a link).
  update((state) => {
    if (state.redemptionDraft?.itemId !== item.id) {
      state.redemptionDraft = { itemId: item.id, token: crypto.randomUUID(), form: state.redemptionDraft?.form ?? {} };
    }
  });

  const form = root.querySelector("[data-shipping-form]");
  const status = form.querySelector("[data-form-status]");
  const submit = form.querySelector("[type=submit]");

  // Summary card.
  root.querySelector("[data-summary]").innerHTML = `
    <img src="${merchImage(item, 400)}" alt="${escapeHtml(item.alt)}" width="400" height="400">
    <div>
      <p class="checkout-item__name">${escapeHtml(item.name)}</p>
      <p class="checkout-item__points">${formatPoints(item.points)} Poin</p>
    </div>`;
  const paintBalance = () => {
    const { points } = getState();
    const rest = points - item.points;
    root.querySelector("[data-points-needed]").textContent = `${formatPoints(item.points)} Poin`;
    root.querySelector("[data-balance]").textContent = `${formatPoints(points)} Poin`;
    root.querySelector("[data-rest]").textContent = rest < 0 ? "Poin kurang" : `${formatPoints(rest)} Poin`;
    root.querySelector("[data-rest]").closest("div").classList.toggle("is-short", rest < 0);
    return rest >= 0;
  };
  // Not enough points: say so up front instead of after the form is filled.
  if (!paintBalance()) {
    submit.disabled = true;
    status.textContent = `Poin lo kurang ${formatPoints(item.points - getState().points)} untuk menukar ${item.name}.`;
  }

  // Province options, then fill values: draft first, profile as a fallback.
  const province = form.elements.province;
  province.insertAdjacentHTML("beforeend", PROVINCES.map((name) => `<option>${escapeHtml(name)}</option>`).join(""));
  const { redemptionDraft, profile } = getState();
  const saved = redemptionDraft.form ?? {};
  const fallback = { name: profile?.name ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" };
  for (const name of FIELDS) form.elements[name].value = saved[name] ?? fallback[name] ?? "";

  const touched = new Set();
  const setError = (name, message) => {
    const input = form.elements[name];
    input.setAttribute("aria-invalid", String(Boolean(message)));
    form.querySelector(`[data-error-for="${name}"]`).textContent = message;
  };
  const check = (name) => {
    const message = RULES[name](form.elements[name].value);
    setError(name, message);
    return !message;
  };

  form.addEventListener("input", (event) => {
    const { name } = event.target;
    if (!FIELDS.includes(name)) return;
    update((state) => {
      if (state.redemptionDraft) state.redemptionDraft.form = { ...state.redemptionDraft.form, [name]: event.target.value };
    });
    if (touched.has(name)) check(name);
  });

  form.addEventListener("focusout", (event) => {
    const { name } = event.target;
    if (!FIELDS.includes(name) || !event.target.value) return;
    // Heading for the action buttons: submit validates everything anyway, and
    // showing an error now would shift the button mid-click.
    if (event.relatedTarget?.closest(".form__actions")) return;
    touched.add(name);
    check(name);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    FIELDS.forEach((name) => touched.add(name));
    const invalid = FIELDS.filter((name) => !check(name));
    if (invalid.length) {
      status.textContent = `Ada ${invalid.length} isian yang perlu dicek.`;
      form.elements[invalid[0]].focus();
      return;
    }
    if (!paintBalance()) {
      status.textContent = `Poin lo kurang ${formatPoints(item.points - getState().points)} untuk menukar ${item.name}.`;
      return;
    }
    status.textContent = "";
    openFinalConfirm(item, Object.fromEntries(FIELDS.map((name) => [name, form.elements[name].value.trim()])), submit);
  });
};

const openFinalConfirm = (item, data, submit) => {
  const address = { street: data.street, district: data.district, city: data.city, province: data.province, postal: data.postal };
  let busy = false;
  const dialog = openModal(`
    <div class="modal__body">
      <h2 class="modal__title" id="final-title">Konfirmasi Penukaran</h2>
      <div class="modal__item">
        <img src="${merchImage(item, 400)}" alt="" width="400" height="400">
        <div>
          <p class="modal__item-name">${escapeHtml(item.name)}</p>
          <p class="modal__points">${formatPoints(item.points)} Poin</p>
        </div>
      </div>
      <dl class="modal__summary">
        <div><dt>Total poin ditukar</dt><dd>${formatPoints(item.points)} Poin</dd></div>
        <div><dt>Penerima</dt><dd>${escapeHtml(data.name)}</dd></div>
        <div><dt>Alamat</dt><dd>${escapeHtml(addressSummary(address))}</dd></div>
      </dl>
      <p class="modal__text">Pastikan data pengiriman lo sudah benar sebelum menyelesaikan penukaran.</p>
      <p class="modal__alert" role="alert" data-error hidden></p>
      <div class="modal__actions">
        <button class="btn btn--primary" type="button" data-confirm>Ya, Konfirmasi</button>
        <button class="btn btn--outline" type="button" data-modal-close autofocus>Periksa Kembali</button>
      </div>
    </div>`, { labelledBy: "final-title", canDismiss: () => !busy, onClose: () => submit.focus() });

  const confirm = dialog.querySelector("[data-confirm]");
  const back = dialog.querySelector("[data-modal-close]");
  const error = dialog.querySelector("[data-error]");

  confirm.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    confirm.disabled = back.disabled = true;
    confirm.textContent = "Memproses…";
    dialog.setAttribute("aria-busy", "true");

    let order = null;
    let failure = "";
    update((state) => {
      state.orders ??= [];
      const token = state.redemptionDraft?.token;
      // Already placed with this draft (double click, second tab): reuse it.
      order = state.orders.find((entry) => token && entry.token === token) ?? null;
      if (order) return;
      if (state.points < item.points) {
        failure = `Poin lo kurang ${formatPoints(item.points - state.points)} untuk menukar ${item.name}.`;
        return;
      }
      const now = new Date().toISOString();
      order = {
        id: newReference("PPS-ORD", state.orders.map((entry) => entry.id)),
        token, itemId: item.id, name: item.name, points: item.points, createdAt: now,
        status: ORDER_STEPS[0], trackingNumber: null, mock: true,
        recipient: { name: data.name, phone: data.phone, email: data.email },
        address: { ...address, note: data.note },
      };
      state.points -= item.points;
      state.orders.unshift(order);
      state.transactions.unshift({
        id: order.id, orderId: order.id, shop: "merch", date: now, total: item.points, status: ORDER_STEPS[0],
        items: [{ id: item.id, name: item.name, qty: 1, points: item.points }],
      });
      logActivity(state, "merch", `Menukar ${item.name}`, -item.points);
      delete state.redemptionDraft;
    });

    if (!order) {
      busy = false;
      back.disabled = false;
      confirm.textContent = "Ya, Konfirmasi";
      dialog.removeAttribute("aria-busy");
      error.textContent = failure || "Penukaran belum bisa disimpan. Coba lagi.";
      error.hidden = false;
      back.focus();
      return;
    }
    // Replace history so Back from the success page can't resubmit this form.
    location.replace(successUrl(order.id));
  });
};

init(document.querySelector("main"));
