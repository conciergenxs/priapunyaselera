// Loyalty page redemption entry points.
// Merch: detail modal → confirmation modal → shipping page (no points move yet).
// Exclusive Pass: confirmation modal → points deducted once → success modal.
// Both need an account: js/account.js sends logged-out visitors to Login, and
// on the way back ?lanjut=merch:<item> or ?lanjut=pass:<pass> reopens the item.
// Prototype: everything is saved in the browser's demo member state.
import { getState, update, logActivity, formatPoints, escapeHtml } from "./store.js";
import { takeAction } from "./auth.js";
import { findMerch, merchImage, shippingUrl, newReference } from "./redeem-data.js";
import { openModal, closeIcon, checkIcon } from "./modal.js";

const shortfallText = (needed, balance) =>
  `Poin lo kurang ${formatPoints(needed - balance)} lagi. Kumpulin dari event, artikel, dan aktivitas lainnya.`;

const balanceRows = (needed, balance) => `
  <dl class="modal__summary">
    <div><dt>Poin dibutuhkan</dt><dd>${formatPoints(needed)} Poin</dd></div>
    <div><dt>Poin lo</dt><dd>${formatPoints(balance)} Poin</dd></div>
  </dl>`;

/* Merchandise ------------------------------------------------------------- */

const openMerchConfirm = (item) => {
  const { points: balance } = getState();
  const short = balance < item.points;
  openModal(`
    <div class="modal__body">
      <h2 class="modal__title" id="merch-confirm-title">Tukar Merchandise Ini?</h2>
      <p class="modal__text">Lo yakin ingin menukar ${escapeHtml(item.name)} dengan ${formatPoints(item.points)} poin? Penukaran yang sudah dikonfirmasi tidak dapat dibatalkan.</p>
      ${short ? `<p class="modal__alert" role="alert">${shortfallText(item.points, balance)}</p>` : ""}
      <div class="modal__actions">
        <button class="btn btn--primary" type="button" data-confirm ${short ? "disabled" : ""}>Ya, Tukar</button>
        <button class="btn btn--outline" type="button" data-modal-close autofocus>Kembali</button>
      </div>
    </div>`, { labelledBy: "merch-confirm-title", size: "sm" })
    .querySelector("[data-confirm]")
    .addEventListener("click", (event) => {
      event.currentTarget.disabled = true;
      // Start (or resume) the shipping step. Points move only after the final confirmation there.
      update((state) => {
        if (state.redemptionDraft?.itemId !== item.id) {
          state.redemptionDraft = { itemId: item.id, token: crypto.randomUUID(), form: state.redemptionDraft?.form ?? {} };
        }
      });
      location.assign(shippingUrl(item.id));
    });
};

const openMerchDetail = (item) => {
  const { points: balance } = getState();
  const short = balance < item.points;
  openModal(`
    <button class="modal__close" type="button" data-modal-close aria-label="Tutup">${closeIcon}</button>
    <div class="modal__body modal__product">
      <div class="modal__media">
        <img src="${merchImage(item)}" alt="${escapeHtml(item.alt)}" width="800" height="800">
      </div>
      <div class="modal__info">
        <h2 class="modal__title" id="merch-detail-title">${escapeHtml(item.name)}</h2>
        <p class="modal__points">${formatPoints(item.points)} Poin</p>
        <p class="modal__text">${escapeHtml(item.description)}</p>
        <dl class="modal__summary">
          ${item.details.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
          <div><dt>Poin lo</dt><dd>${formatPoints(balance)} Poin</dd></div>
        </dl>
        ${short ? `<p class="modal__alert" role="alert">${shortfallText(item.points, balance)}</p>` : ""}
        <div class="modal__actions">
          <button class="btn btn--primary" type="button" data-redeem ${short ? "disabled" : ""}>Tukar Merchandise</button>
          <button class="btn btn--outline" type="button" data-modal-close>Tutup</button>
        </div>
      </div>
    </div>`, { labelledBy: "merch-detail-title", size: "wide" })
    .querySelector("[data-redeem]")
    .addEventListener("click", () => openMerchConfirm(item));
};

/* Exclusive Pass ---------------------------------------------------------- */

const passFromTicket = (ticket) => ({
  id: ticket.dataset.pass,
  name: ticket.querySelector(".ticket__title").textContent.trim(),
  dateLabel: ticket.querySelector(".ticket__date").textContent.trim(),
  points: Number(ticket.dataset.points),
  endsOn: ticket.dataset.ends,
  image: ticket.querySelector(".ticket__poster").currentSrc,
  position: ticket.querySelector(".ticket__poster").style.objectPosition,
});

const hasEnded = (endsOn) => new Date(`${endsOn}T23:59:59+07:00`) < new Date();

const openPassSuccess = (pass, redemption) => {
  openModal(`
    <div class="modal__body modal__center">
      <span class="modal__icon">${checkIcon}</span>
      <h2 class="modal__title" id="pass-success-title">Exclusive Pass Berhasil Ditukar!</h2>
      <p class="modal__text">Penukaran pass lo berhasil dicatat. Tim PPS akan menghubungi lo melalui WhatsApp untuk informasi selanjutnya.</p>
      <dl class="modal__summary">
        <div><dt>Pass</dt><dd>${escapeHtml(pass.name)}</dd></div>
        <div><dt>Poin ditukar</dt><dd>${formatPoints(pass.points)} Poin</dd></div>
        <div><dt>No. penukaran</dt><dd>${escapeHtml(redemption.id)}</dd></div>
      </dl>
      <p class="modal__note">Prototipe: penukaran ini disimpan di browser lo dan belum diproses sistem PPS.</p>
      <div class="modal__actions">
        <button class="btn btn--primary" type="button" data-modal-close autofocus>Mengerti</button>
      </div>
    </div>`, { labelledBy: "pass-success-title", size: "sm" });
};

const openPassConfirm = (pass) => {
  const state = getState();
  const balance = state.points;
  const already = (state.passRedemptions ?? []).find((entry) => entry.passId === pass.id);
  const ended = hasEnded(pass.endsOn);
  const short = balance < pass.points;
  const blocked = already || ended || short;
  const reason = already
    ? `Lo sudah menukar pass ini (${escapeHtml(already.id)}). Satu akun bisa menukar satu pass per acara.`
    : ended ? "Acara ini sudah berakhir, jadi pass-nya nggak bisa ditukar lagi."
      : short ? shortfallText(pass.points, balance) : "";

  let busy = false;
  const dialog = openModal(`
    <div class="modal__poster"><img src="${pass.image}" alt="" style="object-position: ${pass.position}"></div>
    <div class="modal__body">
      <h2 class="modal__title" id="pass-confirm-title">Tukar Exclusive Pass?</h2>
      <p class="modal__text">Lo yakin ingin menukar ${escapeHtml(pass.name)} dengan ${formatPoints(pass.points)} poin?</p>
      <dl class="modal__summary">
        <div><dt>Pass</dt><dd>${escapeHtml(pass.name)}</dd></div>
        <div><dt>Tanggal</dt><dd>${escapeHtml(pass.dateLabel)}</dd></div>
        <div><dt>Poin dibutuhkan</dt><dd>${formatPoints(pass.points)} Poin</dd></div>
        <div><dt>Poin lo</dt><dd>${formatPoints(balance)} Poin</dd></div>
      </dl>
      ${blocked ? `<p class="modal__alert" role="alert">${reason}</p>` : ""}
      <p class="modal__alert" role="alert" data-error hidden></p>
      <div class="modal__actions">
        <button class="btn btn--primary" type="button" data-confirm ${blocked ? "disabled" : ""}>Ya, Tukar Pass</button>
        <button class="btn btn--outline" type="button" data-modal-close autofocus>Batal</button>
      </div>
    </div>`, { labelledBy: "pass-confirm-title", canDismiss: () => !busy });

  const confirm = dialog.querySelector("[data-confirm]");
  const cancel = dialog.querySelector("[data-modal-close]");
  const error = dialog.querySelector("[data-error]");

  confirm.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    confirm.disabled = cancel.disabled = true;
    confirm.textContent = "Memproses…";
    dialog.setAttribute("aria-busy", "true");

    let redemption = null;
    let failure = "";
    update((draft) => {
      draft.passRedemptions ??= [];
      // Re-check against the latest state (another tab may have changed it).
      if (draft.passRedemptions.some((entry) => entry.passId === pass.id)) { failure = "Pass ini sudah lo tukar sebelumnya."; return; }
      if (draft.points < pass.points) { failure = shortfallText(pass.points, draft.points); return; }
      const now = new Date().toISOString();
      redemption = {
        id: newReference("PPS-PASS", draft.passRedemptions.map((entry) => entry.id)),
        passId: pass.id, name: pass.name, points: pass.points, date: now, mock: true,
      };
      draft.points -= pass.points;
      draft.passRedemptions.unshift(redemption);
      draft.transactions.unshift({
        id: redemption.id, shop: "pass", date: now, total: pass.points, status: "Menunggu dihubungi",
        items: [{ id: pass.id, name: pass.name, qty: 1, points: pass.points }],
      });
      logActivity(draft, "pass", `Menukar ${pass.name}`, -pass.points);
    });

    if (!redemption) {
      busy = false;
      cancel.disabled = false;
      confirm.textContent = "Ya, Tukar Pass";
      dialog.removeAttribute("aria-busy");
      error.textContent = failure;
      error.hidden = false;
      cancel.focus();
      return;
    }
    busy = false;
    dialog.close();
    openPassSuccess(pass, redemption);
  });
};

/* Wiring ------------------------------------------------------------------ */

const init = (root) => {
  root.addEventListener("click", (event) => {
    const merch = event.target.closest("[data-redeem-merch]");
    if (merch) {
      const item = findMerch(merch.dataset.redeemMerch);
      if (item) openMerchDetail(item);
      return;
    }
    const ticket = event.target.closest("[data-redeem-pass]");
    if (ticket) openPassConfirm(passFromTicket(ticket.closest(".ticket")));
  });

  // Back from Login (or from a homepage merch card): open what was chosen.
  const action = takeAction() ?? "";
  const [kind, id] = action.split(":");
  const trigger = kind === "merch" ? root.querySelector(`[data-redeem-merch="${CSS.escape(id)}"]`)
    : kind === "pass" ? root.querySelector(`[data-pass="${CSS.escape(id)}"] [data-redeem-pass]`) : null;
  if (trigger) {
    trigger.closest(".merch-card, .ticket").scrollIntoView({ block: "center" });
    trigger.click();
  }
};

init(document.querySelector("main"));
